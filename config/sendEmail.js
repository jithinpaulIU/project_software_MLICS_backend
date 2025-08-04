import config from "./config.json" assert { type: "json" };
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import handlebars from "handlebars";
import { readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const transporter = nodemailer.createTransport(config.smtp_options);

const readHTMLFile = async (filePath) => {
  try {
    return await readFile(filePath, { encoding: "utf-8" });
  } catch (err) {
    console.error(`Error reading HTML file: ${err}`);
    throw err;
  }
};

export const sendEmail = async (to, otp) => {
  try {
    await transporter.sendMail({
      from: "noreply.LabIntergrater",
      to,
      subject: "LabIntegrater",
      text: `Your password has been reset to: ${otp}`,
    });
    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
};

export const sendpatientotp = async (to, otp) => {
  try {
    await transporter.sendMail({
      from: "noreply.LabIntergrater",
      to,
      subject: "MLICS patient authentication",
      text: `Your MICR system OTP is: ${otp}`,
    });
    console.log(`Patient OTP email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending patient OTP to ${to}:`, error);
    throw error;
  }
};

export const sendotp = async (email, otp) => {
  try {
    const html = await readHTMLFile(join(__dirname, "sentotp_template.html"));
    const template = handlebars.compile(html);
    const htmlToSend = template({ otp });

    await transporter.sendMail({
      from: "noreply.LabIntergrater",
      to: email,
      subject: "MLICS patient authentication",
      html: htmlToSend,
    });
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending OTP email to ${email}:`, error);
    throw error;
  }
};

export const sendEmailforDoctor = async (email, password) => {
  try {
    const html = await readHTMLFile(join(__dirname, "sentpwd_doctor.html"));
    const template = handlebars.compile(html);
    const htmlToSend = template({ username: email, password });

    await transporter.sendMail({
      from: "noreply.LabIntergrater",
      to: email,
      subject: "MLICS Doctor login Details",
      html: htmlToSend,
    });
    console.log(`Doctor credentials email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending doctor credentials to ${email}:`, error);
    throw error;
  }
};
