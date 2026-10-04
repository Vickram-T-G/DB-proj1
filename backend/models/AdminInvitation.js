const mongoose = require("mongoose");

const adminInvitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["admin", "teacher"],
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

// Index for token lookup and expiration
adminInvitationSchema.index({ token: 1 });
adminInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("AdminInvitation", adminInvitationSchema);
