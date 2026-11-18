const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("StoreRate Backend Running!");
});

app.get("/api/stores", (req, res) => {
    db.query("SELECT * FROM stores", (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on port 5000");
});