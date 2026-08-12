const mongoose = require("mongoose");
require("dotenv").config();

const IncomeExpense = require("./models/IncomeExpense");


async function deleteFinanceTest() {

    try {

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log("MongoDB connected.");


        const result =
            await IncomeExpense.deleteMany({

                description:
                    "Test - Gurpranow August Fee"

            });


        console.log(
            "Test finance transaction deleted:",
            result.deletedCount
        );


        await mongoose.disconnect();

        process.exit(0);


    } catch (error) {

        console.error(
            "DELETE FINANCE TEST ERROR:",
            error
        );


        await mongoose.disconnect();

        process.exit(1);

    }

}


deleteFinanceTest();