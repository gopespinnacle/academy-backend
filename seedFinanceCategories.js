const mongoose = require("mongoose");
require("dotenv").config();

const FinanceCategory = require("./models/FinanceCategory");


// ==========================================================
// GOPES PINNACLE ACADEMY
// FINANCE CATEGORY MASTER DATA
// ==========================================================


const financeCategories = [

    // ======================================================
    // INCOME
    // ======================================================

    {
        type: "Income",
        category: "Student Fees",
        subCategories: [
            "Monthly Tuition Fees",
            "Regular Student Payments"
        ]
    },

    {
        type: "Income",
        category: "Admission Fees",
        subCategories: [
            "New Admission Fee",
            "Admission Processing Fee",
            "Other Admission Charges"
        ]
    },

    {
        type: "Income",
        category: "Registration Fees",
        subCategories: [
            "Academy Registration",
            "Course Registration",
            "Application Fee"
        ]
    },

    {
        type: "Income",
        category: "Course Fees",
        subCategories: [
            "Vacation Course",
            "Special Course",
            "Short-Term Course",
            "Other Course Fees"
        ]
    },

    {
        type: "Income",
        category: "ECA Fees",
        subCategories: [
            "Sports",
            "Music",
            "Art",
            "Other ECA"
        ]
    },

    {
        type: "Income",
        category: "Assessment / Exam Fees",
        subCategories: [
            "Assessment Fee",
            "Examination Fee",
            "Other Assessment Charges"
        ]
    },

    {
        type: "Income",
        category: "Study Material Fees",
        subCategories: [
            "Books",
            "Worksheets",
            "Printed Materials",
            "Other Study Materials"
        ]
    },

    {
        type: "Income",
        category: "Workshop / Special Program Fees",
        subCategories: [
            "Workshop Fee",
            "Special Program Fee",
            "Event Fee"
        ]
    },

    {
        type: "Income",
        category: "Late Fee / Other Student Charges",
        subCategories: [
            "Late Payment Fee",
            "Other Student Charges"
        ]
    },

    {
        type: "Income",
        category: "Family Income",
        subCategories: [
            "Family Contribution",
            "Family Transfer",
            "Other Family Income"
        ]
    },

    {
        type: "Income",
        category: "Refund Reversal / Recovery",
        subCategories: [
            "Refund Recovery",
            "Previous Payment Recovery",
            "Other Recovery"
        ]
    },

    {
        type: "Income",
        category: "Other Income",
        subCategories: [
            "Miscellaneous Income",
            "Other"
        ]
    },


    // ======================================================
    // EXPENSE
    // ======================================================

    {
        type: "Expense",
        category: "Teacher Payments",
        subCategories: [
            "Teacher Fees",
            "Class / Session Payments",
            "Compensation Payments"
        ]
    },

    {
        type: "Expense",
        category: "Staff Salary",
        subCategories: [
            "Administrative Salary",
            "Support Staff Salary",
            "Other Staff Payments"
        ]
    },

    {
        type: "Expense",
        category: "Rent",
        subCategories: [
            "Office Rent",
            "Classroom Rent",
            "Other Rent"
        ]
    },

    {
        type: "Expense",
        category: "Electricity",
        subCategories: [
            "Electricity Bill",
            "Power Charges",
            "Other Electricity Expenses"
        ]
    },

    {
        type: "Expense",
        category: "Internet & Communication",
        subCategories: [
            "Internet",
            "Mobile / Telephone",
            "Communication Services"
        ]
    },

    {
        type: "Expense",
        category: "Software & Subscriptions",
        subCategories: [
            "Website / Hosting",
            "Online Meeting Services",
            "Software Subscription",
            "Other Digital Services"
        ]
    },

    {
        type: "Expense",
        category: "Marketing & Advertising",
        subCategories: [
            "Online Advertising",
            "Social Media Advertising",
            "Printing & Advertising",
            "Promotional Materials"
        ]
    },

    {
        type: "Expense",
        category: "Study Materials",
        subCategories: [
            "Books",
            "Printing",
            "Worksheets",
            "Educational Materials"
        ]
    },

    {
        type: "Expense",
        category: "Office Supplies",
        subCategories: [
            "Stationery",
            "Files & Registers",
            "Printing Supplies",
            "General Office Supplies"
        ]
    },

    {
        type: "Expense",
        category: "Equipment & Electronics",
        subCategories: [
            "Computer / Laptop",
            "Camera",
            "Microphone",
            "Other Electronics"
        ]
    },

    {
        type: "Expense",
        category: "Repairs & Maintenance",
        subCategories: [
            "Computer Repair",
            "Electrical Repair",
            "Furniture Repair",
            "General Maintenance"
        ]
    },

    {
        type: "Expense",
        category: "Travel & Transportation",
        subCategories: [
            "Academy Travel",
            "Transportation",
            "Fuel",
            "Other Travel Expenses"
        ]
    },

    {
        type: "Expense",
        category: "Bank & Payment Charges",
        subCategories: [
            "Bank Charges",
            "Payment Gateway Charges",
            "Transaction Charges"
        ]
    },

    {
        type: "Expense",
        category: "Professional & Legal Services",
        subCategories: [
            "Accountant / CA",
            "Legal Services",
            "Consultancy",
            "Professional Services"
        ]
    },

    {
        type: "Expense",
        category: "Taxes & Government Fees",
        subCategories: [
            "Government Fees",
            "Licence Fees",
            "Taxes",
            "Other Government Charges"
        ]
    },

    {
        type: "Expense",
        category: "Training & Development",
        subCategories: [
            "Teacher Training",
            "Staff Training",
            "Professional Development"
        ]
    },

    {
        type: "Expense",
        category: "Events & Activities",
        subCategories: [
            "Academy Events",
            "Student Activities",
            "Competitions",
            "Celebrations"
        ]
    },

    {
        type: "Expense",
        category: "Refunds",
        subCategories: [
            "Student Refund",
            "Course Refund",
            "Other Refund"
        ]
    },

    {
        type: "Expense",
        category: "Family Expense",
        subCategories: [
            "Household Expense",
            "Family Transfer",
            "Other Family Expense"
        ]
    },

    {
        type: "Expense",
        category: "Snacks",
        subCategories: [
            "Unhealthy",
            "Fruits",
            "Dry Fruit & Nuts"
        ]
    },

    {
        type: "Expense",
        category: "Miscellaneous Expense",
        subCategories: [
            "Miscellaneous",
            "Other"
        ]
    }

];


// ==========================================================
// SEED FUNCTION
// ==========================================================

async function seedFinanceCategories() {

    try {

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "MongoDB connected."
        );


        for (
            const item
            of financeCategories
        ) {

            await FinanceCategory.findOneAndUpdate(

                {
                    type: item.type,
                    category: item.category
                },

                {
                    $set: {
                        subCategories:
                            item.subCategories,

                        active: true
                    }
                },

                {
                    upsert: true,
                    new: true
                }

            );

            console.log(
                `${item.type} → ${item.category} ✓`
            );

        }


        console.log(
            "\nFinance categories seeded successfully."
        );


        await mongoose.disconnect();


        process.exit(0);


    } catch (error) {

        console.error(
            "\nFINANCE CATEGORY SEED ERROR:",
            error
        );


        await mongoose.disconnect();


        process.exit(1);

    }

}


seedFinanceCategories();