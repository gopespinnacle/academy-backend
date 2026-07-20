const express = require("express");
const router = express.Router();

const { testOpenAI } = require("../services/openAIService");

router.get("/test", async (req, res) => {

    try {

        const result = await testOpenAI();

        res.json({

            success: true,
            message: result

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

module.exports = router;