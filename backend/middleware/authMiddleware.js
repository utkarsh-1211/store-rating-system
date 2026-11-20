const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  next();
};

const requireStoreOwner = (req, res, next) => {
  if (!req.user || req.user.role !== "STORE_OWNER") {
    return res.status(403).json({ message: "Access denied. Store Owner privileges required." });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireStoreOwner
};