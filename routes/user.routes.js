import express from "express";
import {
  registerUser,
  verifyUser,
  login,forgotPassword,resetPassword
} from "../controller/user.controller.js";
const router = express.Router();
router.post("/register", registerUser);
router.get("/verify/:token", verifyUser);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
export default router;
