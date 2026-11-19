const jwt = require("jsonwebtoken");

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    try {
        // 1. Check that JWT_SECRET is configured on the server
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing in environment variables.");
            return res.status(500).json({
                message: "Server authentication configuration error."
            });
        }

        // 2. Get Authorization header
        const authHeader = req.headers.authorization;

        // 3. Check whether header exists and uses Bearer format
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access denied. Token is required."
            });
        }

        // 4. Safely extract token and reject malformed headers
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || !parts[1].trim()) {
            return res.status(401).json({
                message: "Access denied. Invalid authorization header format."
            });
        }

        const token = parts[1].trim();

        // 5. Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 6. Store decoded user information
        req.user = decoded;

        // 7. Allow request to continue
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token has expired. Please login again."
            });
        }

        return res.status(401).json({
            message: "Invalid authentication token."
        });
    }
};

module.exports = { authenticateToken };