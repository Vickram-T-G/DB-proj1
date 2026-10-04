const express = require("express");
const { body, validationResult } = require("express-validator");
const Event = require("../models/Event");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/events
// @desc    Create an event
// @access  Private (Admin)
router.post(
  "/",
  protect,
  authorize("admin"),
  [
    body("title").not().isEmpty().withMessage("Title is required"),
    body("start").isISO8601().withMessage("Start date is required"),
    body("end").isISO8601().withMessage("End date is required"),
    body("type")
      .optional()
      .isIn(["birthday", "exam", "assignment", "holiday", "general"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, start, end, type } = req.body;
      const event = await Event.create({
        title,
        description,
        start,
        end,
        type,
        createdBy: req.user.id,
      });
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   GET /api/events
// @desc    Get all events
// @access  Public
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy", "name");
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (Admin)
router.put(
  "/:id",
  protect,
  authorize("admin"),
  [
    body("title").optional().not().isEmpty(),
    body("start").optional().isISO8601(),
    body("end").optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      let event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      event = await Event.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (Admin)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    await event.deleteOne();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
