const AcademyCalendar = require("../models/AcademyCalendar");

/*
=========================================
ADD EVENT
=========================================
*/

exports.addEvent = async (req, res) => {

    try {

        const event = await AcademyCalendar.create(req.body);

        res.json({
            success: true,
            message: "Event added successfully.",
            data: event
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Unable to add event."
        });

    }

};

/*
=========================================
GET EVENTS
=========================================
*/

exports.getEvents = async (req, res) => {

    try {

        const events = await AcademyCalendar.find()
            .sort({ startDate: 1 });

        res.json({
            success: true,
            data: events
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Unable to load events."
        });

    }

};