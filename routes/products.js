import express from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
} from "../controllers/productController.js";
import verifyToken from "../middlewares/verifyToken.js";
import isAdmin from "../middlewares/isAdmin.js"; // kalau kamu punya sistem role
import { upload } from "../middlewares/upload.js";

const router = express.Router();

router.get("/", getProducts);
router.post("/", verifyToken, isAdmin, upload.array("images"), createProduct);
router.put("/:id", verifyToken, isAdmin, upload.array("images"), updateProduct);
router.delete("/:id", verifyToken, isAdmin, deleteProduct);
router.delete("/:id/images", verifyToken, isAdmin, deleteProductImage);

export default router;
