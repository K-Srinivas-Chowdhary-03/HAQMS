const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/doctors
// Retrieve list of doctors with special search filtering
// 🔥 FIX: Eliminated SQL Injection vulnerabilities by using Prisma's type-safe query builder
router.get("/", authenticate, async (req, res) => {
  try {
    const { search, specialization } = req.query;

    // Define dynamic conditions programmatically and type-safely
    const whereCondition = {};

    if (search) {
      whereCondition.name = {
        contains: search,
        mode: "insensitive", // Achieves the same behavior as SQL ILIKE safely
      };
    }

    if (specialization && specialization !== "All") {
      whereCondition.specialization = specialization;
    }

    // Use Prisma's safe standard query finder instead of raw SQL concatenation
    const doctors = await prisma.doctor.findMany({
      where: whereCondition,
    });

    // Consistent API Response Formatting
    res.json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    // 🔥 FIX: Hidden precise syntax errors from client to prevent system layout leakage
    res
      .status(500)
      .json({ error: "Internal server error while searching doctor records." });
  }
});

// GET /api/doctors/stats
// Returns aggregation details about available doctors
// 🔥 FIX: Performance Optimization using Promise.all() to process independent queries concurrently
router.get("/stats", authenticate, async (req, res) => {
  try {
    const start = Date.now();

    // 🔥 FIX: Executing database calculations simultaneously instead of blocking the loop sequentially
    const [totalDoctors, surgeonsCount, averageFee, highestExperience] =
      await Promise.all([
        prisma.doctor.count(),
        prisma.doctor.count({ where: { department: "Surgery" } }),
        prisma.doctor.aggregate({ _avg: { consultationFee: true } }),
        prisma.doctor.aggregate({ _max: { experience: true } }),
      ]);

    const durationMs = Date.now() - start;

    res.json({
      success: true,
      data: {
        total: totalDoctors,
        surgeons: surgeonsCount,
        averageFee: Math.round(averageFee._avg.consultationFee || 0),
        maxExperience: highestExperience._max.experience || 0,
      },
      debugInfo: {
        executionTimeMs: durationMs,
        notes: "Optimized concurrently via Promise.all(). Production grade.",
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Internal server error while compiling statistical insights.",
      });
  }
});

// GET /api/doctors/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor record not found" });
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error retrieving doctor profile." });
  }
});

module.exports = router;
