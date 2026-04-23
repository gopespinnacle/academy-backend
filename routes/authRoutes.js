const express = require("express");
const router = express.Router();

const { registerUser, loginUser } = require("../controllers/authController");

/* REGISTER */
router.post("/register", registerUser);

/* LOGIN */
router.post("/login", loginUser);


router.post("/reset-password", async (req,res)=>{
try{

const { email, oldPassword, newPassword } = req.body;

const user = await User.findOne({ loginEmail: email });

if(!user){
return res.json({ message:"User not found ❌" });
}

if(user.loginPassword !== oldPassword){
return res.json({ message:"Old password wrong ❌" });
}

user.loginPassword = newPassword;
await user.save();

res.json({ message:"Password updated successfully ✅" });

}catch(err){
res.status(500).json({ message:"Error" });
}
});
module.exports = router;