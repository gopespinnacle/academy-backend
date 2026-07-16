const express = require("express");
const router = express.Router();

const sendFounderErrorMail = require("../utils/sendFounderErrorMail");

router.post("/report-client-error", async (req,res)=>{

    try{

        await sendFounderErrorMail(req.body);

        res.json({
            success:true
        });

    }catch(err){

        console.error(err);

        res.status(500).json({
            success:false
        });

    }

});

module.exports = router;