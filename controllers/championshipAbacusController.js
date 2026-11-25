
const ChampionshipAbacusQuestion = require("../models/ChampionshipAbacusQuestion");
const ChampionshipAbacusAttempt = require("../models/ChampionshipAbacusAttempt");

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


// Start or resume a Level 1 Abacus test
exports.startAbacusTest = async (req, res) => {
  try {
    // Only championship participants can start
    if (
      req.user.accountType !== "championship" ||
      !req.user.studentId
    ) {
      return res.status(403).json({
        success: false,
        message: "Only championship participants can access this test."
      });
    }

    const level = "Level 1";

    // Check for an existing active attempt
    const existingAttempt =
      await ChampionshipAbacusAttempt.findOne({
        participant: req.user._id,
        level,
        status: "started"
      });

    if (existingAttempt) {
      const elapsedSeconds = Math.floor(
        (Date.now() - existingAttempt.startTime.getTime()) / 1000
      );

      if (elapsedSeconds >= existingAttempt.durationSeconds) {
        return res.status(403).json({
          success: false,
          message: "Your test time has expired."
        });
      }

      return res.status(200).json({
        success: true,
        message: "Existing test attempt resumed.",
        attemptId: existingAttempt._id,
        totalQuestions: existingAttempt.totalQuestions,
        currentQuestionIndex: existingAttempt.currentQuestionIndex,
        startTime: existingAttempt.startTime,
        durationSeconds: existingAttempt.durationSeconds,
        remainingSeconds: existingAttempt.durationSeconds - elapsedSeconds
      });
    }

    // Fetch active questions from database
    const questionBank = await ChampionshipAbacusQuestion.find({
      level,
      isActive: true
    });

    if (questionBank.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Abacus questions are available."
      });
    }

    // Shuffle questions for this participant
    const shuffledQuestions = [...questionBank];

    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffledQuestions[i], shuffledQuestions[j]] = [
        shuffledQuestions[j],
        shuffledQuestions[i]
      ];
    }

    // Store the shuffled questions and answers securely
    const questions = shuffledQuestions.map((question) => ({
      questionId: question._id,
      questionNumber: question.questionNumber,
      questionText: question.questionText,
      correctAnswer: question.correctAnswer
    }));

    const answers = questions.map((question, index) => ({
      questionIndex: index,
      answer: null,
      isAnswered: false,
      isLocked: false,
      isCorrect: false
    }));

    const startTime = new Date();

    const attempt = await ChampionshipAbacusAttempt.create({
      participant: req.user._id,
      participantId: req.user.studentId,
      level,
      questions,
      answers,
      currentQuestionIndex: 0,
      totalQuestions: questions.length,
      durationSeconds: 1800,
      startTime,
      status: "started"
    });

    return res.status(201).json({
      success: true,
      message: "Abacus test started successfully.",
      attemptId: attempt._id,
      totalQuestions: attempt.totalQuestions,
      currentQuestionIndex: 0,
      startTime: attempt.startTime,
      durationSeconds: attempt.durationSeconds,
      remainingSeconds: 1800
    });

  } catch (error) {
    console.error("Abacus test start error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start Abacus test."
    });
  }
};

// Get the current question for a participant
exports.getCurrentAbacusQuestion = async (req, res) => {
  try {
    const { attemptId } = req.body;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required."
      });
    }

    const attempt = await ChampionshipAbacusAttempt.findOne({
      _id: attemptId,
      participant: req.user._id,
      status: "started"
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Active test attempt not found."
      });
    }

    // Enforce timer on the server
    const elapsedSeconds = Math.floor(
      (Date.now() - attempt.startTime.getTime()) / 1000
    );

    if (elapsedSeconds >= attempt.durationSeconds) {
      return res.status(403).json({
        success: false,
        message: "Your test time has expired."
      });
    }

    const index = attempt.currentQuestionIndex;

    if (
      index < 0 ||
      index >= attempt.totalQuestions ||
      !attempt.questions[index]
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid current question."
      });
    }

    const answerRecord = attempt.answers[index];

    if (answerRecord && answerRecord.isLocked) {
      return res.status(403).json({
        success: false,
        message: "This question is already locked."
      });
    }

    const question = attempt.questions[index];

    return res.status(200).json({
      success: true,
      attemptId: attempt._id,
      questionIndex: index,
      totalQuestions: attempt.totalQuestions,
      questionText: question.questionText,
      questionNumber: index + 1,
      remainingSeconds: attempt.durationSeconds - elapsedSeconds
    });

  } catch (error) {
    console.error("Current Abacus question error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch current question."
    });
  }
};


// Lock the current question and move to the next question
exports.submitAbacusAnswerAndNext = async (req, res) => {
  try {
    const { attemptId, answer } = req.body;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required."
      });
    }

    const attempt = await ChampionshipAbacusAttempt.findOne({
      _id: attemptId,
      participant: req.user._id,
      status: "started"
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Active test attempt not found."
      });
    }

    // Server-enforced timer
    const elapsedSeconds = Math.floor(
      (Date.now() - attempt.startTime.getTime()) / 1000
    );

    if (elapsedSeconds >= attempt.durationSeconds) {
      return res.status(403).json({
        success: false,
        message: "Your test time has expired."
      });
    }

    const currentIndex = attempt.currentQuestionIndex;

    if (
      currentIndex < 0 ||
      currentIndex >= attempt.totalQuestions
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid question index."
      });
    }

    const currentAnswerRecord = attempt.answers[currentIndex];

    if (!currentAnswerRecord || currentAnswerRecord.isLocked) {
      return res.status(400).json({
        success: false,
        message: "This question is already locked or unavailable."
      });
    }

    // Accept either a numeric answer or an unanswered question
    let submittedAnswer = null;

    if (
      answer !== undefined &&
      answer !== null &&
      answer !== ""
    ) {
      submittedAnswer = Number(answer);

      if (!Number.isFinite(submittedAnswer)) {
        return res.status(400).json({
          success: false,
          message: "Answer must be a valid number."
        });
      }
    }

    const correctAnswer =
      attempt.questions[currentIndex].correctAnswer;

    currentAnswerRecord.answer = submittedAnswer;
    currentAnswerRecord.isAnswered = submittedAnswer !== null;
    currentAnswerRecord.isCorrect =
      submittedAnswer !== null &&
      submittedAnswer === correctAnswer;
    currentAnswerRecord.isLocked = true;

    // Move forward permanently
    attempt.currentQuestionIndex = currentIndex + 1;

    await attempt.save();

    // If all questions have been completed, do not expose answers
    if (attempt.currentQuestionIndex >= attempt.totalQuestions) {
      return res.status(200).json({
        success: true,
        message: "All questions completed.",
        completedQuestions: attempt.totalQuestions,
        testFinished: true
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question locked successfully.",
      nextQuestionIndex: attempt.currentQuestionIndex,
      testFinished: false
    });

  } catch (error) {
    console.error("Abacus answer submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit answer."
    });
  }
};

// Finish Abacus test and calculate final results
exports.finishAbacusTest = async (req, res) => {
  try {
    const { attemptId } = req.body;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required."
      });
    }

    const attempt = await ChampionshipAbacusAttempt.findOne({
      _id: attemptId,
      participant: req.user._id
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Test attempt not found."
      });
    }

    // Return saved results if already finalized
    if (attempt.status !== "started") {
      return res.status(200).json({
        success: true,
        message: "Test results already saved.",
        results: {
          totalQuestions: attempt.totalQuestions,
          correctCount: attempt.correctCount,
          wrongCount: attempt.wrongCount,
          unansweredCount: attempt.unansweredCount,
          totalMarks: attempt.totalMarks,
          durationFormatted: attempt.durationFormatted,
          status: attempt.status
        }
      });
    }

    const now = new Date();

    const elapsedSeconds = Math.max(
      0,
      Math.min(
        attempt.durationSeconds,
        Math.floor((now - attempt.startTime) / 1000)
      )
    );

    const timeExpired =
      elapsedSeconds >= attempt.durationSeconds;

    // A participant can finish manually only after all questions
    // have been permanently locked.
    if (
      !timeExpired &&
      attempt.currentQuestionIndex < attempt.totalQuestions
    ) {
      return res.status(403).json({
        success: false,
        message: "You must complete all questions before finishing."
      });
    }

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    // Lock every remaining question during finalization
    for (let i = 0; i < attempt.totalQuestions; i++) {
      const answerRecord = attempt.answers[i];
      const question = attempt.questions[i];

      if (!answerRecord.isLocked) {
        answerRecord.answer = null;
        answerRecord.isAnswered = false;
        answerRecord.isCorrect = false;
        answerRecord.isLocked = true;
      }

      if (!answerRecord.isAnswered) {
        unansweredCount++;
        answerRecord.isCorrect = false;
      } else if (
        answerRecord.answer === question.correctAnswer
      ) {
        correctCount++;
        answerRecord.isCorrect = true;
      } else {
        wrongCount++;
        answerRecord.isCorrect = false;
      }
    }

    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    const durationFormatted =
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0");

    attempt.correctCount = correctCount;
    attempt.wrongCount = wrongCount;
    attempt.unansweredCount = unansweredCount;
    attempt.totalMarks = correctCount;
    attempt.elapsedSeconds = elapsedSeconds;
    attempt.durationFormatted = durationFormatted;
    attempt.endTime = now;
    attempt.status = timeExpired ? "timedOut" : "completed";

    await attempt.save();

    return res.status(200).json({
      success: true,
      message: "Test results saved successfully.",
      results: {
        totalQuestions: attempt.totalQuestions,
        correctCount,
        wrongCount,
        unansweredCount,
        totalMarks: correctCount,
        elapsedSeconds,
        durationFormatted,
        status: attempt.status
      }
    });

  } catch (error) {
    console.error("Abacus test finish error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to finish Abacus test."
    });
  }
};
