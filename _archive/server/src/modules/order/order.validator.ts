import { body, param } from "express-validator";

export const createOrderValidator = [
  body("addressId").isMongoId().withMessage("Invalid address ID"),
  body("couponCode").optional().trim(),
  body("paymentMethod")
    .isIn(["stripe", "cod"])
    .withMessage("paymentMethod must be 'stripe' or 'cod'"),
];

export const orderIdValidator = [
  param("id").isMongoId().withMessage("Invalid order ID"),
];

export const updateOrderStatusValidator = [
  param("id").isMongoId().withMessage("Invalid order ID"),
  body("status")
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid order status"),
];

export const cancelOrderValidator = [
  param("id").isMongoId().withMessage("Invalid order ID"),
  body("cancellationReason").optional().trim().isLength({ max: 500 }),
];