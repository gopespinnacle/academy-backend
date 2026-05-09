const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AdmissionParent =
require("../models/AdmissionParent");

/* REGISTER */
router.post("/register", async(req,res)=>{

    try{

        const { email, password } = req.body;

        const existing =
        await AdmissionParent.findOne({ email });

        if(existing){
            return res.json({
                message:"Email already exists"
            });
        }

        const hashed =
        await bcrypt.hash(password,10);

        const user =
        await AdmissionParent.create({
            email,
            password:hashed
        });

        res.json({
            success:true
        });

    }catch(err){

        res.status(500).json({
            message:"Error"
        });

    }

});

/* LOGIN */
router.post("/login", async(req,res)=>{

    try{

        const { email, password } = req.body;

        const user =
        await AdmissionParent.findOne({ email });

        if(!user){

            return res.json({
                message:"Invalid Email"
            });

        }

        const match =
        await bcrypt.compare(
            password,
            user.password
        );

        if(!match){

            return res.json({
                message:"Wrong Password"
            });

        }

        const token =
        jwt.sign(
            {
                id:user._id
            },
            process.env.JWT_SECRET
        );

        res.json({
            token
        });

    }catch(err){

        res.status(500).json({
            message:"Error"
        });

    }

});

module.exports = router;