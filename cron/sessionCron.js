const cron = require("node-cron");
const TeacherSchedule = require("../models/TeacherSchedule");
const TeacherSession = require("../models/TeacherSession");

cron.schedule("0 0 * * *", async () => {

console.log("Running daily session generator...");

const today = new Date();

const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const todayName = days[today.getDay()];

const start = new Date();
start.setHours(0,0,0,0);

const end = new Date();
end.setHours(23,59,59,999);

const schedules = await TeacherSchedule.find({ day: todayName });

for(const s of schedules){

const exists = await TeacherSession.findOne({
  teacher: s.teacher,
  schedule: s._id,
  date: { $gte: start, $lte: end }
});

if(!exists){

const meetingLink =
"https://meet.jit.si/gopes-" +
s.className + "-" +
today.toISOString().split("T")[0];

await TeacherSession.create({
  teacher: s.teacher,
  schedule: s._id,
  className: s.className,
  subject: s.subject,
  date: today,
  startTime: s.startTime,
  endTime: s.endTime,
  meetingLink
});

}

}

console.log("Daily sessions created");

});