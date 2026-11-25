
const mongoose = require("mongoose");

const championshipAbacusQuestionSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      required: true,
      default: "Level 1",
      index: true
    },

    questionNumber: {
      type: Number,
      required: true
    },

    questionText: {
      type: String,
      required: true,
      trim: true
    },

    correctAnswer: {
      type: Number,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

championshipAbacusQuestionSchema.index(
  { level: 1, questionNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ChampionshipAbacusQuestion",
  championshipAbacusQuestionSchema
);
