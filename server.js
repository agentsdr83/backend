require("dotenv").config();
console.log("🚀 SERVER STARTING...");

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
console.log("DB URL:", process.env.DATABASE_URL);
const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(cors({
  origin: "*", // change to frontend URL in production
}));
app.use(express.json());

/* ---------- DATABASE ---------- */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4
});

/* ---------- HEALTH CHECK ---------- */
app.get("/test", (req, res) => {
  res.json({ success: true, message: "Backend working" });
});

/* ---------- DB CHECK ---------- */
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ DB TEST ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* ---------- MAIN API ---------- */
app.post("/apply-loan", async (req, res) => {
  console.log("🔥 API HIT");
  console.log("📦 BODY:", req.body);

  try {
    const {
      fullName,
      email,
      phone,
      dob,
      gender,
      pan,
      aadhaar,
      employmentType,
      company,
      monthlyIncome,
      loanAmount,
      loanPurpose,
      tenure,
      address
    } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!fullName || !email || !loanAmount) {
      return res.status(400).json({
        success: false,
        error: "fullName, email, and loanAmount are required",
      });
    }

    const values = [
      fullName || null,
      email || null,
      phone || null,
      dob || null,
      gender || null,
      pan || null,
      aadhaar || null,
      employmentType || null,
      company || null,
      monthlyIncome || null,
      loanAmount || null,
      loanPurpose || null,
      tenure || null,
      address || null
    ];

    const result = await pool.query(
      `INSERT INTO loan_applications (
        full_name, email, phone, dob, gender, pan, aadhaar,
        employment_type, company, monthly_income,
        loan_amount, loan_purpose, tenure, address
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      ) RETURNING *`,
      values
    );

    console.log("✅ INSERT SUCCESS:", result.rows[0]);

    return res.status(201).json({
      success: true,
      message: "Saved successfully",
      data: result.rows[0],
    });

  } catch (err) {
    console.error("❌ DB ERROR FULL:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* ---------- GLOBAL ERROR HANDLER ---------- */
app.use((err, req, res, next) => {
  console.error("🔥 UNHANDLED ERROR:", err);

  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
});

/* ---------- SERVER ---------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});