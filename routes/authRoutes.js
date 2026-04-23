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

    const { email, newPassword } = req.body;

    const bcrypt = require("bcryptjs");

    const user = await User.findOne({ email });

    if(!user){
        return res.status(404).json({ message:"User not found ❌" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    await user.save();

    res.json({ message:"Password reset success ✅" });

});
module.exports = router;