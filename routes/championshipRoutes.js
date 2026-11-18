
const express = require("express");
const router = express.Router();

const multer = require("multer");

const ChampionshipRegistration =
    require("../models/ChampionshipRegistration");

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
   FOUNDER - VERIFY CHAMPIONSHIP PAYMENT
========================================== */

router.put(
    "/founder/:id/verify",
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

            registration.participantId = participantId;

            registration.payment.status = "Verified";
            registration.payment.verifiedBy = req.user._id;
            registration.payment.verifiedAt = new Date();

            registration.registrationStatus = "Confirmed";

            await registration.save();

            res.json({
                success: true,
                message: "Payment verified successfully",
                participantId,
                registration
            });

        } catch (error) {

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

module.exports = router;
