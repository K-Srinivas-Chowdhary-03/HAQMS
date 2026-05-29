const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patients");
const doctorRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");
const queueRoutes = require("./routes/queue"); // 🔥 Points to routes/queue.js
const reportRoutes = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 FIX: Restricted CORS configuration to prevent unauthorized origins from abusing the API
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
