const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const {
  validateName,
  validateEmail,
  validateAddress,
  validatePassword
} = require("../utils/validators");

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

// =====================================
// REGISTER NORMAL USER
// =====================================
const register = async (req, res) => {
  const { name, email, address, password } = req.body;

  const nameErr = validateName(name);
  if (nameErr) return res.status(400).json({ message: nameErr });

  const emailErr = validateEmail(email);
  if (emailErr) return res.status(400).json({ message: emailErr });

  const addressErr = validateAddress(address);
  if (addressErr) return res.status(400).json({ message: addressErr });

  const passwordErr = validatePassword(password);
  if (passwordErr) return res.status(400).json({ message: passwordErr });

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanAddress = address.trim();

  db.query("SELECT id FROM users WHERE email = ?", [cleanEmail], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (results.length > 0) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const insertSql = `
        INSERT INTO users (name, email, address, password_hash, role)
        VALUES (?, ?, ?, ?, 'USER')
      `;

      db.query(
        insertSql,
        [cleanName, cleanEmail, cleanAddress, hashedPassword],
        (insertErr, result) => {
          if (insertErr) {
            return res.status(500).json({ message: "Failed to register user" });
          }

          return res.status(201).json({
            message: "User registered successfully",
            user: {
              id: result.insertId,
              name: cleanName,
              email: cleanEmail,
              address: cleanAddress,
              role: "USER"
            }
          });
        }
      );
    } catch (hashErr) {
      return res.status(500).json({ message: "Error securing password" });
    }
  });
};

// =====================================
// LOGIN (SINGLE LOGIN FOR ALL ROLES)
// =====================================
const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const cleanEmail = email.trim().toLowerCase();

  db.query(
    "SELECT id, name, email, address, password_hash, role FROM users WHERE email = ?",
    [cleanEmail],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });

      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          address: user.address || "",
          role: user.role
        }
      });
    }
  );
};

// =====================================
// GET LOGGED-IN USER PROFILE
// =====================================
const getMe = (req, res) => {
  const sql = "SELECT id, name, email, address, role, created_at FROM users WHERE id = ?";

  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: results[0] });
  });
};

// =====================================
// UPDATE PASSWORD (LOGGED-IN USERS)
// =====================================
const updatePassword = (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current password and new password are required." });
  }

  const passwordErr = validatePassword(newPassword);
  if (passwordErr) return res.status(400).json({ message: passwordErr });

  db.query(
    "SELECT password_hash FROM users WHERE id = ?",
    [req.user.id],
    async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(currentPassword, results[0].password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect." });
      }

      try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.query(
          "UPDATE users SET password_hash = ? WHERE id = ?",
          [hashedPassword, req.user.id],
          (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ message: "Failed to update password." });
            }
            return res.status(200).json({ message: "Password updated successfully!" });
          }
        );
      } catch (hashErr) {
        return res.status(500).json({ message: "Error securing new password." });
      }
    }
  );
};

module.exports = {
  register,
  login,
  getMe,
  updatePassword
};