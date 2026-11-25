const mongoose = require("mongoose");

const championshipAbacusAttemptSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    participantId: {
      type: String,
      required: true
    },

    level: {
      type: String,
      default: "Level 1",
      required: true
    },

    // Questions shuffled specifically for this attempt
    questions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ChampionshipAbacusQuestion",
          required: true
        },

        questionNumber: {
          type: Number,
          required: true
        },

        questionText: {
          type: String,
          required: true
        },

        correctAnswer: {
          type: Number,
          required: true
        }
      }
    ],

    // Answers and locking status for each question
    answers: [
      {
        questionIndex: {
          type: Number,
          required: true
        },

        answer: {
          type: Number,
          default: null
        },

        isAnswered: {
          type: Boolean,
          default: false
        },

        isLocked: {
          type: Boolean,
          default: false
        },

        isCorrect: {
          type: Boolean,
          default: false
        }
      }
    ],

    currentQuestionIndex: {
      type: Number,
      default: 0
    },

    totalQuestions: {
      type: Number,
      required: true
    },

    durationSeconds: {
      type: Number,
      default: 1800
    },

    startTime: {
      type: Date,
      required: true
    },

    endTime: {
      type: Date,
      default: null
    },

    elapsedSeconds: {
      type: Number,
      default: 0
    },

    durationFormatted: {
      type: String,
      default: "00:00:00"
    },

    correctCount: {
      type: Number,
      default: 0
    },

    wrongCount: {
      type: Number,
      default: 0
    },

    unansweredCount: {
      type: Number,
      default: 0
    },

    totalMarks: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["started", "completed", "timedOut"],
      default: "started"
    }
  },
  {
    timestamps: true
  }
);

championshipAbacusAttemptSchema.index({
  participant: 1,
  level: 1,
  status: 1
});

module.exports = mongoose.model(
  "ChampionshipAbacusAttempt",
  championshipAbacusAttemptSchema
);