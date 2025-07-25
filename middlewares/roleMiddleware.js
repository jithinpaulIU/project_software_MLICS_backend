const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: false, message: "Forbidden" });
    }
    next();
  };
};

module.exports = roleMiddleware;
