const jwt = require("jsonwebtoken");
const User = require("../mics_models/user");

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
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Return success response (exclude sensitive data)
      res.json({
        status: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
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
