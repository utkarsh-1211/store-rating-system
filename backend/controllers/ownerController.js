const db = require("../db");

// =====================================
// GET STORE OWNER DASHBOARD
// =====================================
const getOwnerDashboard = (req, res) => {
  const ownerId = req.user.id;
  const { sortBy = "updated_at", sortOrder = "DESC" } = req.query;

  const sortColumns = {
    user_name: "u.name",
    user_email: "u.email",
    rating: "r.rating",
    store_name: "s.name",
    updated_at: "r.updated_at"
  };

  const orderColumn = sortColumns[sortBy] || "r.updated_at";
  const direction = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const storesSql = `
    SELECT
      s.id,
      s.name,
      s.email,
      s.address,
      COALESCE(ROUND(AVG(r.rating), 1), 0) AS average_rating,
      COUNT(r.id) AS total_ratings
    FROM stores s
    LEFT JOIN ratings r ON r.store_id = s.id
    WHERE s.owner_id = ?
    GROUP BY s.id, s.name, s.email, s.address
  `;

  db.query(storesSql, [ownerId], (storeErr, stores) => {
    if (storeErr) {
      console.error("Owner stores error:", storeErr);
      return res.status(500).json({ message: "Failed to load store data." });
    }

    if (stores.length === 0) {
      return res.status(200).json({
        stores: [],
        averageRating: 0,
        totalRatings: 0,
        raters: []
      });
    }

    const ratersSql = `
      SELECT
        r.id,
        r.rating,
        r.review,
        r.created_at,
        r.updated_at,
        s.name AS store_name,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.address AS user_address
      FROM ratings r
      INNER JOIN stores s ON r.store_id = s.id
      INNER JOIN users u ON r.user_id = u.id
      WHERE s.owner_id = ?
      ORDER BY ${orderColumn} ${direction}
    `;

    db.query(ratersSql, [ownerId], (ratersErr, raters) => {
      if (ratersErr) {
        console.error("Owner raters error:", ratersErr);
        return res.status(500).json({ message: "Failed to load store ratings." });
      }

      const totalRatings = raters.length;
      const averageRating =
        totalRatings > 0
          ? Number(
              (
                raters.reduce((sum, item) => sum + Number(item.rating), 0) /
                totalRatings
              ).toFixed(1)
            )
          : 0;

      return res.status(200).json({
        stores,
        averageRating,
        totalRatings,
        raters
      });
    });
  });
};

module.exports = { getOwnerDashboard };