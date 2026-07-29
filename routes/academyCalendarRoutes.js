const express = require("express");

const router = express.Router();

const {

    addEvent,

    getEvents

} = require("../controllers/academyCalendarController");

/*
=========================================
ADD EVENT
=========================================
*/

router.post(
    "/add",
    addEvent
);

/*
=========================================
GET EVENTS
=========================================
*/

router.get(
    "/list",
    getEvents
);

module.exports = router;