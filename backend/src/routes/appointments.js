const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/appointments
// List all appointments
// 🔥 FIX: Resolved the N+1 database trap completely using Prisma's Eager Loading "include"
router.get("/", authenticate, async (req, res) => {
  try {
    const { doctorId, status } = req.query;

    const where = {};
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    // 🔥 FIX: We fetch everything in a SINGLE database query using Prisma's native join relations
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { appointmentDate: "asc" },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            age: true,
            medicalHistory: true,
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
    });

    res.json({
      success: true,
      count: appointments.length,
      appointments: appointments,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve appointments" });
  }
});

// POST /api/appointments
// Book an appointment
// 🔥 FIX: Secured data integrity using a safe data verification process
router.post("/", authenticate, async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, reason } = req.body;

    if (!patientId || !doctorId || !appointmentDate) {
      return res
        .status(400)
        .json({ error: "Patient, Doctor, and Appointment Date are required." });
    }

    const appDate = new Date(appointmentDate);

    // 🔥 FIX: Check if an active booking already occupies this appointment slot
    const existingBooking = await prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: appDate,
        status: { not: "CANCELLED" },
      },
    });

    if (existingBooking) {
      return res.status(400).json({
        error:
          "Double booking blocked. Doctor already has an appointment assigned to this specific time slot.",
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        appointmentDate: appDate,
        reason: reason || "",
        status: "PENDING",
      },
    });

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    // 🔥 FIX: Handle the unique database schema constraint error we added in Step 2 smoothly
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({
          error:
            "Double booking blocked. This appointment time slot is already reserved.",
        });
    }
    res.status(500).json({ error: "Failed to book appointment" });
  }
});

// PATCH /api/appointments/:id
// Update appointment status (COMPLETED, CANCELLED, etc.)
router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update appointment" });
  }
});

module.exports = router;
