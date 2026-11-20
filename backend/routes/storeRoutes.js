const express = require("express");
const router = express.Router();

const {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore
} = require("../controllers/storeController");

const { authenticateToken } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");

// Public store routes
router.get("/", getAllStores);
router.get("/:id", getStoreById);

// Admin-only store management routes
router.post("/", authenticateToken, requireAdmin, createStore);
router.put("/:id", authenticateToken, requireAdmin, updateStore);
router.delete("/:id", authenticateToken, requireAdmin, deleteStore);

module.exports = router;