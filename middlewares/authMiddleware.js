const jwt = require("jsonwebtoken");
const User = require("../mics_models/user");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ status: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ status: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ status: false, message: "Not authorized" });
  }
};

module.exports = authMiddleware;
