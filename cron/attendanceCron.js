const PeriodAssignment = require("../models/PeriodAssignment");
const Attendance = require("../models/Attendance");
const TeacherSession = require("../models/TeacherSession");

setInterval(async ()=>{

try{

const now = new Date();

const startOfDay = new Date();
startOfDay.setHours(0,0,0,0);

const endOfDay = new Date();
endOfDay.setHours(23,59,59,999);

const sessions = await TeacherSession.find({
  date: { $gte: startOfDay, $lte: endOfDay }
});

const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

for(const s of sessions){

const [eh, em] = s.endTime.split(":");

const end = new Date(s.date);
end.setHours(eh, em, 0);

if(now > end){

const students = await PeriodAssignment.find({
  className: s.className,
  day: days[s.date.getDay()],
  startTime: s.startTime
}).distinct("student");

for(const studentId of students){

const existing = await Attendance.findOne({
  studentId,
  sessionId: s._id
});

if(existing) continue;

await Attendance.create({
  studentId,
  sessionId: s._id,
  className: s.className,
  subject: s.subject,
  status: "Absent"
});

}

}

}

}catch(err){
console.log("Auto absent error", err);
}

},300000);