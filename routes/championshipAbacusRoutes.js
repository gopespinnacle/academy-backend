
const express = require("express");
const router = express.Router();

const {
  importAbacusQuestions,
  getAbacusQuestions,
  getAbacusQuestionCount,
  startAbacusTest,
  getCurrentAbacusQuestion,
  submitAbacusAnswerAndNext,
  finishAbacusTest
} = require("../controllers/championshipAbacusController");

const {
  protect,
  authorize,
  requireChampionshipParticipant
} = require("../middleware/authMiddleware");

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

// Start Abacus test - logged-in championship participant
router.post(
  "/start",
  protect,
  requireChampionshipParticipant,
  startAbacusTest
);


// Get current question
router.post(
  "/current-question",
  protect,
  requireChampionshipParticipant,
  getCurrentAbacusQuestion
);

// Submit answer and permanently move to next question
router.post(
  "/next",
  protect,
  requireChampionshipParticipant,
  submitAbacusAnswerAndNext
);

// Finish Abacus test and save results
router.post(
  "/finish",
  protect,
  requireChampionshipParticipant,
  finishAbacusTest
);

module.exports = router;
