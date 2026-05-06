require("dotenv").config();

const axios = require("axios");

async function makeTestCall() {

    try {

        const url =
            `https://${process.env.EXOTEL_API_KEY}:${process.env.EXOTEL_API_TOKEN}` +
            `@api.exotel.com/v1/Accounts/${process.env.EXOTEL_SID}/Calls/connect.json`;

        const data = new URLSearchParams({

            From: "919999999999", // your verified number
            To: "919566911472",   // your mobile number
            CallerId: "919999999999",
            TimeLimit: "30",
            CallType: "trans"

        });

        const response = await axios.post(url, data);

        console.log("CALL SUCCESS");
        console.log(response.data);

    } catch (err) {

        console.log("CALL FAILED");

        if(err.response){
            console.log(err.response.data);
        } else {
            console.log(err.message);
        }
    }
}

makeTestCall();