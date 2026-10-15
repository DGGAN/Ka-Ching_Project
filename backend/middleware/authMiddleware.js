// Import jsonwebtoken library to verify tokens
const jwt = require("jsonwebtoken");

// Security middleware to verify if user carries a valid JWT Token (complies with NFR4 spec)
exports.protect = (req, res, next) => {
  try {
    // Get token from Authorization header (format: "Bearer <token>")
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized, no token provided.",
      });
    }

    // Extract the actual token string after the space
    const token = authHeader.split(" ")[1];

    // Verify if the token is valid and not expired using secret key in .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user ID to req.user and proceed to next controller
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(401).json({
      message: "Not authorized, token failed or expired.",
    });
  }
};
