
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const multer = require("multer");

const ChampionshipRegistration =
    require("../models/ChampionshipRegistration");

    const User = require("../models/User");

    const ChampionshipPasswordOTP =
    require("../models/ChampionshipPasswordOTP");

const {
    sendChampionshipOTP
} = require("../services/whatsappService");

const {
    uploadFile: uploadToS3
} = require("../config/s3");

// Payment proof upload
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error("Only JPG, PNG, WEBP or PDF files are allowed")
            );
        }

        cb(null, true);
    }
});

const Counter = require("../models/Counter");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

/* CHAMPIONSHIP REGISTRATION */

router.post(
    "/register",
    upload.single("paymentProof"),
    async (req, res) => {


        try {

            const {
                parentName,
                parentPhone,
                parentEmail,
                studentName,
                dateOfBirth,
                grade,
                schoolName,
                paymentMethod,
                transactionReference
            } = req.body;

            // Basic validation
            if (
                !parentName ||
                !parentPhone ||
                !studentName ||
                !dateOfBirth ||
                !grade ||
                !paymentMethod ||
                !transactionReference
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please fill all required details"
                });
            }

            if (!["UPI", "Bank Transfer"].includes(paymentMethod)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid payment method"
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Please upload payment proof"
                });
            }

            // Read selected competitions
            let competitions;

            try {
                competitions = JSON.parse(req.body.competitions);
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid competition selection"
                });
            }

            if (
                !Array.isArray(competitions) ||
                competitions.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Select at least one competition"
                });
            }

            const allowedCompetitions = [
                "Science",
                "Abacus",
                "Drawing",
                "Vocal Singing",
                "Essay Writing",
                "Spotlight Speaker"
            ];

            for (const item of competitions) {

                if (
                    !allowedCompetitions.includes(item.competition) ||
                    !item.category ||
                    typeof item.category !== "string"
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid competition or category"
                    });
                }
            }

            // Prevent duplicate competition selections
const selectedCompetitionNames =
    competitions.map(item => item.competition);

const uniqueCompetitionNames =
    new Set(selectedCompetitionNames);

if (uniqueCompetitionNames.size !== competitions.length) {
    return res.status(400).json({
        success: false,
        message: "A competition can only be selected once"
    });
}

            // Calculate fee on the server
            const feePerCompetition = 199;

            const totalAmount =
                competitions.length * feePerCompetition;

            // Upload payment proof to existing S3 bucket
            const uploadedFile = await uploadToS3(
                req.file,
                "Championship/PaymentProofs"
            );

            // Save registration
            const registration =
                await ChampionshipRegistration.create({

                    parentName,
                    parentPhone,
                    parentEmail,

                    studentName,
                    dateOfBirth,
                    grade,
                    schoolName,

                    competitions,

                    feePerCompetition,
                    totalAmount,

                    payment: {
                        method: paymentMethod,
                        transactionReference,
                        paymentProofUrl: uploadedFile.Location,
                        paymentProofKey: uploadedFile.Key,
                        status: "Pending"
                    },

                    registrationStatus: "Payment Pending"

                });

            res.status(201).json({
                success: true,
                message: "Registration submitted. Payment verification is pending.",
                registrationId: registration._id,
                totalAmount: registration.totalAmount
            });

        } catch (err) {

            console.error(
                "Championship registration error:",
                err
            );

            res.status(500).json({
                success: false,
                message: "Unable to submit registration"
            });

        }

    }
);


/* ==========================================
   FOUNDER - VIEW CHAMPIONSHIP REGISTRATIONS
========================================== */

router.get(
    "/founder/registrations",
    protect,
    authorize("founder"),
    async (req, res) => {

        try {

            const registrations =
                await ChampionshipRegistration.find()
                    .sort({ createdAt: -1 });

            res.json({
                success: true,
                registrations
            });

        } catch (error) {

            console.error(
                "CHAMPIONSHIP REGISTRATION LIST ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to load registrations"
            });

        }

    }
);


/* ==========================================
   PARTICIPANT - VIEW OWN REGISTRATION
========================================== */

router.get(
    "/participant/me",
    protect,
    authorize("student"),
    async (req, res) => {

        try {

            // Confirm this is a championship account
            const user = await User.findById(req.user._id);

            if (!user || user.accountType !== "championship") {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Championship participants only."
                });
            }

            // Require permanent password before dashboard access
if (user.mustChangePassword === true) {
    return res.status(403).json({
        success: false,
        mustChangePassword: true,
        message: "Please change your temporary password before accessing the dashboard."
    });
}

            // Find only this participant's registration
            const registration =
                await ChampionshipRegistration.findOne({
                    participantUser: user._id,
                    registrationStatus: "Confirmed",
                    "payment.status": "Verified"
                }).select(
                    "studentName grade competitions participantId registrationStatus registeredAt createdAt"
                );

            if (!registration) {
                return res.status(404).json({
                    success: false,
                    message: "Championship registration not found."
                });
            }

            res.json({
                success: true,
                participant: {
                    studentName: registration.studentName,
                    grade: registration.grade,
                    participantId: registration.participantId,
                    competitions: registration.competitions,
                    registrationStatus: registration.registrationStatus,
                    eventDate: "December 27, 2026"
                }
            });

        } catch (error) {

            console.error(
                "CHAMPIONSHIP PARTICIPANT DETAILS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to load participant details."
            });

        }

    }
);


/* ==========================================
   FOUNDER - VERIFY CHAMPIONSHIP PAYMENT
========================================== */

router.put(
    "/founder/:id/verify",
    protect,
    authorize("founder"),
    async (req, res) => {
                let createdParticipantUser = null;

        try {

            const registration =
                await ChampionshipRegistration.findById(
                    req.params.id
                );

            if (!registration) {
                return res.status(404).json({
                    success: false,
                    message: "Registration not found"
                });
            }

            if (
                registration.payment.status !== "Pending" ||
                registration.registrationStatus !== "Payment Pending"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "This registration is not pending verification"
                });
            }

            // Generate unique participant ID
            const counter =
                await Counter.findByIdAndUpdate(
                    "championship2026",
                    {
                        $inc: {
                            sequenceValue: 1
                        }
                    },
                    {
                        new: true,
                        upsert: true
                    }
                );

            const participantId =
                `PSC26-${String(counter.sequenceValue).padStart(4, "0")}`;


// Generate participant login credentials
const loginId = participantId;

const temporaryPassword = "Gopes@1";

// Create separate championship student account
createdParticipantUser = await User.create({

    name: registration.studentName,

    email: loginId,

    password: temporaryPassword,

    role: "student",

    grade: registration.grade,

    mobile: registration.parentPhone,

      whatsapp: registration.parentPhone,

    accountType: "championship",
    mustChangePassword: true,

    menuPermissions: {
        dashboard: true,
        myClasses: false,
        attendance: false,
        aiAssessment: false,
        homework: false,
        calendar: false,
        marksEntry: false
    }

});


            registration.participantId = participantId;

            registration.participantUser = createdParticipantUser._id;

registration.loginId = loginId;

registration.accountCreatedAt = new Date();

            registration.payment.status = "Verified";
            registration.payment.verifiedBy = req.user._id;
            registration.payment.verifiedAt = new Date();

            registration.registrationStatus = "Confirmed";

            await registration.save();

            res.json({
    success: true,

    message: "Payment verified and participant account created successfully",

    participantId,

    loginId,

    temporaryPassword,

    registration
});

        } catch (error) {


            if (createdParticipantUser) {
    try {
        await User.findByIdAndDelete(createdParticipantUser._id);
    } catch (cleanupError) {
        console.error(
            "PARTICIPANT ACCOUNT CLEANUP ERROR:",
            cleanupError
        );
    }
}

            console.error(
                "CHAMPIONSHIP PAYMENT VERIFICATION ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to verify payment"
            });

        }

    }
);


/* ==========================================
   FOUNDER - REJECT CHAMPIONSHIP PAYMENT
========================================== */

router.put(
    "/founder/:id/reject",
    protect,
    authorize("founder"),
    async (req, res) => {

        try {

            const registration =
                await ChampionshipRegistration.findById(
                    req.params.id
                );

            if (!registration) {
                return res.status(404).json({
                    success: false,
                    message: "Registration not found"
                });
            }

            if (
                registration.payment.status !== "Pending" ||
                registration.registrationStatus !== "Payment Pending"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "This registration is not pending verification"
                });
            }

            registration.payment.status = "Rejected";

            registration.payment.rejectionReason =
                req.body.reason || "Payment could not be verified";

            registration.registrationStatus = "Rejected";

            await registration.save();

            res.json({
                success: true,
                message: "Payment rejected successfully"
            });

        } catch (error) {

            console.error(
                "CHAMPIONSHIP PAYMENT REJECTION ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to reject payment"
            });

        }

    }
);


/* RESET CHAMPIONSHIP TEST PARTICIPANT PASSWORD */

router.put(
    "/founder/reset-test-password/:participantId",
    protect,
    authorize("founder"),
    async (req, res) => {

        try {

            const user = await User.findOne({
                email: req.params.participantId,
                accountType: "championship"
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Championship participant not found."
                });
            }

            user.password = "Gopes@1";
            user.mustChangePassword = true;
            user.passwordChangedAt = new Date();

            await user.save();

            return res.json({
                success: true,
                message: "Test participant password reset successfully.",
                loginId: user.email,
                temporaryPassword: "Gopes@1"
            });

        } catch (error) {

            console.error("TEST PASSWORD RESET ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to reset test password."
            });

        }
    }
);

/* ==========================================
   PARTICIPANT - SEND PASSWORD RESET OTP
========================================== */

router.post(
    "/participant/forgot-password",
    async (req, res) => {
        const genericMessage =
            "If the participant details are valid, an OTP will be sent to the registered WhatsApp number.";

        try {
            const { participantId } = req.body;

            if (!participantId) {
                return res.status(200).json({
                    success: true,
                    message: genericMessage
                });
            }

            const user = await User.findOne({
                email: participantId.trim().toUpperCase(),
                accountType: "championship"
            });

            if (!user) {
                return res.status(200).json({
                    success: true,
                    message: genericMessage
                });
            }

            const registration =
                await ChampionshipRegistration.findOne({
                    participantUser: user._id,
                    registrationStatus: "Confirmed",
                    "payment.status": "Verified"
                });

            if (!registration || !registration.parentPhone) {
                return res.status(200).json({
                    success: true,
                    message: genericMessage
                });
            }

            // Prevent OTP requests within 60 seconds
            const existingOTP =
                await ChampionshipPasswordOTP.findOne({
                    participantUser: user._id
                });

            if (
                existingOTP &&
                Date.now() - existingOTP.lastSentAt.getTime() < 60000
            ) {
                return res.status(200).json({
                    success: true,
                    message: genericMessage
                });
            }

            // Generate a secure 6-digit OTP
            const otp = crypto.randomInt(100000, 1000000).toString();

            const otpHash = crypto
                .createHash("sha256")
                .update(otp)
                .digest("hex");

            // Normalize Indian mobile numbers
            let phone = registration.parentPhone.replace(/\D/g, "");

            if (phone.length === 10) {
                phone = "91" + phone;
            } else if (phone.length === 11 && phone.startsWith("0")) {
                phone = "91" + phone.substring(1);
            }

            if (phone.length < 11) {
                return res.status(200).json({
                    success: true,
                    message: genericMessage
                });
            }

            // Save hashed OTP
            await ChampionshipPasswordOTP.findOneAndUpdate(
                { participantUser: user._id },
                {
                    participantUser: user._id,
                    otpHash,
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                    attempts: 0,
                    lastSentAt: new Date()
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

           const whatsappResult = await sendChampionshipOTP(
    phone,
    otp
);

            if (!whatsappResult.success) {
                await ChampionshipPasswordOTP.deleteOne({
                    participantUser: user._id
                });

                console.error(
                    "CHAMPIONSHIP OTP WHATSAPP DELIVERY FAILED:",
                    whatsappResult.error
                );
            }

            return res.status(200).json({
                success: true,
                message: genericMessage
            });

        } catch (error) {
            console.error("CHAMPIONSHIP SEND OTP ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to process the request. Please try again."
            });
        }
    }
);


/* ==========================================
   PARTICIPANT - VERIFY PASSWORD RESET OTP
========================================== */

router.post(
    "/participant/verify-otp",
    async (req, res) => {
        try {
            const { participantId, otp } = req.body;

            if (!participantId || !otp) {
                return res.status(400).json({
                    success: false,
                    message: "Participant ID and OTP are required."
                });
            }

            const user = await User.findOne({
                email: participantId.trim().toUpperCase(),
                accountType: "championship"
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid participant ID or OTP."
                });
            }

            const otpRecord =
                await ChampionshipPasswordOTP.findOne({
                    participantUser: user._id
                });

            if (!otpRecord) {
                return res.status(400).json({
                    success: false,
                    message: "OTP expired or not found. Please request a new OTP."
                });
            }

            // Check expiry
            if (Date.now() > otpRecord.expiresAt.getTime()) {
                await ChampionshipPasswordOTP.deleteOne({
                    _id: otpRecord._id
                });

                return res.status(400).json({
                    success: false,
                    message: "OTP has expired. Please request a new OTP."
                });
            }

            // Check maximum attempts
            if (otpRecord.attempts >= 5) {
                await ChampionshipPasswordOTP.deleteOne({
                    _id: otpRecord._id
                });

                return res.status(429).json({
                    success: false,
                    message: "Maximum OTP attempts exceeded. Please request a new OTP."
                });
            }

            // Hash submitted OTP
            const submittedHash = crypto
                .createHash("sha256")
                .update(String(otp))
                .digest("hex");

            const storedHashBuffer =
                Buffer.from(otpRecord.otpHash, "hex");

            const submittedHashBuffer =
                Buffer.from(submittedHash, "hex");

            const isValid =
                storedHashBuffer.length === submittedHashBuffer.length &&
                crypto.timingSafeEqual(
                    storedHashBuffer,
                    submittedHashBuffer
                );

            if (!isValid) {
                otpRecord.attempts += 1;

                if (otpRecord.attempts >= 5) {
                    await ChampionshipPasswordOTP.deleteOne({
                        _id: otpRecord._id
                    });

                    return res.status(429).json({
                        success: false,
                        message: "Maximum OTP attempts exceeded. Please request a new OTP."
                    });
                }

                await otpRecord.save();

                return res.status(400).json({
                    success: false,
                    message: "Incorrect OTP. Please try again."
                });
            }

            // OTP can only be used once
            await ChampionshipPasswordOTP.deleteOne({
                _id: otpRecord._id
            });

            // Generate short-lived password reset token
            const resetToken = jwt.sign(
                {
                    id: user._id,
                    purpose: "championship-password-reset"
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "10m"
                }
            );

            return res.json({
                success: true,
                message: "OTP verified successfully.",
                resetToken
            });

        } catch (error) {
            console.error(
                "CHAMPIONSHIP OTP VERIFICATION ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to verify OTP. Please try again."
            });
        }
    }
);


/* ==========================================
   PARTICIPANT - RESET PERMANENT PASSWORD
========================================== */

router.post(
    "/participant/reset-password",
    async (req, res) => {
        try {
            const {
                resetToken,
                newPassword,
                confirmPassword
            } = req.body;

            if (!resetToken || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Please fill all required fields."
                });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "Password must contain at least 8 characters."
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Passwords do not match."
                });
            }

            // Verify the short-lived reset token
            let decoded;

            try {
                decoded = jwt.verify(
                    resetToken,
                    process.env.JWT_SECRET
                );
            } catch (tokenError) {
                return res.status(401).json({
                    success: false,
                    message: "Password reset session expired. Please verify OTP again."
                });
            }

            if (
                decoded.purpose !== "championship-password-reset" ||
                !decoded.id
            ) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid password reset session."
                });
            }

            const user = await User.findById(decoded.id);

            if (!user || user.accountType !== "championship") {
                return res.status(404).json({
                    success: false,
                    message: "Championship participant not found."
                });
            }

            // Prevent reuse of a reset token after password change
            if (
                user.passwordChangedAt &&
                decoded.iat * 1000 < user.passwordChangedAt.getTime()
            ) {
                return res.status(401).json({
                    success: false,
                    message: "This password reset session has already been used."
                });
            }

            // Save the new permanent password
            user.password = newPassword;
            user.mustChangePassword = false;
            user.passwordChangedAt = new Date();

            await user.save();

            return res.json({
                success: true,
                message: "Password changed successfully. Please login again."
            });

        } catch (error) {
            console.error(
                "CHAMPIONSHIP PASSWORD RESET ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to reset password. Please try again."
            });
        }
    }
);

module.exports = router;
