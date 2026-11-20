const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getUsers,
  getUserById,
  createUser,
  getAdminStores,
  createAdminStore,
  updateAdminStore,
  deleteAdminStore
} = require("../controllers/adminController");

// All routes below require logged-in ADMIN
router.use(authenticateToken, requireAdmin);

router.get("/stats", getDashboardStats);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);

router.get("/stores", getAdminStores);
router.post("/stores", createAdminStore);
router.put("/stores/:id", updateAdminStore);
router.delete("/stores/:id", deleteAdminStore);

module.exports = router;