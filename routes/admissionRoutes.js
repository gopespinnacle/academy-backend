
const express = require("express");
const router = express.Router();
const Admission = require("../models/Admission");
const AdmissionEnquiry = require("../models/AdmissionEnquiry");
const { sendWhatsAppTemplate } = require("../services/whatsappService");

router.post("/admission", async (req, res) => {
    try {
        const {
            parentName,
            studentName,
            grade,
            board, // ✅ NEW
            mobile,
            courses,

            studentDOB,
            parentMobile,
            parentWhatsapp,
            parentEmail,
            address,
            subjects,
            selectedPlan,
            totalAmount,
            utr
        } = req.body;

        let newAdmission;

        if (
            studentDOB ||
            parentMobile ||
            parentWhatsapp ||
            parentEmail ||
            address ||
            subjects ||
            selectedPlan
        ) {

            // FULL ADMISSION DASHBOARD
            newAdmission = new Admission({
                parentName,
                studentName,
                grade,
                board, // ✅ SAVE BOARD IN DB
                mobile,
                courses,

                studentDOB,
                parentMobile,
                parentWhatsapp,
                parentEmail,
                address,
                subjects,
                selectedPlan,
                totalAmount,
                utr
            });

        } else {

            // HOMEPAGE ENQUIRY
            newAdmission = new AdmissionEnquiry({
                parentName,
                studentName,
                grade,
                mobile,
                courses
            });

        }

        await newAdmission.save();

     // ===============================
// SEND WHATSAPP TEMPLATE TO FOUNDER
// ===============================

const founderPhone = "919566911472";

let founderWhatsAppResult = null;

try {

    founderWhatsAppResult = await sendWhatsAppTemplate(
        founderPhone,
        [
            parentName || "N/A",
            studentName || "N/A",
            grade || "N/A",
            board || "N/A",
            parentMobile || mobile || "N/A",
            parentWhatsapp || "N/A",
            parentEmail || "N/A",
            Array.isArray(courses) ? courses.join(", ") : (courses || "N/A"),
            Array.isArray(subjects) ? subjects.join(", ") : (subjects || "N/A"),
            selectedPlan || "N/A",
            String(totalAmount || 0),
            utr || "N/A"
        ],
        "new_admission_founder_alert"
    );

    console.log("Founder WhatsApp:", founderWhatsAppResult.success);

} catch (whatsappError) {
    console.error("Founder WhatsApp failed:", whatsappError.message);
}


// ===============================
// SEND WHATSAPP TEMPLATE TO PARENT
// ===============================

let parentPhone = parentWhatsapp || parentMobile || mobile || "";

parentPhone = String(parentPhone).replace(/\D/g, "");

if (parentPhone.length === 10) {
    parentPhone = "91" + parentPhone;
} else if (parentPhone.startsWith("0") && parentPhone.length === 11) {
    parentPhone = "91" + parentPhone.substring(1);
}

let parentWhatsAppResult = null;

if (parentPhone) {

    try {

        parentWhatsAppResult = await sendWhatsAppTemplate(
            parentPhone,
            [
                parentName || "Parent",
                studentName || "N/A",
                grade || "N/A",
                board || "N/A",
                String(totalAmount || 0),
                utr || "N/A"
            ],
            "admission_payment_confirmation"
        );

        console.log("Parent WhatsApp:", parentWhatsAppResult.success);

    } catch (whatsappError) {

        console.error("Parent WhatsApp failed:", whatsappError.message);

    }

}

// ===============================
// FINAL RESPONSE
// ===============================

res.status(200).json({
    message: "Admission saved successfully",
    whatsapp: {
        founder: founderWhatsAppResult?.success || false,
        parent: parentWhatsAppResult?.success || false
    }
});

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
