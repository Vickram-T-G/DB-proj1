const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    start: {
      type: Date,
      required: [true, "Please add a start date"],
    },
    end: {
      type: Date,
      required: [true, "Please add an end date"],
    },
    type: {
      type: String,
      enum: ["birthday", "exam", "assignment", "holiday", "general"],
      default: "general",
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", EventSchema);
