import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  secure: false,
  auth: {
    user: process.env.MAILTRAP_USERNAME,
    pass: process.env.MAILTRAP_PASSWORD,
  },
});

const sendEmail = async (to, subject, text) => {
  const mailOption = {
    from: process.env.MAILTRAP_SENDERMAIL, // sender address
    to,
    subject,
    text,
  };
  try {
    await transporter.sendMail(mailOption);
    console.log("email sent succesfully");
  } catch (error) {
    console.error("Email sending error:", error);
  }
};
export {sendEmail};