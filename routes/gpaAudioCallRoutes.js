
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

// Check whether a user is allowed to initiate GPA Audio Calls.
function canInitiateAudioCall(role) {
  return role === "founder" || role === "admin";
}

// Create a call invitation and return the permitted call methods.
router.post("/start", protect, async (req, res) => {
  try {
    const callerId = String(req.user._id);
    const callerRole = req.user.role;

    if (!canInitiateAudioCall(callerRole)) {
      return res.status(403).json({
        message: "You are not permitted to initiate GPA Audio Calls.",
      });
    }

    const { recipientId } = req.body;

    if (!recipientId || !/^[a-fA-F0-9]{24}$/.test(String(recipientId))) {
      return res.status(400).json({
        message: "A valid recipientId is required.",
      });
    }

    if (String(recipientId) === callerId) {
      return res.status(400).json({
        message: "You cannot call yourself.",
      });
    }

    const recipient = await User.findById(recipientId).select(
      "_id name role"
    );

    if (!recipient) {
      return res.status(404).json({
        message: "Recipient not found.",
      });
    }

    return res.json({
      message: "Caller permission verified.",
      callerId,
      recipient: {
        id: String(recipient._id),
        name: recipient.name || "User",
        role: recipient.role,
      },
      connectionStrategy: ["direct-webrtc", "livekit-fallback"],
      nextStep: "signaling",
    });
  } catch (error) {
    console.error("GPA Audio Call start error:", error);
    return res.status(500).json({
      message: "Unable to start GPA Audio Call.",
    });
  }
});

module.exports = router;
