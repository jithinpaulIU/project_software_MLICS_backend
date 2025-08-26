const config = require("./configmail.json");
const nodemailer = require("nodemailer");
const path = require("path");
const handlebars = require("handlebars");
const fs = require("fs").promises;

// Create transporter with better configuration
const transporter = nodemailer.createTransport({
  ...config.smtp_options,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
  } else {
    console.log("Email transporter is ready to send messages"); //updated link
  }
});

const readHTMLFile = async (filePath) => {
  try {
    return await fs.readFile(filePath, { encoding: "utf-8" });
  } catch (err) {
    console.error(`Error reading HTML file: ${err}`);
    throw err;
  }
};

// Generic email sending function
const sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId} to ${mailOptions.to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${mailOptions.to}:`, error);
    throw error;
  }
};

// Patient OTP Email
const sendPatientOtp = async (to, otp, patientName = "Patient") => {
  try {
    const html = await readHTMLFile(
      path.join(__dirname, "sentotp_template.html")
    );
    const template = handlebars.compile(html);
    const htmlToSend = template({
      otp,
      patientName,
      expirationTime: "5 minutes",
    });

    const mailOptions = {
      from: config.smtp_options.from,
      to,
      subject: "Patient Authentication OTP - Healthcare Portal",
      html: htmlToSend,
      text: `Your patient authentication OTP is: ${otp}\nThis OTP is valid for 5 minutes. Do not share it with anyone.`,
    };

    return await sendEmail(mailOptions);
  } catch (error) {
    console.error(`Error sending patient OTP to ${to}:`, error);
    throw error;
  }
};

// Doctor Credentials Email
const sendDoctorCredentials = async (
  email,
  password,
  doctorName = "Doctor"
) => {
  try {
    const html = await readHTMLFile(
      path.join(__dirname, "sentpwd_doctor.html")
    );
    const template = handlebars.compile(html);
    const htmlToSend = template({
      username: email,
      password,
      doctorName,
      systemUrl: config.system_url,
    });

    const mailOptions = {
      from: config.smtp_options.from,
      to: email,
      subject: "Your Doctor Account Credentials - Healthcare Portal",
      html: htmlToSend,
      text: `Your doctor account has been created.\nUsername: ${email}\nPassword: ${password}\nPlease change your password after first login.`,
    };

    return await sendEmail(mailOptions);
  } catch (error) {
    console.error(`Error sending doctor credentials to ${email}:`, error);
    throw error;
  }
};

// Password Reset Email
const sendPasswordReset = async (to, tempPassword, userName = "User") => {
  try {
    const html = await readHTMLFile(
      path.join(__dirname, "sentotp_template.html")
    );
    const template = handlebars.compile(html);
    const htmlToSend = template({
      otp: tempPassword,
      userName,
      message: "Your temporary password",
    });

    const mailOptions = {
      from: config.smtp_options.from,
      to,
      subject: "Password Reset - Healthcare Portal",
      html: htmlToSend,
      text: `Your password has been reset to: ${tempPassword}\nPlease change it after logging in.`,
    };

    return await sendEmail(mailOptions);
  } catch (error) {
    console.error(`Error sending password reset to ${to}:`, error);
    throw error;
  }
};

// Test email function
const testEmailService = async (testEmail) => {
  try {
    const result = await sendPatientOtp(testEmail, "123456", "Test User");
    return {
      success: true,
      message: "Test email sent successfully",
      messageId: result.messageId,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to send test email",
      error: error.message,
    };
  }
};

// Health check
const checkEmailHealth = async () => {
  try {
    await transporter.verify();
    return { healthy: true, message: "Email service is connected" };
  } catch (error) {
    return {
      healthy: false,
      message: "Email service connection failed",
      error: error.message,
    };
  }
};

module.exports = {
  sendPatientOtp,
  sendDoctorCredentials,
  sendPasswordReset,
  testEmailService,
  checkEmailHealth,
  transporter,
};
