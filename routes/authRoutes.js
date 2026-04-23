const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const User = require("../models/User");
/* REGISTER */
router.post("/register", registerUser);

/* LOGIN */
router.post("/login", loginUser);


module.exports = router;