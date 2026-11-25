
const express = require("express");
const router = express.Router();

const {
  importAbacusQuestions,
  getAbacusQuestions,
  getAbacusQuestionCount
} = require("../controllers/championshipAbacusController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Import questions - Founder/Admin only
router.post(
  "/import",
  protect,
  authorize("founder", "admin"),
  importAbacusQuestions
);

// Get question count
router.get(
  "/count",
  protect,
  authorize("founder", "admin"),
  getAbacusQuestionCount
);

// Get questions (correct answers excluded)
router.get(
  "/questions",
  protect,
  authorize("founder", "admin"),
  getAbacusQuestions
);

module.exports = router;
