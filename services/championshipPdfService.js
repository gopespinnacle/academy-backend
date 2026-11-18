
const PDFDocument = require("pdfkit");
const path = require("path");

function generateChampionshipPDF(registration, participantId, loginId, temporaryPassword) {

    return new Promise((resolve, reject) => {

        try {

            const doc = new PDFDocument({
                size: "A4",
                margin: 50
            });

            const chunks = [];

            doc.on("data", chunk => chunks.push(chunk));

            doc.on("end", () => {
                resolve(Buffer.concat(chunks));
            });

            doc.on("error", reject);

            // Academy logo - top left corner
const logoPath = path.join(__dirname, "../assets/gpa_logo.png");

doc.image(logoPath, 50, 40, {
    width: 70
});

// Academy heading
doc
    .fillColor("#14294d")
    .fontSize(21)
    .font("Helvetica-Bold")
    .text("GOPES PINNACLE ACADEMY", {
        align: "center"
    });

            doc.moveDown(0.5);

            doc
                .fillColor("#b8892e")
                .fontSize(17)
                .text("PINNACLE STAR CHAMPIONSHIP 2026", {
                    align: "center"
                });

            doc.moveDown(0.5);

            doc
                .fillColor("#555555")
                .fontSize(10)
                .text("OFFICIAL PARTICIPANT REGISTRATION CONFIRMATION", {
                    align: "center"
                });

            doc.moveDown(2);

            doc
                .strokeColor("#d9ad45")
                .lineWidth(2)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();

            doc.moveDown(1.5);

            // Participant details
            doc
                .fillColor("#14294d")
                .fontSize(15)
                .font("Helvetica-Bold")
                .text("PARTICIPANT DETAILS");

            doc.moveDown(0.7);

            doc
                .fillColor("#222222")
                .fontSize(11)
                .font("Helvetica");

            doc.text(`Student Name: ${registration.studentName}`);
            doc.text(`Participant ID: ${participantId}`);
            doc.text(`Grade: ${registration.grade}`);
            doc.text(`Event Date: 27 December 2026`);

            doc.moveDown(0.7);

            doc.font("Helvetica-Bold").text("Registered Competitions:");

            doc.font("Helvetica");

            registration.competitions.forEach(item => {
                doc.text(`• ${item.competition} - ${item.category}`);
            });

            doc.moveDown(0.7);

            doc.text(`Registration Amount: Rs. ${registration.totalAmount}`);
            doc.text("Payment Status: VERIFIED");

            doc.moveDown(1.5);

            // Login credentials
            doc
                .fillColor("#14294d")
                .fontSize(15)
                .font("Helvetica-Bold")
                .text("PARTICIPANT LOGIN CREDENTIALS");

            doc.moveDown(0.8);

            doc
                .fillColor("#222222")
                .fontSize(12)
                .font("Helvetica");

            doc.text(`Login Website: https://www.gopespinnacle.com/student-login.html`);
            doc.moveDown(0.5);

            doc
                .fillColor("#087b3d")
                .font("Helvetica-Bold")
                .text(`Login ID: ${loginId}`);

            doc
                .fillColor("#087b3d")
                .text(`Temporary Password: ${temporaryPassword}`);

            doc.moveDown(1);

            doc
                .fillColor("#b00020")
                .fontSize(10)
                .font("Helvetica-Bold")
                .text(
                    "IMPORTANT: Please change your temporary password immediately after your first login. Keep your login credentials confidential."
                );

            doc.moveDown(2);

            doc
                .fillColor("#555555")
                .fontSize(10)
                .font("Helvetica")
                .text(
                    "Congratulations! We look forward to welcoming you to Pinnacle Star Championship 2026.",
                    { align: "center" }
                );

            doc.moveDown(1);

            doc
                .fillColor("#14294d")
                .font("Helvetica-Bold")
                .text("Gopes Pinnacle Academy", {
                    align: "center"
                });

            doc.end();

        } catch (error) {
            reject(error);
        }

    });
}

module.exports = {
    generateChampionshipPDF
};
