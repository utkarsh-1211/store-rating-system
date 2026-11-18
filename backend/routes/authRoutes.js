
const express = require("express");

const router = express.Router();

// Import controller functions
const {
    registerUser,
    loginUser
} = require("../controllers/authController");

// Registration API
router.post("/register", registerUser);

// Login API
router.post("/login", loginUser);

// Test API
router.get("/test", (req, res) => {
    res.json({
        message: "Auth routes working successfully!"
    });
});

module.exports = router;
