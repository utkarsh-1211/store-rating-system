

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

// =====================================
// REGISTER USER
// =====================================

const registerUser = async (req, res) => {
    try {
        // 1. Get data from request body
        const { name, email, password } = req.body;

        // 2. Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = name.trim();

        if (!normalizedName || !normalizedEmail) {
            return res.status(400).json({
                message: "Name and email cannot be empty"
            });
        }

        // 3. Check whether email already exists
        db.query(
            "SELECT id FROM users WHERE email = ?",
            [normalizedEmail],
            async (err, results) => {

                if (err) {
                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        message: "Email already registered"
                    });
                }

                try {
                    // 4. Hash password
                    const hashedPassword = await bcrypt.hash(
                        password,
                        10
                    );

                    // 5. Insert user into MySQL
                    db.query(
                        `INSERT INTO users
                        (name, email, password_hash)
                        VALUES (?, ?, ?)`,
                        [
                            normalizedName,
                            normalizedEmail,
                            hashedPassword
                        ],
                        (insertErr, result) => {

                            if (insertErr) {
                                if (insertErr.code === "ER_DUP_ENTRY") {
                                    return res.status(409).json({
                                        message: "Email already registered"
                                    });
                                }

                                return res.status(500).json({
                                    message: "Registration failed"
                                });
                            }

                            // 6. Send success response
                            return res.status(201).json({
                                message: "User registered successfully",
                                user: {
                                    id: result.insertId,
                                    name: normalizedName,
                                    email: normalizedEmail,
                                    role: "USER"
                                }
                            });
                        }
                    );

                } catch (hashError) {
                    return res.status(500).json({
                        message: "Password processing failed"
                    });
                }
            }
        );

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// =====================================
// LOGIN USER
// =====================================

const loginUser = async (req, res) => {
    try {
        // 1. Get email and password
        const { email, password } = req.body;

        // 2. Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 3. Find user in database
        db.query(
            "SELECT * FROM users WHERE email = ?",
            [normalizedEmail],
            async (err, results) => {

                if (err) {
                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                // 4. Check whether user exists
                if (results.length === 0) {
                    return res.status(404).json({
                        message: "User not found"
                    });
                }

                const user = results[0];

                try {
                    // 5. Compare entered password with hashed password
                    const isMatch = await bcrypt.compare(
                        password,
                        user.password_hash
                    );

                    if (!isMatch) {
                        return res.status(401).json({
                            message: "Invalid email or password"
                        });
                    }

                    // 6. Check JWT secret
                    if (!process.env.JWT_SECRET) {
                        return res.status(500).json({
                            message: "JWT configuration error"
                        });
                    }

                    // 7. Generate JWT token
                    const token = jwt.sign(
                        {
                            id: user.id,
                            email: user.email,
                            role: user.role
                        },
                        process.env.JWT_SECRET,
                        {
                            expiresIn: "1d"
                        }
                    );

                    // 8. Send successful login response
                    return res.status(200).json({
                        message: "Login successful",

                        token: token,

                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role
                        }
                    });

                } catch (error) {
                    return res.status(500).json({
                        message: "Login processing failed"
                    });
                }
            }
        );

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


// =====================================
// EXPORT BOTH FUNCTIONS
// =====================================

module.exports = {
    registerUser,
    loginUser
};

