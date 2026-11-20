const db = require("../db");

// =====================================
// GET ALL STORES WITH AVERAGE RATING (PUBLIC)
// =====================================
const getAllStores = (req, res) => {
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
      return res.status(500).json({ message: "Database error" });
    }
    return res.status(200).json(results);
  });
};

// =====================================
// GET SINGLE STORE BY ID (PUBLIC)
// =====================================
const getStoreById = (req, res) => {
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
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }

    return res.status(200).json(results[0]);
  });
};

// =====================================
// CREATE STORE (ADMIN ONLY)
// =====================================
const createStore = (req, res) => {
  const { name, category, address, description } = req.body;

  const cleanName = name ? name.trim() : "";
  const cleanCategory = category ? category.trim() : null;
  const cleanAddress = address ? address.trim() : null;
  const cleanDescription = description ? description.trim() : null;

  if (!cleanName) {
    return res.status(400).json({ message: "Store name is required" });
  }

  const sql = `
    INSERT INTO stores (name, category, address, description)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [cleanName, cleanCategory, cleanAddress, cleanDescription],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Failed to create store" });
      }

      return res.status(201).json({
        message: "Store created successfully",
        store: {
          id: result.insertId,
          name: cleanName,
          category: cleanCategory,
          address: cleanAddress,
          description: cleanDescription,
          average_rating: 0,
          total_ratings: 0
        }
      });
    }
  );
};

// =====================================
// UPDATE STORE (ADMIN ONLY)
// =====================================
const updateStore = (req, res) => {
  const storeId = Number(req.params.id);
  const { name, category, address, description } = req.body;

  if (!storeId) {
    return res.status(400).json({ message: "Invalid store ID" });
  }

  const cleanName = name ? name.trim() : "";
  const cleanCategory = category ? category.trim() : null;
  const cleanAddress = address ? address.trim() : null;
  const cleanDescription = description ? description.trim() : null;

  if (!cleanName) {
    return res.status(400).json({ message: "Store name is required" });
  }

  const sql = `
    UPDATE stores
    SET name = ?, category = ?, address = ?, description = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [cleanName, cleanCategory, cleanAddress, cleanDescription, storeId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Failed to update store" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Store not found" });
      }

      return res.status(200).json({
        message: "Store updated successfully",
        store: {
          id: storeId,
          name: cleanName,
          category: cleanCategory,
          address: cleanAddress,
          description: cleanDescription
        }
      });
    }
  );
};

// =====================================
// DELETE STORE (ADMIN ONLY)
// =====================================
const deleteStore = (req, res) => {
  const storeId = Number(req.params.id);

  if (!storeId) {
    return res.status(400).json({ message: "Invalid store ID" });
  }

  // Delete associated ratings first to avoid foreign key constraint errors
  db.query("DELETE FROM ratings WHERE store_id = ?", [storeId], (ratingErr) => {
    if (ratingErr) {
      return res.status(500).json({ message: "Failed to remove store ratings" });
    }

    db.query("DELETE FROM stores WHERE id = ?", [storeId], (storeErr, result) => {
      if (storeErr) {
        return res.status(500).json({ message: "Failed to delete store" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Store not found" });
      }

      return res.status(200).json({ message: "Store deleted successfully" });
    });
  });
};

module.exports = {
  getAllStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore
};