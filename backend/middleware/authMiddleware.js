/**
 * @file backend/middleware/authMiddleware.js
 * @layer Backend Security Middleware
 * @description Verifies JWT Bearer tokens on protected routes and attaches req.user.
 * @exports protect
 */

const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized, no token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "kaching_secret_key");

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, token failed or expired.",
    });
  }
};
