import User from "../model/User.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/email.js";
import jwt from "jsonwebtoken";
const registerUser = async (req, res) => {
  //get data
  //validate
  //check if user already exist
  //create a user in database
  //create a verification token
  //save token in daatabase
  //send token as email to user
  //send success status to user
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User alreadye exist",
      });
    }
    const user = await User.create({ name, email, password });
    if (!user) {
      return res.status(400).json({
        message: "User not registered",
      });
    }
    const token = crypto.randomBytes(32).toString("hex");
    console.log(token);
    user.verificationToken = token;
    await user.save(); // user saved in db await use because always remember backend dusre continent m hai
    // send email
    // const transporter = nodemailer.createTransport({
    //   host: process.env.MAILTRAP_HOST,
    //   port: process.env.MAILTRAP_PORT,
    //   secure: false, // true for port 465, false for other ports
    //   auth: {
    //     user: process.env.MAILTRAP_USERNAME,
    //     pass: process.env.MAILTRAP_PASSWORD,
    //   },
    // });
    // const mailOption = {
    //   from: process.env.MAILTRAP_SENDERMAIL, // sender address
    //   to: user.email, // not User email
    //   subject: "Verify your email", // Subject line
    //   text: `Please click on the following link:${process.env.BASE_URL}/api/v1/users/verify/${token}`, // plain text body
    // };
    // await transporter.sendMail(mailOption);

    const verficationLink = `${process.env.BASE_URL}/api/v1/users/verify/${token}`;
    await sendEmail(
      user.email,
      "Verify your email",
      `Please click the following link:${verficationLink}`
    );
    res.status(201).json({
      message:
        "user registered succesfully.Please check your email to verify youraccount.",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "internally server error",
      error,
      success: false,
    });
  }
};
const verifyUser = async (req, res) => {
  //get tokenfrom url
  //vaidate
  //find user based on token
  //if not
  //set isVerified field to true
  //remove verification token
  //save //return response
  const { token } = req.params;
  // console.log(token);
  if (!token) {
    return res.status(400).json({ message: "Invalid token" });
  }
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }
    user.isVerfied = true;
    user.verificationToken = undefined;
    await user.save();
    res
      .status(200)
      .json({ message: "Email verified successfully", success: true });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "all fields are required",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "invalid email orpassword",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role }, // Payload (User Data)
      "shhhh", // Secret Key
      { expiresIn: "24h" } // Expiration Time
    );
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    };
    res.cookie("token", token, cookieOptions);
    res.status(200).json({
      success: true,
      message: "login done",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    //generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();
    // create reset link
    const resetLink = `${process.env.BASE_URL}/api/v1/users/reset-password/${resetToken}`;
    await sendEmail(
      user.email,
      "Reset your password",
      `Click the link to reset your password: ${resetLink}`
    );
  } catch {}
};
export { registerUser, verifyUser, login, forgotPassword };
