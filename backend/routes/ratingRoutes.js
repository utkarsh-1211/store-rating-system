const express = require("express");
const router = express.Router();

const {
  addOrUpdateRating,
  getStoreRatings,
  getMyRatings,
  deleteRating
} = require("../controllers/ratingController");

const { authenticateToken } = require("../middleware/authMiddleware");

// Submit or update a rating (logged-in users only)
router.post("/", authenticateToken, addOrUpdateRating);

// Get all ratings submitted by the logged-in user
router.get("/my-ratings", authenticateToken, getMyRatings);

// Get all ratings + average rating for a specific store (public)
router.get("/store/:storeId", getStoreRatings);

// Delete your own rating (logged-in users only)
router.delete("/:id", authenticateToken, deleteRating);

module.exports = router;