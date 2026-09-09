const PDFDocument = require("pdfkit");

/*
=====================================================
GOPES PINNACLE ACADEMY
ACADEMIC SERVICE FEE PAYMENT ACKNOWLEDGEMENT
=====================================================
*/

function createTeacherPaymentReceipt(payment) {

    return new Promise((resolve, reject) => {

        try {

            const doc = new PDFDocument({
                size: "A4",
                margin: 50
            });

            const chunks = [];

            doc.on("data", chunk => {
                chunks.push(chunk);
            });

            doc.on("end", () => {
                resolve(Buffer.concat(chunks));
            });

            doc.on("error", error => {
                reject(error);
            });


            // =========================================
            // ACADEMY NAME
            // =========================================

            doc
                .fontSize(20)
                .font("Helvetica-Bold")
                .text(
                    "GOPES PINNACLE ACADEMY",
                    {
                        align: "center"
                    }
                );

            doc
                .moveDown(0.5)
                .fontSize(14)
                .font("Helvetica-Bold")
                .text(
                    "ACADEMIC SERVICE FEE PAYMENT ACKNOWLEDGEMENT",
                    {
                        align: "center"
                    }
                );


            doc.moveDown(1);


            // =========================================
            // RECEIPT DETAILS
            // =========================================

            doc
                .fontSize(11)
                .font("Helvetica")
                .text(
                    `Receipt Number: ${payment.receiptNumber}`
                );

            doc.text(
                `Payment Date: ${new Date(
                    payment.paymentDate
                ).toLocaleDateString("en-IN")}`
            );

            doc.text(
                `Fee Month: ${payment.feeMonth}`
            );


            doc.moveDown(1);


            // =========================================
            // TEACHER DETAILS
            // =========================================

            doc
                .fontSize(13)
                .font("Helvetica-Bold")
                .text("Teacher Details");

            doc.moveDown(0.3);

            doc
                .fontSize(11)
                .font("Helvetica")
                .text(
                    `Teacher Name: ${payment.teacherName}`
                );

            doc.text(
                `Teacher ID: ${payment.teacherId}`
            );


            doc.moveDown(1);


            // =========================================
            // STUDENTS HANDLED
            // =========================================

            doc
                .fontSize(13)
                .font("Helvetica-Bold")
                .text("Students Handled by Teacher");

            doc.moveDown(0.3);


            if (
                payment.students &&
                payment.students.length > 0
            ) {

                payment.students.forEach(
                    (student, index) => {

                        doc
                            .fontSize(11)
                            .font("Helvetica")
                            .text(
                                `${index + 1}. ${
                                    student.studentName || ""
                                }${
                                    student.studentId
                                        ? ` (${student.studentId})`
                                        : ""
                                }`
                            );

                    }
                );

            } else {

                doc
                    .fontSize(11)
                    .font("Helvetica")
                    .text(
                        "No students currently assigned."
                    );

            }


            doc.moveDown(1);


            // =========================================
            // PAYMENT
            // =========================================

            doc
                .fontSize(13)
                .font("Helvetica-Bold")
                .text("Payment Details");

            doc.moveDown(0.3);

            doc
                .fontSize(12)
                .font("Helvetica-Bold")
                .text(
                    `Total Fee: Rs. ${Number(
                        payment.totalFee || 0
                    ).toLocaleString("en-IN")}`
                );

            doc.text(
                `Payment Status: ${payment.paymentStatus || "PAID"}`
            );


            doc.moveDown(1);


            // =========================================
            // IMPORTANT DESCRIPTION
            // =========================================

            doc
                .fontSize(13)
                .font("Helvetica-Bold")
                .text("Nature of Payment");

            doc.moveDown(0.3);

            doc
                .fontSize(10.5)
                .font("Helvetica")
                .text(
                    "This document acknowledges the payment made by " +
                    "Gopes Pinnacle Academy for academic services " +
                    "provided during the period stated above."
                );

            doc.moveDown(0.5);

            doc.text(
                "This acknowledgement records the payment and the " +
                "academic service arrangement between the Academy " +
                "and the concerned teacher. It is not intended to " +
                "independently determine or alter the legal status " +
                "of the relationship between the parties."
            );


            doc.moveDown(1);


            // =========================================
            // DECLARATION
            // =========================================

            doc
                .fontSize(10)
                .font("Helvetica")
                .text(
                    "This acknowledgement is issued for Academy " +
                    "administrative and payment-record purposes."
                );


            doc.moveDown(2);


            // =========================================
            // FOOTER
            // =========================================

            doc
                .fontSize(9)
                .font("Helvetica")
                .text(
                    "Gopes Pinnacle Academy",
                    {
                        align: "center"
                    }
                );

            doc
                .fontSize(8)
                .text(
                    "Academic Service Fee Payment Record",
                    {
                        align: "center"
                    }
                );


            doc.end();

        }

        catch (error) {

            reject(error);

        }

    });

}


module.exports = {
    createTeacherPaymentReceipt
};