const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const authRoutes = require("./routes/authRoutes");
const ratingRoutes = require("./routes/ratingRoutes");

const app = express();

// Middleware (MUST come before routes)
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/ratings", ratingRoutes);

app.get("/", (req, res) => {
  res.send("StoreRate Backend Running!");
});

// Get all stores with live average rating and total ratings count
app.get("/api/stores", (req, res) => {
  const sql = `
    SELECT 
      s.*,
      COALESCE(ROUND(AVG(r.rating), 1), 0) AS average_rating,
      COUNT(r.id) AS total_ratings
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Get a single store by ID with its average rating
app.get("/api/stores/:id", (req, res) => {
  const storeId = Number(req.params.id);

  if (!storeId) {
    return res.status(400).json({ message: "Invalid store ID" });
  }

  const sql = `
    SELECT 
      s.*,
      COALESCE(ROUND(AVG(r.rating), 1), 0) AS average_rating,
      COUNT(r.id) AS total_ratings
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    WHERE s.id = ?
    GROUP BY s.id
  `;

  db.query(sql, [storeId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json(results[0]);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});