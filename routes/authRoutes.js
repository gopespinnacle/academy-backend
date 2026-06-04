const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const User = require("../models/User");
/* REGISTER */
router.post("/register", registerUser);

/* LOGIN */
router.post("/login", loginUser);

router.get(
"/students",
async(req,res)=>{

try{

const students =
await User.find({
role:"student"
});

res.json(
students
);

}catch(err){

res.status(500).json({
message:"Server Error"
});

}

});


module.exports = router;