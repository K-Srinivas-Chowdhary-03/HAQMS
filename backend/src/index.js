const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables relative to the backend directory
dotenv.config({ path: path.join(__dirname, "../.env") });

const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patients");
const doctorRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");
const queueRoutes = require("./routes/queue"); // 🔥 Points to routes/queue.js
const reportRoutes = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 FIX: Dynamic CORS configuration allowing localhost and common live environments
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000"
];

if (process.env.FRONTEND_URL) {
  const envOrigins = process.env.FRONTEND_URL.split(",").map(o => o.trim());
  allowedOrigins.push(...envOrigins);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      return allowed === "*" || allowed.toLowerCase() === origin.toLowerCase() || origin.endsWith(".onrender.com") || origin.endsWith(".vercel.app");
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Request from origin: ${origin} not in allowed list.`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/reports", reportRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message:
      "Hospital Appointment and Queue Management System (HAQMS) Backend API",
    status: "Running",
    version: "1.0.0-optimized",
  });
});

// GLOBAL ERROR HANDLER
// 🔥 FIX: Eliminated the Information Leak vulnerability.
// Never send the raw error message or full stack trace to the client in production,
// as it leaks database types, table schemas, and internal file paths.
app.use((err, req, res, next) => {
  console.error("[CRITICAL-ERROR]:", err);

  // Send a secure, generic message to the client
  res.status(500).json({
    success: false,
    message: "An unexpected internal server error occurred!",
    // Stack trace hidden securely from the client side
  });
});

// Listen on port
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`   HAQMS BACKEND SERVER IS RUNNING ON PORT ${PORT}`);
  console.log(`   ENVIRONMENT: ${process.env.NODE_ENV || "development"}`);
  console.log(`===================================================`);
});

// Catch unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Safe logging for debugging production thread rejections
});
