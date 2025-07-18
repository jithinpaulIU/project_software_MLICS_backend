// controllers/authController.js
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const User = db.User;

const AuthController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: false,
          message: "Email and password are required",
        });
      }

      // Authenticate user
      const user = await User.authenticate(email, password);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        status: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          // exclude password here
        },
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(401).json({
        status: false,
        message: "Authentication failed",
        error: error.message,
      });
    }
  },
};

module.exports = AuthController;
