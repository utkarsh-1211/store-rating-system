const db = require("../db");

// =====================================
// ADD OR UPDATE A STORE RATING (PROTECTED)
// =====================================
const addOrUpdateRating = (req, res) => {
  const userId = req.user.id;
  const { store_id, rating, review } = req.body;

  const numericStoreId = Number(store_id);
  const numericRating = Number(rating);

  if (
    !numericStoreId ||
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    return res.status(400).json({
      message: "Valid store_id and a rating between 1 and 5 are required"
    });
  }

  const cleanReview = typeof review === "string" && review.trim() ? review.trim() : null;

  // 1. Verify the store exists
  db.query("SELECT id FROM stores WHERE id = ?", [numericStoreId], (storeErr, storeResults) => {
    if (storeErr) {
      return res.status(500).json({ message: "Database error" });
    }

    if (storeResults.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }

    // 2. Atomic upsert using UNIQUE(user_id, store_id)
    const upsertSql = `
      INSERT INTO ratings (user_id, store_id, rating, review)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        review = COALESCE(NULLIF(VALUES(review), ''), review),
        updated_at = CURRENT_TIMESTAMP
    `;

    db.query(
      upsertSql,
      [userId, numericStoreId, numericRating, cleanReview],
      (upsertErr, result) => {
        if (upsertErr) {
          console.error("Upsert rating error:", upsertErr);
          return res.status(500).json({ message: "Failed to save rating" });
        }

        const isNew = result.affectedRows === 1;

        return res.status(isNew ? 201 : 200).json({
          message: isNew
            ? "Rating submitted successfully"
            : "Rating updated successfully",
          rating: {
            id: result.insertId || null,
            user_id: userId,
            store_id: numericStoreId,
            rating: numericRating,
            review: cleanReview
          }
        });
      }
    );
  });
};

// =====================================
// GET ALL RATINGS FOR A STORE (PUBLIC)
// =====================================
const getStoreRatings = (req, res) => {
  const storeId = Number(req.params.storeId);

  if (!storeId) {
    return res.status(400).json({ message: "Invalid store ID" });
  }

  const sql = `
    SELECT
      r.id,
      r.user_id,
      r.store_id,
      r.rating,
      r.review,
      r.created_at,
      r.updated_at,
      u.name AS user_name
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.store_id = ?
    ORDER BY r.updated_at DESC, r.created_at DESC
  `;

  db.query(sql, [storeId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    const totalRatings = results.length;
    const averageRating =
      totalRatings > 0
        ? Number(
            (results.reduce((sum, item) => sum + item.rating, 0) / totalRatings).toFixed(1)
          )
        : 0;

    return res.status(200).json({
      store_id: storeId,
      average_rating: averageRating,
      total_ratings: totalRatings,
      ratings: results
    });
  });
};

// =====================================
// GET LOGGED-IN USER'S RATINGS (PROTECTED)
// =====================================
const getMyRatings = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      r.id,
      r.store_id,
      r.rating,
      r.review,
      r.created_at,
      r.updated_at,
      s.name AS store_name,
      s.category AS store_category
    FROM ratings r
    JOIN stores s ON r.store_id = s.id
    WHERE r.user_id = ?
    ORDER BY r.updated_at DESC, r.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    return res.status(200).json({
      total: results.length,
      ratings: results
    });
  });
};

// =====================================
// DELETE OWN RATING (PROTECTED)
// =====================================
const deleteRating = (req, res) => {
  const userId = req.user.id;
  const ratingId = Number(req.params.id);

  if (!ratingId) {
    return res.status(400).json({ message: "Invalid rating ID" });
  }

  db.query(
    "DELETE FROM ratings WHERE id = ? AND user_id = ?",
    [ratingId, userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Rating not found or not authorized" });
      }

      return res.status(200).json({ message: "Rating deleted successfully" });
    }
  );
};

module.exports = {
  addOrUpdateRating,
  getStoreRatings,
  getMyRatings,
  deleteRating
};