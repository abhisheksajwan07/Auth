import User from "../model/User.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/email.js";
import jwt from "jsonwebtoken";

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ name, email, password });
    if (!user) {
      return res.status(400).json({ message: "User registration failed" });
    }
    const token = crypto.randomBytes(32).toString("hex");
    user.verificationToken = token;
    await user.save();

    const verificationLink = `${process.env.BASE_URL}/api/v1/users/verify/${token}`;
    await sendEmail(
      user.email,
      "Verify your email",
      `Click the link to verify: ${verificationLink}`
    );
    res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      success: true,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error, success: false });
  }
};

const verifyUser = async (req, res) => {
  const { token } = req.params;
  if (!token) return res.status(400).json({ message: "Invalid token" });
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res
      .status(200)
      .json({ message: "Email verified successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "All fields are required" });
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();
    const resetLink = `${process.env.BASE_URL}/api/v1/users/reset-password/${resetToken}`;
    await sendEmail(
      user.email,
      "Reset your password",
      `Click the link to reset your password: ${resetLink}`
    );
    res
      .status(200)
      .json({ message: "Password reset link sent", success: true });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  if (!newPassword)
    return res.status(400).json({ message: "New password is required" });
  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res
      .status(200)
      .json({ message: "Password reset successful", success: true });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", success: false });
  }
};

export { registerUser, verifyUser, login, forgotPassword, resetPassword };
