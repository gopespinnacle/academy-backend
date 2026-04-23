const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { registerUser, loginUser } = require("../controllers/authController");

/* REGISTER */
router.post("/register", registerUser);

/* LOGIN */
router.post("/login", loginUser);


const bcrypt = require("bcrypt");

router.post("/reset-password", async (req,res)=>{
try{

const { email, oldPassword, newPassword } = req.body;

/* FIND USER */
const user = await User.findOne({ email });

if(!user){
return res.json({ message:"User not found ❌" });
}

/* CHECK OLD PASSWORD */
const isMatch = await bcrypt.compare(oldPassword, user.password);

if(!isMatch){
return res.json({ message:"Old password incorrect ❌" });
}

/* HASH NEW PASSWORD */
const hashedPassword = await bcrypt.hash(newPassword, 10);

/* SAVE */
user.password = hashedPassword;
await user.save();

res.json({ message:"Password updated successfully ✅" });

}catch(err){
console.log(err);
res.status(500).json({ message:"Server error ❌" });
}
});
module.exports = router;