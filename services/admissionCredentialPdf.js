
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateAdmissionCredentialPdf(student) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 50,
                    right: 50
                }
            });

            const chunks = [];

            doc.on("data", chunk => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            const pageWidth = 495;

            // =========================================
            // ACADEMY LOGO
            // =========================================

            const logoCandidates = [
                path.join(__dirname, "../images/gpa_logo.png"),
                path.join(__dirname, "../images/logo.png")
            ];

            const logoPath = logoCandidates.find(file =>
                fs.existsSync(file)
            );

            if (logoPath) {
                doc.image(logoPath, 50, 40, {
                    fit: [145, 60]
                });
            }

            // =========================================
            // HEADER
            // =========================================

            doc.font("Helvetica-Bold")
                .fontSize(19)
                .fillColor("#123456")
                .text("STUDENT ACCOUNT DETAILS", 50, 125, {
                    width: pageWidth,
                    align: "center"
                });

            doc.font("Helvetica")
                .fontSize(10)
                .fillColor("#555555")
                .text("Gopes Pinnacle Academy", 50, 153, {
                    width: pageWidth,
                    align: "center"
                });

            doc.moveTo(50, 180)
                .lineTo(545, 180)
                .strokeColor("#123456")
                .lineWidth(1.5)
                .stroke();

            // =========================================
            // STUDENT INFORMATION
            // =========================================

            doc.font("Helvetica-Bold")
                .fontSize(12)
                .fillColor("#123456")
                .text("Student Information", 50, 200);

            doc.font("Helvetica")
                .fontSize(10.5)
                .fillColor("#222222");

            doc.text(`Student Name: ${student.name || "N/A"}`, 50, 225);
            doc.text(`Student ID: ${student.studentId || "N/A"}`, 50, 245);
            doc.text(`Grade / Class: ${student.grade || "N/A"}`, 50, 265);
            doc.text(`Board: ${student.board || "N/A"}`, 50, 285);

            // =========================================
            // LOGIN CREDENTIALS BOX
            // =========================================

            const boxX = 50;
            const boxY = 320;
            const boxWidth = 495;
            const boxHeight = 135;

            doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 10)
                .fillColor("#f0f6ff")
                .fill();

            doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 10)
                .strokeColor("#2563eb")
                .lineWidth(1)
                .stroke();

            doc.font("Helvetica-Bold")
                .fontSize(13)
                .fillColor("#123456")
                .text("LOGIN CREDENTIALS", boxX + 20, boxY + 18);

            doc.font("Helvetica")
                .fontSize(10.5)
                .fillColor("#222222")
                .text("Login Email:", boxX + 20, boxY + 48);

            doc.font("Helvetica-Bold")
                .fontSize(11)
                .fillColor("#000000")
                .text(student.email || "N/A", boxX + 20, boxY + 65, {
                    width: boxWidth - 40
                });

            doc.font("Helvetica")
                .fontSize(10.5)
                .fillColor("#222222")
                .text("Temporary Password:", boxX + 20, boxY + 95);

            doc.font("Helvetica-Bold")
                .fontSize(12)
                .fillColor("#b91c1c")
                .text(
                    student.temporaryPassword || "N/A",
                    boxX + 155,
                    boxY + 95,
                    {
                        width: boxWidth - 175
                    }
                );

            // =========================================
            // IMPORTANT INSTRUCTIONS
            // =========================================

            doc.font("Helvetica-Bold")
                .fontSize(12)
                .fillColor("#123456")
                .text("Important Instructions", 50, 485);

            doc.font("Helvetica")
                .fontSize(10)
                .fillColor("#222222");

            const instructions = [
                "Use the login email and temporary password provided above to log in to the Academy student portal.",
                "You must change your temporary password immediately after your first login.",
                "Please keep these login credentials confidential and do not share them with others."
            ];

            let instructionY = 510;

            instructions.forEach((instruction, index) => {
                doc.font("Helvetica-Bold")
                    .fontSize(10)
                    .fillColor("#123456")
                    .text(`${index + 1}.`, 50, instructionY, {
                        width: 20
                    });

                doc.font("Helvetica")
                    .fontSize(10)
                    .fillColor("#222222")
                    .text(instruction, 70, instructionY, {
                        width: 475,
                        lineGap: 4
                    });

                instructionY = doc.y + 15;
            });

            // =========================================
            // FOOTER MESSAGE
            // =========================================

            const footerY = Math.max(instructionY + 25, 680);

            doc.font("Helvetica-Bold")
                .fontSize(12)
                .fillColor("#123456")
                .text(
                    "Welcome to Gopes Pinnacle Academy!",
                    50,
                    footerY,
                    {
                        width: pageWidth,
                        align: "center"
                    }
                );

            doc.font("Helvetica")
                .fontSize(10)
                .fillColor("#555555")
                .text(
                    "We wish you a wonderful learning journey.",
                    50,
                    footerY + 25,
                    {
                        width: pageWidth,
                        align: "center"
                    }
                );

            doc.font("Helvetica-Bold")
                .fontSize(10.5)
                .fillColor("#123456")
                .text(
                    "Gopes Pinnacle Academy",
                    50,
                    footerY + 50,
                    {
                        width: pageWidth,
                        align: "center"
                    }
                );

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
