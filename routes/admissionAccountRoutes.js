const express = require("express");

const router = express.Router();

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const AdmissionAccount =
require("../models/AdmissionAccount");

/* =================================
   CREATE ADMISSION LOGIN
================================= */

router.post("/create", async(req,res)=>{

    try{

        const {
            parentName,
            email,
            password
        } = req.body;

        // CHECK EXISTING EMAIL
        const existing =
        await AdmissionAccount.findOne({
            email
        });

        if(existing){

            return res.json({

                success:false,

                message:
                "Email already exists"

            });

        }

        // HASH PASSWORD
        const hashedPassword =
        await bcrypt.hash(password,10);

        // SAVE ACCOUNT
        await AdmissionAccount.create({

            parentName,

            email,

            password:hashedPassword

        });

        res.json({

            success:true,

            message:
            "Admission Login Created"

        });

    }catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            message:"Server Error"

        });

    }

});

/* =================================
   LOGIN
================================= */

router.post("/login", async(req,res)=>{

    try{

        const {
            email,
            password
        } = req.body;

        // FIND ACCOUNT
        const user =
        await AdmissionAccount.findOne({
            email
        });

        if(!user){

            return res.json({

                success:false,

                message:"Invalid Email"

            });

        }

        // CHECK PASSWORD
        const match =
        await bcrypt.compare(
            password,
            user.password
        );

        if(!match){

            return res.json({

                success:false,

                message:"Wrong Password"

            });

        }

        // CREATE TOKEN
        const token = jwt.sign({

            id:user._id,

            role:"admission"

        },
        process.env.JWT_SECRET,
        {
            expiresIn:"7d"
        });

        res.json({

            success:true,

            token,

            user:{

                id:user._id,

                parentName:
                user.parentName,

                email:user.email

            }

        });

    }catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            message:"Server Error"

        });

    }

});

/* =================================
   GET ALL ACCOUNTS
================================= */

router.get("/all", async(req,res)=>{

    try{

        const accounts =
        await AdmissionAccount
        .find()
        .sort({ createdAt:-1 });

        res.json({

            success:true,

            data:accounts

        });

    }catch(err){

        console.log(err);

        res.status(500).json({

            success:false

        });

    }

});

module.exports = router;