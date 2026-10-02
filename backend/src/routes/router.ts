import { Router } from "express";
import {
  MeController,
  DemoController,
  AdminController,
  OrderController,
  StreamController,
  ProductController,
  CheckoutController,
} from "@/controllers";
import { requireAuth, requireAdmin } from "@/middlewares/auth";

export const router = Router();
const meController = new MeController();
const demoController = new DemoController();
const adminController = new AdminController();
const orderController = new OrderController();
const streamController = new StreamController();
const productController = new ProductController();
const checkoutController = new CheckoutController();

router.get("/me", requireAuth, meController.getMe);

router.get("/demo/status", demoController.getStatus);
router.post("/demo/sign-in-token", demoController.createSignInToken);

router.get("/products", productController.listProducts);
router.get("/products/categories", productController.getCategories);
router.get("/products/:slug", productController.getProductBySlug);

router.post("/stream/token", requireAuth, streamController.createStreamToken);

router.post("/checkout", requireAuth, checkoutController.createCheckout);

router.get("/admin/imagekit/auth", requireAdmin, adminController.getImageKitAuth);
router.get("/admin/products", requireAdmin, adminController.listAdminProducts);
router.post("/admin/products", requireAdmin, adminController.createAdminProduct);
router.patch("/admin/products/:id", requireAdmin, adminController.updateAdminProduct);
router.delete("/admin/products/:id", requireAdmin, adminController.deleteAdminProduct);

router.get("/orders", requireAuth, orderController.listOrders);
router.get("/orders/:id", requireAuth, orderController.getOrder);
router.post("/orders/:id/stream-channel", requireAuth, orderController.createStreamChannel);
router.post("/orders/:id/video-invite", requireAuth, orderController.createVideoInvite);
