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

    const session = await TeacherSession.findOneAndUpdate(

        {
            periodId: new mongoose.Types.ObjectId(periodId)
        },

        {
            $push: {
    joinedStudents: {
        student: studentId,
        joinedAt: new Date()
    }
}
        },

        {
            new: true
        }

    );

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

            io.to(room).emit(

                "userDisconnected",

                socket.id

            );

            if(socket.role === "student" && periodId){

    const session = await TeacherSession.findOne({

        periodId: new mongoose.Types.ObjectId(periodId)

    });

    if(session){

        const joinedStudent = session.joinedStudents.find(

            s => String(s.student) === String(studentId)

        );

        if(joinedStudent){

            joinedStudent.leftAt = new Date();

            joinedStudent.duration = Math.floor(

                (joinedStudent.leftAt - joinedStudent.joinedAt) / 1000

            );

            await session.save();

            console.log("✅ Student Leave Saved");

        }

    }

}

            console.log(

                "Disconnected:",

                socket.id

            );

        });

    });

};