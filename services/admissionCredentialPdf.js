
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateAdmissionCredentialPdf(student) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            });

            const chunks = [];

            doc.on("data", chunk => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            // =========================================
            // ACADEMY LOGO
            // =========================================

            const logoCandidates = [
                path.join(__dirname, "../images/gpa_logo.png"),
                path.join(__dirname, "../images/logo.png")
            ];

            const logoPath = logoCandidates.find(file => fs.existsSync(file));

            if (logoPath) {
                doc.image(logoPath, 50, 40, {
                    fit: [150, 65]
                });
            }

            // =========================================
            // HEADER
            // =========================================

            doc.moveDown(4);

            doc.font("Helvetica-Bold")
                .fontSize(20)
                .fillColor("#123456")
                .text("STUDENT ACCOUNT DETAILS", {
                    align: "center"
                });

            doc.moveDown(0.5);

            doc.font("Helvetica")
                .fontSize(11)
                .fillColor("#555555")
                .text("Gopes Pinnacle Academy", {
                    align: "center"
                });

            doc.moveDown(1.5);

            // Divider
            doc.moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .strokeColor("#123456")
                .lineWidth(1.5)
                .stroke();

            doc.moveDown(1.5);

            // =========================================
            // STUDENT INFORMATION
            // =========================================

            doc.font("Helvetica-Bold")
                .fontSize(13)
                .fillColor("#123456")
                .text("Student Information");

            doc.moveDown(0.8);

            doc.font("Helvetica")
                .fontSize(11)
                .fillColor("#222222");

            doc.text(`Student Name: ${student.name || "N/A"}`);
            doc.moveDown(0.4);

            doc.text(`Student ID: ${student.studentId || "N/A"}`);
            doc.moveDown(0.4);

            doc.text(`Grade / Class: ${student.grade || "N/A"}`);
            doc.moveDown(0.4);

            doc.text(`Board: ${student.board || "N/A"}`);

            doc.moveDown(1.5);

            // =========================================
            // LOGIN CREDENTIALS BOX
            // =========================================

            const boxX = 50;
            const boxY = doc.y;
            const boxWidth = 495;
            const boxHeight = 150;

            doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 10)
                .fillColor("#f0f6ff")
                .fill();

            doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 10)
                .strokeColor("#2563eb")
                .lineWidth(1)
                .stroke();

            doc.fillColor("#123456")
                .font("Helvetica-Bold")
                .fontSize(14)
                .text("LOGIN CREDENTIALS", boxX + 20, boxY + 20);

            doc.fillColor("#222222")
                .font("Helvetica")
                .fontSize(11);

            doc.text("Login Email:", boxX + 20, boxY + 55);

            doc.font("Helvetica-Bold")
                .fontSize(12)
                .fillColor("#000000")
                .text(student.email || "N/A", boxX + 20, boxY + 75);

            doc.font("Helvetica")
                .fontSize(11)
                .fillColor("#222222")
                .text("Temporary Password:", boxX + 20, boxY + 105);

            doc.font("Helvetica-Bold")
                .fontSize(13)
                .fillColor("#b91c1c")
                .text(student.temporaryPassword || "N/A", boxX + 155, boxY + 105);

            doc.y = boxY + boxHeight + 30;

            // =========================================
            // INSTRUCTIONS
            // =========================================

            doc.font("Helvetica-Bold")
                .fontSize(13)
                .fillColor("#123456")
                .text("Important Instructions");

            doc.moveDown(0.8);

            doc.font("Helvetica")
                .fontSize(11)
                .fillColor("#222222");

            doc.text(
                "1. Use the login email and temporary password provided above to log in to the Academy student portal.",
                {
                    width: 495,
                    lineGap: 5
                }
            );

            doc.moveDown(0.8);

            doc.text(
                "2. You must change your temporary password immediately after your first login.",
                {
                    width: 495,
                    lineGap: 5
                }
            );

            doc.moveDown(0.8);

            doc.text(
                "3. Please keep these login credentials confidential and do not share them with others.",
                {
                    width: 495,
                    lineGap: 5
                }
            );

            doc.moveDown(1.5);

            // =========================================
            // FOOTER MESSAGE
            // =========================================

            doc.font("Helvetica-Bold")
                .fontSize(12)
                .fillColor("#123456")
                .text("Welcome to Gopes Pinnacle Academy!", {
                    align: "center"
                });

            doc.moveDown(0.5);

            doc.font("Helvetica")
                .fontSize(10)
                .fillColor("#555555")
                .text(
                    "We wish you a wonderful learning journey.",
                    {
                        align: "center"
                    }
                );

            doc.moveDown(1);

            doc.font("Helvetica-Bold")
                .fontSize(11)
                .fillColor("#123456")
                .text("Gopes Pinnacle Academy", {
                    align: "center"
                });

            // =========================================
            // FINALIZE PDF
            // =========================================

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateAdmissionCredentialPdf
};
