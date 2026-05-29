const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/queue
// Retrieves the active queue tokens for today
router.get("/", async (req, res) => {
  try {
    // Fetch queue tokens and eagerly load the associated patient and doctor models
    const queueTokens = await prisma.queueToken.findMany({
      where: {
        // Only fetch tokens that are currently WAITING or CALLING
        status: {
          in: ["WAITING", "CALLING"],
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
      },
      orderBy: {
        tokenNumber: "asc",
      },
    });

    res.json(queueTokens);
  } catch (error) {
    console.error("Error fetching queue data:", error);
    res
      .status(500)
      .json({ error: "Internal server error while retrieving queue tokens." });
  }
});

module.exports = router;
