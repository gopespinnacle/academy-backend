const Attendance = require("../models/Attendance");

setInterval(async () => {

    const now = new Date();

    const ongoing = await Attendance.find({ status: "ongoing" });

    for(const a of ongoing){

        const [eh, em] = a.endTime.split(":");

        const end = new Date();
        end.setHours(eh, em, 0);

        // 🔥 ADD 5 MIN BUFFER
        end.setMinutes(end.getMinutes() + 5);

        if(now >= end){

            await Attendance.findByIdAndUpdate(a._id, {
                exitAt: end,
                status: "completed"
            });

            console.log("Auto exited:", a._id);
        }
    }

}, 60000); // runs every 1 min