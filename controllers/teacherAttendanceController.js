exports.markTeacherAttendance = async (data) => {

const StudentCompensation = require("../models/StudentCompensation");
const TeacherAttendance = require("../models/TeacherAttendance");
const Attendance = require("../models/Attendance");

const {
teacherId,
teacherName,
className,
subject,
day,
startTime,
date,
joinTime,
status: incomingStatus
} = data;

// ✅ handle null join
const join = joinTime ? new Date(joinTime) : null;

// class start
const [hour, minute] = startTime.split(":");

const classStart = new Date();
classStart.setHours(hour, minute, 0);

// class end (1 hour)
const classEnd = new Date(classStart.getTime() + 60 * 60000);

// ✅ default status
let status = incomingStatus || "Present";

let lateMinutes = 0;
let compensationMinutes = 0;

const graceTime = new Date(classStart.getTime() + 5 * 60000);

// ✅ ABSENT
if(!join){
status = "Absent";
}

// ✅ LATE
// ✅ LATE
else if(join > graceTime){

status = "Late";

lateMinutes = Math.floor((join - classStart) / 60000);
compensationMinutes += lateMinutes;

// ✅ SAVE / UPDATE COMPENSATION CLASS
const CompensationClass = require("../models/CompensationClass");

// 🔥 CHECK if already exists for today
let record = await CompensationClass.findOne({
    teacher: teacherId,
    className,
    subject,
    date: {
        $gte: new Date(new Date().setHours(0,0,0,0)),
        $lte: new Date(new Date().setHours(23,59,59,999))
    }
});

// 🔥 IF NOT EXISTS → CREATE
if(!record){
    record = new CompensationClass({
        teacher: teacherId,
        className,
        subject,
        date: new Date(),
        totalMinutes: lateMinutes,
        usedMinutes: 0,
        studentNames: studentNames   // ✅ ADD THIS
    });
}
// 🔥 IF EXISTS → UPDATE
else{
    record.totalMinutes += lateMinutes;
    record.studentNames = studentNames;
}

await record.save();


// 🔥 OPTIONAL (can remove later)
const students = await Attendance.find({
    className,
    subject,
    status: "Present"
}).populate("studentId");
const studentNames = students
    .filter(s => s.studentId)
    .map(s => s.studentId.name);
for(const s of students){

    if(!s.studentId) continue;

    let record = await StudentCompensation.findOne({
        teacher: teacherId,
        student: s.studentId._id,
        className,
        subject
    });

    if(!record){
        record = new StudentCompensation({
            teacher: teacherId,
            student: s.studentId._id,
            className,
            subject,
            totalMinutes: lateMinutes
        });
    }else{
        record.totalMinutes += lateMinutes;
    }

    await record.save();
}

}

// ✅ ON TIME
else{
status = "Present";
}

// ✅ CHECK DUPLICATE
const existing = await TeacherAttendance.findOne({
    teacher: teacherId,
    className,
    day,
    startTime,
    date: {
        $gte: new Date(new Date().setHours(0,0,0,0)),
        $lte: new Date(new Date().setHours(23,59,59,999))
    }
});

if(existing){
    return { message: "Already marked ✅" };
}

// ✅ SAVE
const attendance = new TeacherAttendance({
teacher: teacherId,
teacherName,
className,
subject,
day,
startTime,
date,
joinTime,
status,
lateMinutes,
compensationMinutes
});

await attendance.save();

return { message: "Attendance saved ✅" };

};