const express = require("express");

const router = express.Router();

const {

    addEvent,

    getEvents,

    updateEvent,

    deleteEvent

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

/*
=========================================
UPDATE EVENT
=========================================
*/

router.put(
    "/:id",
    updateEvent
);

/*
=========================================
DELETE EVENT
=========================================
*/

router.delete(
    "/:id",
    deleteEvent
);
module.exports = router;