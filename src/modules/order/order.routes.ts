import { Router } from "express";
import * as orderController from "./order.controller.js";
import {
  createOrderValidator,
  orderIdValidator,
  updateOrderStatusValidator,
  cancelOrderValidator,
} from "./order.validator.js";
import { validate } from "../../shared/middleware/validate.js";
import { requireAuth, requireAdmin } from "../../shared/middleware/auth.middleware.js";

const router = Router();

// Customer — own orders only
router.post(
  "/",
  requireAuth,
  createOrderValidator,
  validate,
  orderController.createOrder,
);

router.get("/", requireAuth, orderController.getOrders);

router.get(
  "/:id",
  requireAuth,
  orderIdValidator,
  validate,
  orderController.getOrderById,
);

router.post(
  "/:id/cancel",
  requireAuth,
  cancelOrderValidator,
  validate,
  orderController.cancelOrder,
);

// Admin — all orders
router.get(
  "/admin/all",
  requireAuth,
  requireAdmin,
  orderController.getAllOrders,
);

router.patch(
  "/admin/:id/status",
  requireAuth,
  requireAdmin,
  updateOrderStatusValidator,
  validate,
  orderController.updateOrderStatus,
);

router.post(
  "/admin/:id/cancel",
  requireAuth,
  requireAdmin,
  cancelOrderValidator,
  validate,
  orderController.adminCancelOrder,
);

export default router;