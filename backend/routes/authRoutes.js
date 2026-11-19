const express = require("express");

const router = express.Router();

// Import controller functions
const {
    registerUser,
    loginUser,
    getCurrentUser
} = require("../controllers/authController");

// Import authentication middleware
const { authenticateToken } = require("../middleware/authMiddleware");

// Registration API
router.post("/register", registerUser);

// Login API
router.post("/login", loginUser);

// Protected Current User Profile API
router.get("/me", authenticateToken, getCurrentUser);

// Test API
router.get("/test", (req, res) => {
    res.json({
        message: "Auth routes working successfully!"
    });
});

module.exports = router;