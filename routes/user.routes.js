import express from "express";
import {
  registerUser,
  verifyUser,
  login,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controller/user.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";
const router = express.Router();
router.post("/register", registerUser);
router.get("/verify/:token", verifyUser);
router.post("/login", login);
router.get("/me", isLoggedIn, getMe);
router.get
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
export default router;
