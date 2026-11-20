const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  requireStoreOwner
} = require("../middleware/authMiddleware");
const { getOwnerDashboard } = require("../controllers/ownerController");

router.get("/dashboard", authenticateToken, requireStoreOwner, getOwnerDashboard);

module.exports = router;