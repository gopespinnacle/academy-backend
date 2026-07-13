const meetingMemory = require("../core/meetingMemory");
const TeacherSession = require("../models/TeacherSession");
const mongoose = require("mongoose");

/*
==========================================================
Meeting Socket
Handles:
1. Join Room
2. WebRTC Signaling
==========================================================
*/

module.exports = function registerMeetingSocket(io){

    io.on("connection",(socket)=>{

        console.log("Socket Connected:",socket.id);

        /*
        ==================================================
        JOIN ROOM
        ==================================================
        */

        socket.on("joinRoom", async (data)=>{

    const room = data.room;
const role = data.role;
const name = data.name;
const studentId = data.studentId;
const periodId = data.periodId;

console.log("========== JOIN ROOM ==========");
console.log("Role:", role);
console.log("Student ID:", studentId);
console.log("Period ID:", periodId);
console.log("================================");



            socket.join(room);

            socket.room=room;
            socket.role=role;
            socket.name=name;

            socket.studentId = studentId;
socket.periodId = periodId;

            if(!meetingMemory.participants[room]){
                meetingMemory.participants[room]=[];
            }

            const alreadyExists=
            meetingMemory.participants[room].find(
                p=>p.socketId===socket.id
            );

            if(!alreadyExists){

                meetingMemory.participants[room].push({

                    socketId:socket.id,

                    role,

                    name

                });

            }

            console.log(

                "Joined Room:",

                room,

                role,

                name

            );

            /*
            Teacher receives existing students
            */

            if(role==="teacher"){

                const students=
                meetingMemory.participants[room].filter(

                    p=>p.role==="student"

                );

                socket.emit(

                    "existingStudents",

                    students

                );

            }

            /*
            Notify teacher
            */

            else{

    if (periodId && mongoose.Types.ObjectId.isValid(periodId)) {

    console.log("Searching with:");
    console.log({
        periodId,
        studentId
    });

    const session = await TeacherSession.findOne({

    periodId: new mongoose.Types.ObjectId(periodId)

});

if(session){

    const existingStudent = session.joinedStudents.find(

        s => s.student.toString() === studentId

    );

    if(existingStudent){

    const now = new Date();

    if(existingStudent.leftAt){

        const disconnectedSeconds = Math.floor(

            (now - existingStudent.leftAt) / 1000

        );

        existingStudent.networkDisconnectTime += disconnectedSeconds;

    }

    existingStudent.rejoinedCount += 1;

    existingStudent.isOnline = true;

    existingStudent.joinedAt = now;

    existingStudent.leftAt = null;

}

    else{

        // First time joining

        session.joinedStudents.push({

            student:studentId,

            joinedAt:new Date(),

            isOnline:true

        });

    }

    await session.save();

    console.log("Student Attendance Updated");

}

    if (!session) {

        console.log("❌ NO SESSION FOUND");

    } else {

        console.log("✅ SESSION FOUND");
        console.log("Session:", session._id);
        console.log("Joined Students:", session.joinedStudents);
        const check = await TeacherSession.findById(session._id);

console.log("Saved in Mongo:");
console.log(check.joinedStudents);

    }

}

    const teacher =
    meetingMemory.participants[room].find(

        p=>p.role==="teacher"

    );

    if(teacher){

        io.to(
            teacher.socketId
        ).emit(

            "studentJoined",

            {

                socketId:socket.id,

                studentName:name

            }

        );

    }

}

        });

        /*
        ==================================================
        OFFER
        ==================================================
        */

        socket.on("offer",(data)=>{

            io.to(

                data.targetSocketId

            ).emit(

                "offer",

                {

                    teacherSocketId:socket.id,

                    offer:data.offer

                }

            );

        });

        /*
        ==================================================
        ANSWER
        ==================================================
        */

        socket.on("answer",(data)=>{

            io.to(

                data.teacherSocketId

            ).emit(

                "answer",

                {

                    studentSocketId:socket.id,

                    answer:data.answer

                }

            );

        });

        /*
        ==================================================
        ICE
        ==================================================
        */

        socket.on(

            "ice-candidate",

            (data)=>{

                io.to(

                    data.targetSocketId

                ).emit(

                    "ice-candidate",

                    {

                        senderSocketId:socket.id,

                        candidate:data.candidate

                    }

                );

            }

        );

        /*
==================================================
MEDIA STATUS
==================================================
*/

socket.on("mediaStatus", (data) => {

    socket.camera = data.camera;

    socket.mic = data.mic;

    const room = socket.room;

    if (!room) return;

    socket.to(room).emit("mediaStatus", {

        socketId: socket.id,

        camera: data.camera,

        mic: data.mic

    });

});

socket.on("muteStudent", (data) => {

    io.to(data.socketId).emit("forceMute");

});

socket.on("stopCamera", (data) => {

    io.to(data.socketId).emit("forceStopCamera");

});


        /*
        ==================================================
        DISCONNECT
        ==================================================
        */

        socket.on("disconnect", async ()=>{

            const studentId = socket.studentId;
const periodId = socket.periodId;

const room = socket.room;

            if(!room) return;

            if(meetingMemory.participants[room]){

                meetingMemory.participants[room]=

                meetingMemory.participants[room].filter(

                    p=>p.socketId!==socket.id

                );

            }

            if(socket.role === "student" && socket.studentId){

    const session = await TeacherSession.findOne({

        periodId: new mongoose.Types.ObjectId(socket.periodId)

    });

    if(session){

        const student = session.joinedStudents.find(

            s => s.student.toString() === socket.studentId

        );

        if(student){

            student.leftAt = new Date();

            student.isOnline = false;

            const currentSessionSeconds = Math.floor(

    (student.leftAt - student.joinedAt) / 1000

);

student.duration += currentSessionSeconds;

            await session.save();

            console.log("Student disconnected");

        }

    }

}

            io.to(room).emit(

                "userDisconnected",

                socket.id

            );

            if(socket.role === "teacher" && periodId){

    const session = await TeacherSession.findOne({

        periodId:new mongoose.Types.ObjectId(periodId)

    });

    if(session){

        session.teacherLeft = new Date();

        session.classEnded = new Date();

        session.teacherDuration = Math.floor(

            (session.teacherLeft - session.teacherJoined)/1000

        );

        session.actualClassDuration = session.teacherDuration;

        await session.save();

        console.log("✅ Teacher Session Closed");

    }

}

            
            console.log(

                "Disconnected:",

                socket.id

            );

        });

    });

};

