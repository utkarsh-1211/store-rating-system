const bcrypt = require("bcryptjs");
const db = require("../db");
const {
  validateName,
  validateEmail,
  validateAddress,
  validatePassword
} = require("../utils/validators");

const ALLOWED_ROLES = ["USER", "ADMIN", "STORE_OWNER"];

// =====================================
// GET ADMIN DASHBOARD STATS
// =====================================
const getDashboardStats = (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM stores) AS totalStores,
      (SELECT COUNT(*) FROM ratings) AS totalRatings
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Stats error:", err);
      return res.status(500).json({ message: "Failed to load dashboard stats" });
    }
    return res.status(200).json(results[0]);
  });
};

// =====================================
// GET ALL USERS (FILTERS + SORTING + OWNER RATING)
// =====================================
const getUsers = (req, res) => {
  const {
    name = "",
    email = "",
    address = "",
    role = "",
    sortBy = "created_at",
    sortOrder = "DESC"
  } = req.query;

  const sortColumns = {
    name: "u.name",
    email: "u.email",
    address: "u.address",
    role: "u.role",
    rating: "owner_rating",
    created_at: "u.created_at"
  };

  const orderColumn = sortColumns[sortBy] || "u.created_at";
  const direction = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const conditions = [];
  const params = [];

  if (name.trim()) {
    conditions.push("u.name LIKE ?");
    params.push(`%${name.trim()}%`);
  }
  if (email.trim()) {
    conditions.push("u.email LIKE ?");
    params.push(`%${email.trim()}%`);
  }
  if (address.trim()) {
    conditions.push("u.address LIKE ?");
    params.push(`%${address.trim()}%`);
  }
  if (role.trim() && ALLOWED_ROLES.includes(role.trim().toUpperCase())) {
    conditions.push("u.role = ?");
    params.push(role.trim().toUpperCase());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.address,
      u.role,
      u.created_at,
      ROUND(AVG(r.rating), 1) AS owner_rating
    FROM users u
    LEFT JOIN stores s ON s.owner_id = u.id
    LEFT JOIN ratings r ON r.store_id = s.id
    ${whereClause}
    GROUP BY u.id, u.name, u.email, u.address, u.role, u.created_at
    ORDER BY ${orderColumn} ${direction}
  `;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Get users error:", err);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
    return res.status(200).json({ users: results });
  });
};

// =====================================
// GET SINGLE USER DETAILS (WITH OWNER RATING)
// =====================================
const getUserById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.address,
      u.role,
      u.created_at,
      ROUND(AVG(r.rating), 1) AS owner_rating
    FROM users u
    LEFT JOIN stores s ON s.owner_id = u.id
    LEFT JOIN ratings r ON r.store_id = s.id
    WHERE u.id = ?
    GROUP BY u.id, u.name, u.email, u.address, u.role, u.created_at
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user: results[0] });
  });
};

// =====================================
// ADMIN CREATE USER (USER / ADMIN / STORE_OWNER)
// =====================================
const createUser = (req, res) => {
  const { name, email, address, password, role = "USER" } = req.body;

  const nameErr = validateName(name);
  if (nameErr) return res.status(400).json({ message: nameErr });

  const emailErr = validateEmail(email);
  if (emailErr) return res.status(400).json({ message: emailErr });

  const addressErr = validateAddress(address);
  if (addressErr) return res.status(400).json({ message: addressErr });

  const passwordErr = validatePassword(password);
  if (passwordErr) return res.status(400).json({ message: passwordErr });

  const normalizedRole = String(role).toUpperCase();
  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    return res.status(400).json({ message: "Invalid role selected." });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanAddress = address.trim();

  db.query("SELECT id FROM users WHERE email = ?", [cleanEmail], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length > 0) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertSql = `
        INSERT INTO users (name, email, address, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [cleanName, cleanEmail, cleanAddress, hashedPassword, normalizedRole],
        (insertErr, result) => {
          if (insertErr) {
            return res.status(500).json({ message: "Failed to create user." });
          }

          return res.status(201).json({
            message: "User created successfully!",
            user: {
              id: result.insertId,
              name: cleanName,
              email: cleanEmail,
              address: cleanAddress,
              role: normalizedRole
            }
          });
        }
      );
    } catch (hashErr) {
      return res.status(500).json({ message: "Error securing password." });
    }
  });
};

// =====================================
// GET ALL STORES FOR ADMIN (FILTERS + SORTING)
// =====================================
const getAdminStores = (req, res) => {
  const {
    name = "",
    email = "",
    address = "",
    sortBy = "created_at",
    sortOrder = "DESC"
  } = req.query;

  const sortColumns = {
    name: "s.name",
    email: "s.email",
    address: "s.address",
    rating: "average_rating",
    created_at: "s.created_at"
  };

  const orderColumn = sortColumns[sortBy] || "s.created_at";
  const direction = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const conditions = [];
  const params = [];

  if (name.trim()) {
    conditions.push("s.name LIKE ?");
    params.push(`%${name.trim()}%`);
  }
  if (email.trim()) {
    conditions.push("s.email LIKE ?");
    params.push(`%${email.trim()}%`);
  }
  if (address.trim()) {
    conditions.push("s.address LIKE ?");
    params.push(`%${address.trim()}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      s.id,
      s.name,
      s.email,
      s.category,
      s.address,
      s.description,
      s.owner_id,
      u.name AS owner_name,
      s.created_at,
      COALESCE(ROUND(AVG(r.rating), 1), 0) AS average_rating,
      COUNT(r.id) AS total_ratings
    FROM stores s
    LEFT JOIN users u ON s.owner_id = u.id
    LEFT JOIN ratings r ON r.store_id = s.id
    ${whereClause}
    GROUP BY s.id, s.name, s.email, s.category, s.address, s.description, s.owner_id, u.name, s.created_at
    ORDER BY ${orderColumn} ${direction}
  `;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Get admin stores error:", err);
      return res.status(500).json({ message: "Failed to fetch stores" });
    }
    return res.status(200).json({ stores: results });
  });
};

// =====================================
// ADMIN CREATE STORE (WITH EMAIL & OWNER_ID)
// =====================================
const createAdminStore = (req, res) => {
  const { name, email, category = "", address, description = "", owner_id = null } = req.body;

  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName || cleanName.length > 60) {
    return res.status(400).json({ message: "Store name is required (max 60 characters)." });
  }

  const emailErr = validateEmail(email);
  if (emailErr) return res.status(400).json({ message: emailErr });

  const addressErr = validateAddress(address);
  if (addressErr) return res.status(400).json({ message: addressErr });

  const cleanEmail = email.trim().toLowerCase();
  const cleanAddress = address.trim();
  const parsedOwnerId = owner_id ? Number(owner_id) : null;

  const sql = `
    INSERT INTO stores (name, email, category, address, description, owner_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [cleanName, cleanEmail, category.trim(), cleanAddress, description.trim(), parsedOwnerId],
    (err, result) => {
      if (err) {
        console.error("Create store error:", err);
        return res.status(500).json({ message: "Failed to create store." });
      }
      return res.status(201).json({
        message: "Store created successfully!",
        storeId: result.insertId
      });
    }
  );
};

// =====================================
// ADMIN UPDATE STORE
// =====================================
const updateAdminStore = (req, res) => {
  const { id } = req.params;
  const { name, email, category = "", address, description = "", owner_id = null } = req.body;

  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName || cleanName.length > 60) {
    return res.status(400).json({ message: "Store name is required (max 60 characters)." });
  }

  const emailErr = validateEmail(email);
  if (emailErr) return res.status(400).json({ message: emailErr });

  const addressErr = validateAddress(address);
  if (addressErr) return res.status(400).json({ message: addressErr });

  const cleanEmail = email.trim().toLowerCase();
  const cleanAddress = address.trim();
  const parsedOwnerId = owner_id ? Number(owner_id) : null;

  const sql = `
    UPDATE stores
    SET name = ?, email = ?, category = ?, address = ?, description = ?, owner_id = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [cleanName, cleanEmail, category.trim(), cleanAddress, description.trim(), parsedOwnerId, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Failed to update store." });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Store not found." });
      return res.status(200).json({ message: "Store updated successfully!" });
    }
  );
};

// =====================================
// ADMIN DELETE STORE
// =====================================
const deleteAdminStore = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM ratings WHERE store_id = ?", [id], (ratingErr) => {
    if (ratingErr) return res.status(500).json({ message: "Failed to delete store ratings." });

    db.query("DELETE FROM stores WHERE id = ?", [id], (storeErr, result) => {
      if (storeErr) return res.status(500).json({ message: "Failed to delete store." });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Store not found." });
      return res.status(200).json({ message: "Store deleted successfully!" });
    });
  });
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  createUser,
  getAdminStores,
  createAdminStore,
  updateAdminStore,
  deleteAdminStore
};