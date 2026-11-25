
const ChampionshipAbacusQuestion = require("../models/ChampionshipAbacusQuestion");

// Import or update Abacus questions
exports.importAbacusQuestions = async (req, res) => {
  try {
    const { questions, level = "Level 1" } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid questions array."
      });
    }

    const operations = [];

    for (const question of questions) {
      if (
        !question.questionNumber ||
        typeof question.questionText !== "string" ||
        question.correctAnswer === undefined ||
        question.correctAnswer === null
      ) {
        return res.status(400).json({
          success: false,
          message: "Each question must contain questionNumber, questionText and correctAnswer."
        });
      }

      operations.push({
        updateOne: {
          filter: {
            level,
            questionNumber: question.questionNumber
          },
          update: {
            $set: {
              level,
              questionNumber: question.questionNumber,
              questionText: question.questionText.trim(),
              correctAnswer: Number(question.correctAnswer),
              isActive: true
            }
          },
          upsert: true
        }
      });
    }

    const result = await ChampionshipAbacusQuestion.bulkWrite(operations);

    return res.status(200).json({
      success: true,
      message: "Abacus questions imported successfully.",
      imported: result.upsertedCount,
      updated: result.modifiedCount
    });

  } catch (error) {
    console.error("Abacus question import error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to import Abacus questions."
    });
  }
};


// Get all questions for a level
exports.getAbacusQuestions = async (req, res) => {
  try {
    const level = req.query.level || "Level 1";

    const questions = await ChampionshipAbacusQuestion.find({
      level,
      isActive: true
    })
      .sort({ questionNumber: 1 })
      .select("-correctAnswer");

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions
    });

  } catch (error) {
    console.error("Abacus question fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Abacus questions."
    });
  }
};


// Get question count for a level
exports.getAbacusQuestionCount = async (req, res) => {
  try {
    const level = req.query.level || "Level 1";

    const count = await ChampionshipAbacusQuestion.countDocuments({
      level,
      isActive: true
    });

    return res.status(200).json({
      success: true,
      level,
      count
    });

  } catch (error) {
    console.error("Abacus question count error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get question count."
    });
  }
};
