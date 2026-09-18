const jwt = require("jsonwebtoken");

const User = require("../models/User");
const PeriodAssignment = require("../models/PeriodAssignment");
const Conversation = require("../models/Conversation");
const GPAMessage = require("../models/GPAMessage");
const admin = require("../firebaseAdmin");
const FCMToken = require("../models/FCMToken");


// =========================================================
// ROOM NAME
// =========================================================

function messengerRoom(conversationId) {
    return `gpa-messenger:${conversationId}`;
}

// =========================================================
// SEND FCM PUSH NOTIFICATION
// =========================================================

async function sendFCMNotification(
    receiverId,
    senderName,
    message,
    conversationId
) {

    try {

        const tokenRecords =
            await FCMToken.find({
                user: receiverId
            }).select("token");

        if (!tokenRecords.length) {
            console.log(
                "No FCM tokens found for receiver:",
                receiverId
            );
            return;
        }


        const tokens =
            tokenRecords.map(
                item => item.token
            );


        const notificationBody =
            message.length > 120
                ? message.substring(0, 117) + "..."
                : message;


        const response =
            await admin
                .messaging()
                .sendEachForMulticast({

                    tokens: tokens,

                    notification: {
                        title:
                            `${senderName} - GPA Messenger`,
                        body:
                            notificationBody
                    },

                    data: {
                        type:
                            "gpa_messenger",

                        conversationId:
                            String(conversationId),

                        url:
                            "https://www.gopespinnacle.com/gpa-messenger.html"
                    },

                    webpush: {
                        fcmOptions: {
                            link:
                                "https://www.gopespinnacle.com/gpa-messenger.html"
                        }
                    }

                });


        console.log(
            `FCM notification sent: ${response.successCount} successful, ${response.failureCount} failed`
        );


        // -----------------------------------------------------
        // REMOVE INVALID / EXPIRED TOKENS
        // -----------------------------------------------------

        const invalidTokens = [];


        response.responses.forEach(
            (result, index) => {

                if (!result.success) {

                    const errorCode =
                        result.error?.code;

                    if (
                        errorCode ===
                            "messaging/registration-token-not-registered" ||
                        errorCode ===
                            "messaging/invalid-registration-token"
                    ) {

                        invalidTokens.push(
                            tokens[index]
                        );

                    }

                }

            }
        );


        if (invalidTokens.length) {

            await FCMToken.deleteMany({
                token: {
                    $in: invalidTokens
                }
            });

            console.log(
                `Removed ${invalidTokens.length} invalid FCM token(s).`
            );

        }

    }
    catch (error) {

        console.error(
            "FCM NOTIFICATION ERROR:",
            error
        );

    }

}


// =========================================================
// CHECK TEACHER ↔ STUDENT MAPPING
// =========================================================

async function areTeacherAndStudentMapped(
    teacherId,
    studentId
) {

    const assignment =
        await PeriodAssignment.findOne({

            $or: [

                {
                    teacher: teacherId,

                    "assignments.student":
                        studentId
                },

                {
                    assistantTeacher: teacherId,

                    "assignments.student":
                        studentId
                }

            ]

        });

    return !!assignment;
}


// =========================================================
// CHECK CONVERSATION ACCESS
// =========================================================

async function canAccessConversation(
    user,
    conversation
) {

    if (!conversation) {
        return false;
    }


    // -------------------------------------------------------
    // FOUNDER
    // -------------------------------------------------------

    if (user.role === "founder") {
        return true;
    }


    // -------------------------------------------------------
    // PARTICIPANT CHECK
    // -------------------------------------------------------

    const isParticipant =
        conversation.participants.some(
            participant =>
                String(participant) ===
                String(user._id)
        );


    if (!isParticipant) {
        return false;
    }


    // -------------------------------------------------------
    // FIND OTHER PARTICIPANT
    // -------------------------------------------------------

    const otherParticipantId =
        conversation.participants.find(
            participant =>
                String(participant) !==
                String(user._id)
        );


    if (!otherParticipantId) {
        return false;
    }


    const otherUser =
        await User.findById(
            otherParticipantId
        );


    if (!otherUser) {
        return false;
    }


    // -------------------------------------------------------
    // TEACHER
    // -------------------------------------------------------

    if (user.role === "teacher") {

        if (otherUser.role !== "student") {
            return false;
        }

        return await areTeacherAndStudentMapped(
            user._id,
            otherUser._id
        );
    }


    // -------------------------------------------------------
    // STUDENT
    // -------------------------------------------------------

    if (user.role === "student") {

        if (otherUser.role !== "teacher") {
            return false;
        }

        return await areTeacherAndStudentMapped(
            otherUser._id,
            user._id
        );
    }


    return false;
}


// =========================================================
// REGISTER GPA MESSENGER SOCKET
// =========================================================

function registerMessengerSocket(io) {

    const messenger =
        io.of("/messenger");

    messenger.on("connection", async (socket) => {

        // =================================================
        // SOCKET AUTHENTICATION
        // =================================================

        try {

            const token =
                socket.handshake.auth?.token;


            if (!token) {

                socket.emit(
                    "messengerError",
                    {
                        message:
                            "Messenger authentication required."
                    }
                );

                socket.disconnect(true);

                return;
            }


            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );


            const user =
                await User.findById(
                    decoded.id
                )
                .select(
                    "_id name email role studentId teacherId"
                );


            if (!user) {

                socket.emit(
                    "messengerError",
                    {
                        message:
                            "User not found."
                    }
                );

                socket.disconnect(true);

                return;
            }


            // Save authenticated user on socket
            socket.gpaUser = user;


            // =================================================
            // PERSONAL USER ROOM
            // =================================================

            const userRoom =
                `gpa-user:${user._id}`;

            socket.join(userRoom);


            // Tell frontend authentication succeeded
            socket.emit(
                "messengerAuthenticated",
                {
                    success: true,

                    user: {
                        _id: user._id,
                        name: user.name,
                        role: user.role
                    }
                }
            );


            console.log(
                `GPA Messenger connected: ${user.name} (${user.role})`
            );


        }
        catch (error) {

            console.error(
                "GPA MESSENGER SOCKET AUTH ERROR:",
                error
            );

            socket.emit(
                "messengerError",
                {
                    message:
                        "Invalid or expired Messenger token."
                }
            );

            socket.disconnect(true);

            return;
        }


        // =================================================
        // JOIN CONVERSATION
        // =================================================

        socket.on(
            "joinMessengerConversation",
            async (conversationId) => {

                try {

                    if (!conversationId) {
                        return;
                    }


                    const conversation =
                        await Conversation.findById(
                            conversationId
                        );


                    if (!conversation) {

                        socket.emit(
                            "messengerError",
                            {
                                message:
                                    "Conversation not found."
                            }
                        );

                        return;
                    }


                    const allowed =
                        await canAccessConversation(
                            socket.gpaUser,
                            conversation
                        );


                    if (!allowed) {

                        socket.emit(
                            "messengerError",
                            {
                                message:
                                    "You are not allowed to access this conversation."
                            }
                        );

                        return;
                    }


                    socket.join(
                        messengerRoom(
                            conversationId
                        )
                    );


                    socket.emit(
                        "messengerConversationJoined",
                        {
                            conversationId
                        }
                    );


                }
                catch (error) {

                    console.error(
                        "JOIN MESSENGER CONVERSATION ERROR:",
                        error
                    );

                    socket.emit(
                        "messengerError",
                        {
                            message:
                                "Unable to join conversation."
                        }
                    );

                }

            }
        );


        // =================================================
        // LEAVE CONVERSATION
        // =================================================

        socket.on(
            "leaveMessengerConversation",
            (conversationId) => {

                if (!conversationId) {
                    return;
                }

                socket.leave(
                    messengerRoom(
                        conversationId
                    )
                );

            }
        );


        // =================================================
        // SEND TEXT MESSAGE
        // =================================================

        socket.on(
            "sendMessengerMessage",
            async (data) => {

                try {

                    const {
                        conversationId,
                        message
                    } = data || {};


                    // -----------------------------------------
                    // BASIC VALIDATION
                    // -----------------------------------------

                    if (
                        !conversationId ||
                        typeof message !== "string" ||
                        !message.trim()
                    ) {

                        socket.emit(
                            "messengerError",
                            {
                                message:
                                    "Message cannot be empty."
                            }
                        );

                        return;
                    }


                    const conversation =
                        await Conversation.findById(
                            conversationId
                        );


                    if (!conversation) {

                        socket.emit(
                            "messengerError",
                            {
                                message:
                                    "Conversation not found."
                            }
                        );

                        return;
                    }


                    // -----------------------------------------
                    // ACCESS CHECK
                    // -----------------------------------------

                    const allowed =
                        await canAccessConversation(
                            socket.gpaUser,
                            conversation
                        );


                    if (!allowed) {

                        socket.emit(
                            "messengerError",
                            {
                                message:
                                    "You are not allowed to send messages in this conversation."
                            }
                        );

                        return;
                    }


                    const sender =
                        socket.gpaUser;


                    // -----------------------------------------
                    // DETERMINE RECEIVER
                    // -----------------------------------------

                    let receiverId;


                    if (
                        sender.role ===
                        "founder"
                    ) {

                        // Founder conversation contains
                        // teacher + student.
                        //
                        // For now, founder sends to the
                        // participant selected by frontend.
                        receiverId =
                            data.receiverId;

                    }
                    else {

                        receiverId =
                            conversation.participants.find(
                                participant =>
                                    String(
                                        participant
                                    ) !==
                                    String(
                                        sender._id
                                    )
                            );

                    }


                    if (!receiverId) {

                        socket.emit(
                            "messengerError",
                            {
                                message:
                                    "Receiver could not be determined."
                            }
                        );

                        return;
                    }


                    const receiver =
                        await User.findById(
                            receiverId
                        )
                        .select(
                            "_id name email role studentId teacherId"
                        );


                    if (!receiver) {

                        socket.emit(
                            "messengerError",
                            {
                                message:
                                    "Receiver not found."
                            }
                        );

                        return;
                    }


                    // -----------------------------------------
                    // TEACHER SECURITY
                    // -----------------------------------------

                    if (
                        sender.role ===
                        "teacher"
                    ) {

                        if (
                            receiver.role !==
                            "student"
                        ) {

                            socket.emit(
                                "messengerError",
                                {
                                    message:
                                        "Teachers can only message students."
                                }
                            );

                            return;
                        }


                        const mapped =
                            await areTeacherAndStudentMapped(
                                sender._id,
                                receiver._id
                            );


                        if (!mapped) {

                            socket.emit(
                                "messengerError",
                                {
                                    message:
                                        "This student is not mapped to you."
                                }
                            );

                            return;
                        }

                    }


                    // -----------------------------------------
                    // STUDENT SECURITY
                    // -----------------------------------------

                    if (
                        sender.role ===
                        "student"
                    ) {

                        if (
                            receiver.role !==
                            "teacher"
                        ) {

                            socket.emit(
                                "messengerError",
                                {
                                    message:
                                        "Students can only message teachers."
                                }
                            );

                            return;
                        }


                        const mapped =
                            await areTeacherAndStudentMapped(
                                receiver._id,
                                sender._id
                            );


                        if (!mapped) {

                            socket.emit(
                                "messengerError",
                                {
                                    message:
                                        "This teacher is not mapped to you."
                                }
                            );

                            return;
                        }

                    }


                    // -----------------------------------------
                    // CREATE MESSAGE
                    // -----------------------------------------

                    const newMessage =
                        await GPAMessage.create({

                            conversation:
                                conversation._id,

                            sender:
                                sender._id,

                            receiver:
                                receiver._id,

                            message:
                                message.trim(),

                            messageType:
                                "text",

                            isRead:
                                false

                        });


                    // -----------------------------------------
                    // UPDATE CONVERSATION
                    // -----------------------------------------

                    conversation.lastMessage =
                        message.trim();

                    conversation.lastMessageAt =
                        new Date();

                    conversation.lastMessageSender =
                        sender._id;


                    let unreadEntry =
                        conversation.unreadCounts?.find(
                            item =>
                                String(
                                    item.user
                                ) ===
                                String(
                                    receiver._id
                                )
                        );


                    if (unreadEntry) {

                        unreadEntry.count += 1;

                    }
                    else {

                        conversation.unreadCounts.push({

                            user:
                                receiver._id,

                            count:
                                1

                        });

                    }


                    await conversation.save();


                    // -----------------------------------------
                    // POPULATE MESSAGE
                    // -----------------------------------------

                    const populatedMessage =
                        await GPAMessage.findById(
                            newMessage._id
                        )
                        .populate(
                            "sender",
                            "_id name role"
                        )
                        .populate(
                            "receiver",
                            "_id name role"
                        );


                    // -----------------------------------------
// SEND TO CONVERSATION
// -----------------------------------------

messenger.to(
    messengerRoom(
        conversationId
    )
).emit(
    "newMessengerMessage",
    populatedMessage
);


                    // -----------------------------------------
// ALSO SEND TO RECEIVER'S PERSONAL ROOM
// -----------------------------------------

messenger.to(
    `gpa-user:${receiver._id}`
).emit(
    "messengerNewMessageNotification",
    {
        conversationId,
        message:
            populatedMessage
    }
);

// -----------------------------------------
// SEND FIREBASE PUSH NOTIFICATION
// -----------------------------------------

await sendFCMNotification(
    receiver._id,
    sender.name,
    message.trim(),
    conversationId
);


                }
                catch (error) {

                    console.error(
                        "SEND MESSENGER MESSAGE ERROR:",
                        error
                    );

                    socket.emit(
                        "messengerError",
                        {
                            message:
                                "Unable to send message."
                        }
                    );

                }

            }
        );


        // =================================================
        // MARK CONVERSATION AS READ
        // =================================================

        socket.on(
            "markMessengerConversationRead",
            async (conversationId) => {

                try {

                    if (!conversationId) {
                        return;
                    }


                    const conversation =
                        await Conversation.findById(
                            conversationId
                        );


                    if (!conversation) {
                        return;
                    }


                    const allowed =
                        await canAccessConversation(
                            socket.gpaUser,
                            conversation
                        );


                    if (!allowed) {
                        return;
                    }


                    await GPAMessage.updateMany(

                        {

                            conversation:
                                conversationId,

                            receiver:
                                socket.gpaUser._id,

                            isRead:
                                false

                        },

                        {

                            $set: {

                                isRead:
                                    true,

                                readAt:
                                    new Date()

                            }

                        }

                    );


                    const unreadEntry =
                        conversation.unreadCounts?.find(
                            item =>
                                String(
                                    item.user
                                ) ===
                                String(
                                    socket.gpaUser._id
                                )
                        );


                    if (unreadEntry) {

                        unreadEntry.count =
                            0;

                        await conversation.save();

                    }


                    // Tell conversation participants
messenger.to(
    messengerRoom(
        conversationId
    )
).emit(
    "messengerConversationRead",
    {
        conversationId,
        userId:
            socket.gpaUser._id
    }
);


                }
                catch (error) {

                    console.error(
                        "MARK MESSENGER READ ERROR:",
                        error
                    );

                }

            }
        );


        // =================================================
        // TYPING START
        // =================================================

        socket.on(
            "messengerTyping",
            async (data) => {

                try {

                    const {
                        conversationId,
                        isTyping
                    } = data || {};


                    if (!conversationId) {
                        return;
                    }


                    const conversation =
                        await Conversation.findById(
                            conversationId
                        );


                    if (!conversation) {
                        return;
                    }


                    const allowed =
                        await canAccessConversation(
                            socket.gpaUser,
                            conversation
                        );


                    if (!allowed) {
                        return;
                    }


                    socket.to(
                        messengerRoom(
                            conversationId
                        )
                    ).emit(
                        "messengerTyping",
                        {
                            conversationId,
                            userId:
                                socket.gpaUser._id,
                            userName:
                                socket.gpaUser.name,
                            isTyping:
                                !!isTyping
                        }
                    );


                }
                catch (error) {

                    console.error(
                        "MESSENGER TYPING ERROR:",
                        error
                    );

                }

            }
        );


        // =================================================
        // DISCONNECT
        // =================================================

        socket.on(
            "disconnect",
            () => {

                if (socket.gpaUser) {

                    console.log(
                        `GPA Messenger disconnected: ${socket.gpaUser.name}`
                    );

                }

            }
        );

    });

}


module.exports =
    registerMessengerSocket;