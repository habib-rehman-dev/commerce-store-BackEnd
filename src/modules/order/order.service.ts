import mongoose, { Types } from "mongoose";
import { Order } from "./order.model.js";
import { Cart } from "../cart/cart.model.js";
import { Product } from "../product/product.model.js";
import { Address } from "../address/address.model.js";
import { Coupon } from "../coupon/coupon.model.js";
import { type IProductVariant } from "../product/product.types.js";
import { type IOrderItem } from "./order.types.js";

type VariantWithId = IProductVariant & { _id: Types.ObjectId };

export const createOrder = async (
  userId: string,
  input: { addressId: string; couponCode?: string; paymentMethod: "stripe" | "cod" },
) => {
  const cart = await Cart.findOne({ userId });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const address = await Address.findOne({ _id: input.addressId, userId });

  if (!address) {
    throw new Error("Address not found");
  }

  // Cash on Delivery only makes sense when a courier can physically
  // collect cash — that's only possible for domestic Pakistan orders.
  if (
    input.paymentMethod === "cod" &&
    address.country.trim().toLowerCase() !== "pakistan"
  ) {
    throw new Error(
      "Cash on Delivery is only available for orders shipping within Pakistan",
    );
  }

  /*
   * Everything below MUST succeed together or not at all: reserving
   * stock, applying a coupon, creating the order, and clearing the
   * cart. A mongoose session ties these into one atomic transaction —
   * if any step throws, session.abortTransaction() rolls EVERYTHING
   * back, so you never end up with stock decremented but no order,
   * or an order with no stock actually reserved.
   */
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const orderItems: IOrderItem[] = [];

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId).session(
        session,
      );

      if (!product) {
        throw new Error("A product in your cart no longer exists");
      }

      const variant = (
        product.variants as unknown as VariantWithId[]
      ).find((v) => v._id.toString() === cartItem.variantId.toString());

      if (!variant) {
        throw new Error("A variant in your cart no longer exists");
      }

      // Atomic, conditional decrement — only succeeds if enough stock
      // is STILL available right now (handles two people checking out
      // the last unit at the same time).
      const stockResult = await Product.updateOne(
        {
          _id: cartItem.productId,
          "variants._id": cartItem.variantId,
          "variants.stock": { $gte: cartItem.quantity },
        },
        { $inc: { "variants.$.stock": -cartItem.quantity } },
        { session },
      );

      if (stockResult.modifiedCount === 0) {
        throw new Error(`Insufficient stock for SKU ${variant.sku}`);
      }

      const unitPrice = variant.discountPrice ?? variant.price;

      orderItems.push({
        productId: new Types.ObjectId(cartItem.productId),
        variantId: cartItem.variantId,
        productName: product.name,
        sku: variant.sku,
        attributes:
          variant.attributes instanceof Map
            ? Object.fromEntries(variant.attributes)
            : variant.attributes ?? {},
        unitPrice,
        quantity: cartItem.quantity,
        lineTotal: unitPrice * cartItem.quantity,
      });
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);

    let discount = 0;

    if (input.couponCode) {
      const coupon = await Coupon.findOne({
        code: input.couponCode.toUpperCase(),
      }).session(session);

      if (!coupon || coupon.status !== "active") {
        throw new Error("Invalid or inactive coupon code");
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        throw new Error("This coupon has expired");
      }

      if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
        throw new Error("This coupon has reached its usage limit");
      }

      if (
        coupon.minOrderValue !== undefined &&
        subtotal < coupon.minOrderValue
      ) {
        throw new Error(
          `This coupon requires a minimum order of ${coupon.minOrderValue}`,
        );
      }

      discount =
        coupon.discountType === "percentage"
          ? subtotal * (coupon.discountValue / 100)
          : Math.min(coupon.discountValue, subtotal);

      await Coupon.updateOne(
        { _id: coupon._id },
        { $inc: { usedCount: 1 } },
        { session },
      );
    }

    // TODO: real shipping calculation — flat $0 for now (international
    // shipping cost usually depends on weight/destination/carrier API)
    const shippingFee = 0;
    const total = subtotal - discount + shippingFee;

    const [order] = await Order.create(
      [
        {
          userId,
          items: orderItems,
          shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            ...(address.addressLine2 !== undefined && {
              addressLine2: address.addressLine2,
            }),
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          },
          subtotal,
          discount,
          ...(input.couponCode !== undefined && {
            couponCode: input.couponCode.toUpperCase(),
          }),
          shippingFee,
          total,
          currency: "usd",
          paymentMethod: input.paymentMethod,
        },
      ],
      { session },
    );

    await Cart.updateOne(
      { userId },
      { items: [] },
      { session },
    );

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getOrders = async (userId: string) => {
  return Order.find({ userId }).sort({ createdAt: -1 }).lean();
};

export const getOrderById = async (userId: string, orderId: string) => {
  return Order.findOne({ _id: orderId, userId }).lean();
};

// Admin-only reads/writes below — no userId scoping
export const getAllOrders = async () => {
  return Order.find().sort({ createdAt: -1 }).lean();
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
) => {
  const order = await Order.findById(orderId);

  if (!order) return null;

  const updateData: Record<string, unknown> = { status };

  /*
   * For Cash on Delivery, there is no online payment step — the money
   * changes hands at the door. So "paid" for a COD order is defined as
   * "the courier just delivered it", not some earlier checkout step.
   * This is what keeps the Review module's verified-purchase check
   * (paymentStatus === "paid") working correctly for COD too, with
   * no special-casing needed there.
   */
  if (
    status === "delivered" &&
    order.paymentMethod === "cod" &&
    order.paymentStatus === "pending"
  ) {
    updateData.paymentStatus = "paid";
  }

  return Order.findByIdAndUpdate(orderId, updateData, {
    new: true,
    runValidators: true,
  }).lean();
};

const CANCELLABLE_STATUSES = ["pending", "processing"];

export const cancelOrder = async (
  orderId: string,
  options: { userId?: string; reason?: string },
) => {
  // Ownership check only applies to customer-initiated cancels —
  // when userId is omitted, this is the admin path.
  const order = options.userId
    ? await Order.findOne({ _id: orderId, userId: options.userId })
    : await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentStatus === "paid") {
    throw new Error(
      "Paid orders cannot be cancelled. Once payment is received, the order is final.",
    );
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new Error(
      `Orders can only be cancelled while pending or processing (current status: ${order.status})`,
    );
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Restore stock for every item — mirror image of the decrement
    // that happened at order creation.
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": item.quantity } },
        { session },
      );
    }

    const updated = await Order.findByIdAndUpdate(
      order._id,
      {
        status: "cancelled",
        cancelledAt: new Date(),
        ...(options.reason !== undefined && {
          cancellationReason: options.reason,
        }),
      },
      { new: true, runValidators: true, session },
    );

    await session.commitTransaction();
    return updated;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};