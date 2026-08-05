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

            const alreadyExists =
meetingMemory.participants[room].find(

    p =>

        p.role === role &&

        p.name === name

);

const oldSocketId = alreadyExists ? alreadyExists.socketId : null;

if(!alreadyExists){

    meetingMemory.participants[room].push({

        socketId: socket.id,

        role,

        name,

        joinedAt: new Date(),

        status: "Online",

        camera: true,

        mic: true,

        network: "Checking",

        battery: -1,

        charging: false,

        micLocked: false,

        cameraLocked: false

    });

}else{

    alreadyExists.socketId = socket.id;

    alreadyExists.status = "Online";

    io.to(room).emit("studentSocketChanged",{

        oldSocketId: oldSocketId,

        newSocketId: socket.id,

        role: role,

        name: name

    });

}

io.to(room).emit("studentStatusChanged",{

    socketId: socket.id,

    status: "Online"

});

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

    const students =
meetingMemory.participants[room]
.filter(p => p.role === "student")
.map(student => ({

    socketId: student.socketId,

    name: student.name,

    joinedAt: student.joinedAt,

    camera: student.camera ?? true,

    mic: student.mic ?? true,

    network: student.network || "Checking",

    battery: student.battery ?? -1,

    charging: student.charging ?? false,

    device: student.device || "Unknown",

    visibility: student.visibility || "Active",

    micLocked: student.micLocked ?? false,

    cameraLocked: student.cameraLocked ?? false

}));

    socket.emit("existingStudents", students);

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

    if (teacher) {

    io.to(teacher.socketId).emit("studentJoined", {

        socketId: socket.id,

        studentName: name,

        reconnect: alreadyExists ? true : false

    });

    
}

}

        });

        /*
        ==================================================
        OFFER
        ==================================================
        */

        socket.on("offer",(data)=>{

            console.log(
        "SERVER RECEIVED OFFER",
        socket.id,
        "->",
        data.targetSocketId
    );

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
START SCREEN PEER
==================================================
*/

socket.on("startScreenPeer", (data) => {

    io.to(data.targetSocketId).emit("startScreenPeer", {

        teacherSocketId: socket.id

    });

});

/*
==================================================
SCREEN OFFER
==================================================
*/

socket.on("screen-offer", (data) => {

    io.to(data.targetSocketId).emit("screen-offer", {

        teacherSocketId: socket.id,

        offer: data.offer

    });

});

/*
==================================================
SCREEN ANSWER
==================================================
*/

socket.on("screen-answer", (data) => {

    io.to(data.teacherSocketId).emit("screen-answer", {

        studentSocketId: socket.id,

        answer: data.answer

    });

});

/*
==================================================
SCREEN ICE
==================================================
*/

socket.on("screen-ice-candidate", (data) => {

    io.to(data.targetSocketId).emit("screen-ice-candidate", {

        senderSocketId: socket.id,

        candidate: data.candidate

    });

});

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

    // ✅ Update meeting memory
    const participant = meetingMemory.participants[room]?.find(

        p => p.socketId === socket.id

    );

    if(participant){

        participant.camera = data.camera;

        participant.mic = data.mic;

    }

    socket.to(room).emit("mediaStatus", {

        socketId: socket.id,

        camera: data.camera,

        mic: data.mic

    });

});

socket.on("networkStatus",(data)=>{

    const room = socket.room;

    if(!room) return;

    const participant = meetingMemory.participants[room]?.find(

        p => p.socketId === socket.id

    );

    if(participant){

        participant.network = data.quality;

    }

    socket.to(room).emit("networkStatus",{

        socketId: socket.id,

        quality: data.quality

    });

});

socket.on("studentReconnecting", () => {

    if (!socket.room) return;

    socket.to(socket.room).emit("studentReconnecting", {

        socketId: socket.id

    });

});

socket.on("studentReconnected", () => {

    console.log("Student Reconnected");

    console.log("Current Socket:", socket.id);

    if (!socket.room) return;

    socket.to(socket.room).emit("studentReconnected", {

        socketId: socket.id

    });

});

socket.on("batteryStatus",(data)=>{

    const room = socket.room;

    if(!room) return;

    const participant = meetingMemory.participants[room]?.find(

        p => p.socketId === socket.id

    );

    if(participant){

        participant.battery = data.level;

        participant.charging = data.charging;

    }

    socket.to(room).emit("batteryStatus",{

        socketId: socket.id,

        level: data.level,

        charging: data.charging

    });

});

socket.on("deviceInfo",(data)=>{

    const room = socket.room;

    if(!room) return;

    const participant = meetingMemory.participants[room]?.find(

        p => p.socketId === socket.id

    );

    if(participant){

        participant.device = data.device;

    }

    socket.to(room).emit("deviceInfo",{

        socketId: socket.id,

        device: data.device

    });

});

socket.on("visibilityStatus",(data)=>{

    const room = socket.room;

    if(!room) return;

    const participant = meetingMemory.participants[room]?.find(

        p => p.socketId === socket.id

    );

    if(participant){

        participant.visibility = data.visibility;

    }

    socket.to(room).emit("visibilityStatus",{

        socketId: socket.id,

        visibility: data.visibility

    });

});
socket.on("muteStudent", (data) => {

    const room = socket.room;

    if(!room) return;

    const student = meetingMemory.participants[room]?.find(

        p => p.socketId === data.socketId

    );

    if(!student) return;

    student.micMuted = !student.micMuted;

    io.to(data.socketId).emit("forceMute",{

        muted: student.micMuted

    });

    io.to(room).emit("studentControlUpdated",{

        socketId: student.socketId,

        micMuted: student.micMuted

    });

});

socket.on("lockMic", (data) => {

    const room = socket.room;

    if (!room) return;

    const participant = meetingMemory.participants[room]?.find(

        p => p.socketId === data.socketId

    );

    if (!participant) return;

    participant.micLocked = !participant.micLocked;

    io.to(data.socketId).emit("forceMute", {

        muted: participant.micLocked

    });

    io.to(room).emit("studentControlUpdated", {

        socketId: data.socketId,

        micLocked: participant.micLocked,

        micMuted: participant.micLocked

    });

});

socket.on("lockCamera", (data) => {

    const room = socket.room;

    if (!room) return;

    const participant = meetingMemory.participants[room]?.find(

        p => p.socketId === data.socketId

    );

    if (!participant) return;

    participant.cameraLocked = !participant.cameraLocked;

    io.to(data.socketId).emit("forceStopCamera", {

        stopped: participant.cameraLocked

    });

    io.to(room).emit("studentControlUpdated", {

        socketId: data.socketId,

        cameraLocked: participant.cameraLocked,

        cameraStopped: participant.cameraLocked

    });

});

socket.on("stopCamera", (data) => {

    const room = socket.room;

    if(!room) return;

    const student = meetingMemory.participants[room]?.find(

        p => p.socketId === data.socketId

    );

    if(!student) return;

    student.cameraStopped = !student.cameraStopped;

    io.to(data.socketId).emit("forceStopCamera",{

        stopped: student.cameraStopped

    });

    io.to(room).emit("studentControlUpdated",{

        socketId: student.socketId,

        cameraStopped: student.cameraStopped

    });

});

socket.on("removeStudent", (data) => {

    io.to(data.socketId).emit("removedFromClass");

    io.to(socket.room).emit("userDisconnected", data.socketId);

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

            if(socket.role === "student"){

    setTimeout(()=>{

        const participant =
        meetingMemory.participants[room]?.find(

            p => p.socketId === socket.id

        );

        // Student rejoined within 15 seconds
        if(
            participant &&
            participant.socketId !== socket.id
        ){
            return;
        }

        // Student really left
        if(meetingMemory.participants[room]){

            meetingMemory.participants[room] =
            meetingMemory.participants[room].filter(

                p => p.socketId !== socket.id

            );

        }

        io.to(room).emit("userDisconnected", socket.id);

    },15000);

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

    "studentReconnecting",

    {

        socketId: socket.id

    }

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



