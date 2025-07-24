const jwt = require("jsonwebtoken");
const User = require("../mics_models/user"); // Make sure to destructure User if using Sequelize

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        status: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // CORRECTED: Call findById with just the ID
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    const message =
      error.name === "JsonWebTokenError" ? "Invalid token" : "Not authorized";

    res.status(401).json({
      status: false,
      message,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
module.exports = authMiddleware;
