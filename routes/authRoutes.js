const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

/* REGISTER */
router.post("/register", registerUser);

/* LOGIN */
router.post("/login", loginUser);


const bcrypt = require("bcrypt");
const User = require("../models/User");

router.post("/reset-password", async (req,res)=>{
try{

// 🔥 GET DATA
const email = req.body.email.trim();
const oldPassword = req.body.oldPassword.trim();
const newPassword = req.body.newPassword.trim();

// 🔥 DEBUG (YOU WILL SEE IN RENDER LOGS)
console.log("EMAIL:", email);
console.log("OLD PASSWORD:", oldPassword);

// 🔥 FIND USER
const user = await User.findOne({ email });

if(!user){
return res.json({ message:"User not found ❌" });
}

// 🔥 CHECK PASSWORD
const isMatch = await bcrypt.compare(oldPassword, user.password);

console.log("MATCH RESULT:", isMatch); // 👈 VERY IMPORTANT

if(!isMatch){
return res.json({ message:"Old password incorrect ❌" });
}

// 🔥 SAVE NEW PASSWORD
const hashedPassword = await bcrypt.hash(newPassword, 10);

user.password = hashedPassword;
await user.save();

res.json({ message:"Password updated successfully ✅" });

}catch(err){
console.log("RESET ERROR:", err);
res.status(500).json({ message:"Server error ❌" });
}
});
module.exports = router;