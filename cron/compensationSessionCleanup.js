
const cron = require("node-cron");
const TeacherSession = require("../models/TeacherSession");
const DailyClassRegister = require("../models/DailyClassRegister");

// Run every hour
cron.schedule("0 * * * *", async () => {
    try {
        console.log("Checking expired compensation sessions...");

        const sessions = await TeacherSession.find({
            sessionType: "Compensation"
        });

        const now = new Date();

        for (const session of sessions) {

            if (!session.date || !session.endTime) continue;

            const [hours, minutes] = session.endTime.split(":").map(Number);

            if (
                !Number.isInteger(hours) ||
                !Number.isInteger(minutes) ||
                hours < 0 || hours > 23 ||
                minutes < 0 || minutes > 59
            ) continue;

            const sessionEnd = new Date(session.date);
            sessionEnd.setHours(hours, minutes, 0, 0);

            const expiryTime = new Date(
                sessionEnd.getTime() + 24 * 60 * 60 * 1000
            );

            // Do not delete before 24 hours after the scheduled end
            if (now < expiryTime) continue;

            // Preserve the register history
            const register = await DailyClassRegister.findOne({
                compensationSession: session._id
            }).select("_id").lean();

            // Keep the session if the teacher has not submitted the register
            if (!register) continue;

            await TeacherSession.deleteOne({
                _id: session._id,
                sessionType: "Compensation"
            });

            console.log(
                `Deleted expired compensation session: ${session._id}`
            );
        }

        console.log("Compensation session cleanup completed.");

    } catch (error) {
        console.error("Compensation session cleanup error:", error);
    }
});
