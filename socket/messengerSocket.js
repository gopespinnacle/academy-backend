const jwt = require("jsonwebtoken");

const User = require("../models/User");
const PeriodAssignment = require("../models/PeriodAssignment");
const Conversation = require("../models/Conversation");
const GPAMessage = require("../models/GPAMessage");
const { messaging } = require("../firebaseAdmin");
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

// =========================================================
// SEND FCM PUSH NOTIFICATION
// =========================================================

async function sendFCMNotification(
    receiverIds,
    senderName,
    message,
    conversationId
) {

    try {

        // -----------------------------------------------------
        // SUPPORT BOTH:
        // receiverIds = single ID
        // receiverIds = array of IDs
        // -----------------------------------------------------

        if (!Array.isArray(receiverIds)) {

            receiverIds = [
                receiverIds
            ];

        }


        receiverIds =
            receiverIds.filter(
                id => !!id
            );


        if (!receiverIds.length) {

            return;

        }


        // -----------------------------------------------------
        // GET ALL TOKENS FOR ALL RECEIVERS
        // -----------------------------------------------------

        const tokenRecords =
    await FCMToken.find({

        user: {
            $in: receiverIds
        }

    })
    .populate(
        "user",
        "_id name role"
    )
    .select("token user platform deviceId lastSeenAt");


        if (!tokenRecords.length) {

            console.log(
                "No FCM tokens found for receivers:",
                receiverIds
            );

            return;

        }


        const tokens =
            tokenRecords.map(
                item => item.token
            );
            console.log(
    "========== GPA FCM TARGET TOKENS =========="
);

tokenRecords.forEach(
    item => {

        console.log(
            "FCM TARGET:",
            {
                userId:
                    item.user?._id,

                userName:
                    item.user?.name,

                role:
                    item.user?.role,

                platform:
                    item.platform,

                deviceId:
                    item.deviceId,

                lastSeenAt:
                    item.lastSeenAt
            }
        );

    }
);

console.log(
    "============================================"
);


        // -----------------------------------------------------
        // NOTIFICATION BODY
        // -----------------------------------------------------

        const notificationBody =
            message.length > 120
                ? message.substring(0, 117) + "..."
                : message;


        // -----------------------------------------------------
        // SEND TO ALL RECEIVERS
        // -----------------------------------------------------

        const response =
            await messaging.sendEachForMulticast({

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
                        String(
                            conversationId
                        ),

                    url:
                        "https://www.gopespinnacle.com/gpa-messenger.html"

                },

                webpush: {
    headers: {
        Urgency: "high"
    },
    fcmOptions: {
        link:
            "https://www.gopespinnacle.com/gpa-messenger.html"
    }
}

            });


        console.log(
            `FCM notification sent: ${response.successCount} successful, ${response.failureCount} failed`
        );

        response.responses.forEach(
    (result, index) => {

        if (!result.success) {

            console.error(
                "❌ FCM DELIVERY FAILED:",
                {
                    token: tokens[index],
                    errorCode:
                        result.error?.code,
                    errorMessage:
                        result.error?.message
                }
            );

        } else {

            console.log(
                "✅ FCM DELIVERY SUCCESS:",
                tokens[index]
            );

        }

    }
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


        if (
            invalidTokens.length
        ) {

            await FCMToken.deleteMany({

                token: {
                    $in:
                        invalidTokens
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
    // LOAD ALL PARTICIPANTS
    // -------------------------------------------------------

    const participantUsers =
        await User.find({
            _id: {
                $in:
                    conversation.participants
            }
        })
        .select(
            "_id name role studentId teacherId"
        );


    if (!participantUsers.length) {
        return false;
    }
// -------------------------------------------------------
// ADMIN
// -------------------------------------------------------

if (user.role === "admin") {

    // Admin can access ONLY direct 1-to-1 conversations
    if (
        conversation.conversationType !== "direct" ||
        participantUsers.length !== 2
    ) {
        return false;
    }

    // Find the other person
    const otherUser =
        participantUsers.find(
            participant =>
                String(participant._id) !==
                String(user._id)
        );

    if (!otherUser) {
        return false;
    }

    // Admin can chat ONLY with Teacher or Student
    if (
        otherUser.role !== "teacher" &&
        otherUser.role !== "student"
    ) {
        return false;
    }

    return true;
}

  

    // -------------------------------------------------------
// TEACHER
// -------------------------------------------------------

if (user.role === "teacher") {
    // -------------------------------------------------
    // ADMIN ↔ TEACHER PERSONAL CONVERSATION
    // -------------------------------------------------

    const hasAdmin =
        participantUsers.some(
            participant =>
                participant.role ===
                "admin"
        );

    if (
        hasAdmin &&
        conversation.conversationType === "direct" &&
        participantUsers.length === 2
    ) {

        return true;

    }

    // -------------------------------------------------
    // FOUNDER ↔ TEACHER PERSONAL CONVERSATION
    // -------------------------------------------------

    const hasFounder =
        participantUsers.some(
            participant =>
                participant.role ===
                "founder"
        );


    const hasStudent =
        participantUsers.some(
            participant =>
                participant.role ===
                "student"
        );


    // If this conversation contains Founder
    // and NO Student, it is a personal
    // Founder ↔ Teacher conversation.
    if (
        hasFounder &&
        !hasStudent &&
        participantUsers.length === 2
    ) {

        return true;

    }


    // -------------------------------------------------
    // NORMAL TEACHER ↔ STUDENT / GROUP ACCESS
    // -------------------------------------------------

    const students =
        participantUsers.filter(
            participant =>
                participant.role ===
                "student"
        );


    if (!students.length) {

        return false;

    }


    // At least one student must be mapped
    // to this teacher.

    for (
        const student
        of students
    ) {

        const mapped =
            await areTeacherAndStudentMapped(
                user._id,
                student._id
            );


        if (mapped) {

            return true;

        }

    }


    return false;

}


    // -------------------------------------------------------
    // STUDENT
    // -------------------------------------------------------

   // -------------------------------------------------------
// STUDENT
// -------------------------------------------------------

if (user.role === "student") {

        // -------------------------------------------------
    // ADMIN ↔ STUDENT PERSONAL CONVERSATION
    // -------------------------------------------------

    const hasAdmin =
        participantUsers.some(
            participant =>
                participant.role ===
                "admin"
        );

    if (
        hasAdmin &&
        conversation.conversationType === "direct" &&
        participantUsers.length === 2
    ) {

        return true;

    }

    // -------------------------------------------------
    // FOUNDER ↔ STUDENT PERSONAL CONVERSATION
    // -------------------------------------------------

    const hasFounder =
        participantUsers.some(
            participant =>
                participant.role ===
                "founder"
        );


    const hasTeacher =
        participantUsers.some(
            participant =>
                participant.role ===
                "teacher"
        );


    // If this conversation contains Founder
    // and NO Teacher, it is a personal
    // Founder ↔ Student conversation.
    if (
        hasFounder &&
        !hasTeacher &&
        participantUsers.length === 2
    ) {

        return true;

    }


    // -------------------------------------------------
    // NORMAL STUDENT ↔ TEACHER / GROUP ACCESS
    // -------------------------------------------------

    const teachers =
        participantUsers.filter(
            participant =>
                participant.role ===
                "teacher"
        );


    if (!teachers.length) {

        return false;

    }


    // At least one teacher must be mapped
    // to this student.

    for (
        const teacher
        of teachers
    ) {

        const mapped =
            await areTeacherAndStudentMapped(
                teacher._id,
                user._id
            );


        if (mapped) {

            return true;

        }

    }


    return false;

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
            // GET ALL OTHER PARTICIPANTS
            // -----------------------------------------

            const receiverIds =
                conversation.participants
                    .filter(
                        participant =>
                            String(
                                participant
                            ) !==
                            String(
                                sender._id
                            )
                    );


            if (!receiverIds.length) {

                socket.emit(
                    "messengerError",
                    {
                        message:
                            "No receiver found for this conversation."
                    }
                );

                return;
            }


            // -----------------------------------------
            // LOAD ALL RECEIVERS
            // -----------------------------------------

            const receivers =
                await User.find({

                    _id: {
                        $in:
                            receiverIds
                    }

                })
                .select(
                    "_id name email role studentId teacherId"
                );


            if (
                receivers.length !==
                receiverIds.length
            ) {

                socket.emit(
                    "messengerError",
                    {
                        message:
                            "One or more conversation participants could not be found."
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

    // -------------------------------------------------
    // TEACHER CAN MESSAGE:
    //
    // 1. Mapped Student
    // 2. Founder in personal conversation
    // 3. Founder + mapped Student in Group
    // -------------------------------------------------

    for (
        const receiver
        of receivers
    ) {

        // ---------------------------------------------
        // FOUNDER
        // ---------------------------------------------

        if (
            receiver.role ===
            "founder"
        ) {

            // Founder is allowed.
            continue;

        }

        // ---------------------------------------------
// ADMIN
// ---------------------------------------------

if (
    receiver.role ===
    "admin"
) {

    socket.emit(
        "messengerError",
        {
            message:
                "Teachers cannot reply to Admin messages."
        }
    );

    return;

}


        // ---------------------------------------------
        // STUDENT
        // ---------------------------------------------

        if (
            receiver.role !==
            "student"
        ) {

            socket.emit(
                "messengerError",
                {
                    message:
                        "Teachers can only message mapped students or the Founder."
                }
            );

            return;

        }


        // ---------------------------------------------
        // VERIFY STUDENT MAPPING
        // ---------------------------------------------

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

}

            // -----------------------------------------
// STUDENT SECURITY
// -----------------------------------------

if (
    sender.role ===
    "student"
) {

    // -------------------------------------------------
    // STUDENT CAN MESSAGE:
    //
    // 1. Mapped Teacher
    // 2. Founder in personal conversation
    // 3. Founder + mapped Teacher in Group
    // -------------------------------------------------

    for (
        const receiver
        of receivers
    ) {

        // ---------------------------------------------
        // FOUNDER
        // ---------------------------------------------

        if (
            receiver.role ===
            "founder"
        ) {

            // Founder is allowed.
            continue;

        }

         // ---------------------------------------------
// ADMIN
// ---------------------------------------------

if (
    receiver.role ===
    "admin"
) {

    socket.emit(
        "messengerError",
        {
            message:
                "Students cannot reply to Admin messages."
        }
    );

    return;

}

        // ---------------------------------------------
        // TEACHER
        // ---------------------------------------------

        if (
            receiver.role !==
            "teacher"
        ) {

            socket.emit(
                "messengerError",
                {
                    message:
                        "Students can only message mapped teachers or the Founder."
                }
            );

            return;

        }


        // ---------------------------------------------
        // VERIFY TEACHER MAPPING
        // ---------------------------------------------

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

}


            // -----------------------------------------
            // FOUNDER
            // -----------------------------------------

            if (
                sender.role ===
                "founder"
            ) {

                // Founder can message all participants
                // of a conversation.

                // No additional receiver restriction
                // is required here.

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

                    // Backward compatibility:
                    // store the first receiver here.
                    receiver:
                        receivers[0]._id,

                    // New multi-recipient support.
                    receivers:
                        receivers.map(
                            receiver =>
                                receiver._id
                        ),

                    message:
                        message.trim(),

                    messageType:
                        "text",

                    isRead:
                        false,

                    readBy: []

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


            // -----------------------------------------
            // UPDATE UNREAD COUNT
            // FOR EVERY RECEIVER
            // -----------------------------------------

            for (
                const receiver
                of receivers
            ) {

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


                if (
                    unreadEntry
                ) {

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
                )
                .populate(
                    "receivers",
                    "_id name role"
                );


            // -----------------------------------------
            // SEND TO CONVERSATION ROOM
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
// SEND PERSONAL SOCKET NOTIFICATION
// TO RECEIVERS + ALL FOUNDERS
// -----------------------------------------

const founderUsers =
    await User.find({
        role: "founder"
    })
    .select("_id");


const socketNotificationUserIds =
    [
        ...receivers.map(
            receiver =>
                String(
                    receiver._id
                )
        ),

        ...founderUsers.map(
            founder =>
                String(
                    founder._id
                )
        )
    ];


// Remove duplicate user IDs
const uniqueSocketNotificationUserIds =
    [
        ...new Set(
            socketNotificationUserIds
        )
    ];


for (
    const userId
    of uniqueSocketNotificationUserIds
) {

    messenger.to(
        `gpa-user:${userId}`
    ).emit(
        "messengerNewMessageNotification",
        {
            conversationId,

            message:
                populatedMessage
        }
    );

}


            // -----------------------------------------
// SEND FCM NOTIFICATION
// TO RECEIVERS + ALL FOUNDERS
// -----------------------------------------

const founderUsersForFCM =
    await User.find({
        role: "founder"
    })
    .select("_id");


const fcmNotificationUserIds =
    [
        ...receivers.map(
            receiver =>
                String(
                    receiver._id
                )
        ),

        ...founderUsersForFCM.map(
            founder =>
                String(
                    founder._id
                )
        )
    ];


// Remove duplicate user IDs
const uniqueFCMNotificationUserIds =
    [
        ...new Set(
            fcmNotificationUserIds
        )
    ];


await sendFCMNotification(

    uniqueFCMNotificationUserIds,

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


            const user =
                socket.gpaUser;


            const conversation =
                await Conversation.findById(
                    conversationId
                );


            if (!conversation) {
                return;
            }


            // -------------------------------------------------
            // ACCESS CHECK
            // -------------------------------------------------

            const allowed =
                await canAccessConversation(
                    user,
                    conversation
                );


            if (!allowed) {
                return;
            }


            // -------------------------------------------------
            // FIND UNREAD MESSAGES FOR THIS USER
            // -------------------------------------------------
            //
            // New messages:
            // receivers contains the user.
            //
            // Old messages:
            // receiver contains the user.
            //

            const messages =
                await GPAMessage.find({

                    conversation:
                        conversationId,

                    $or: [

                        {
                            receivers:
                                user._id
                        },

                        {
                            receiver:
                                user._id
                        }

                    ]

                });


            // -------------------------------------------------
            // MARK EACH MESSAGE AS READ FOR THIS USER
            // -------------------------------------------------

            for (
                const message
                of messages
            ) {

                const alreadyRead =
                    message.readBy?.some(
                        entry =>
                            String(
                                entry.user
                            ) ===
                            String(
                                user._id
                            )
                    );


                if (
                    !alreadyRead
                ) {

                    message.readBy =
                        message.readBy || [];


                    message.readBy.push({

                        user:
                            user._id,

                        readAt:
                            new Date()

                    });


                    // -----------------------------------------
                    // BACKWARD COMPATIBILITY
                    // -----------------------------------------

                    // If this is an old direct message
                    // whose receiver is this user, also
                    // maintain the old fields.

                    if (
                        message.receiver &&
                        String(
                            message.receiver
                        ) ===
                        String(
                            user._id
                        )
                    ) {

                        message.isRead =
                            true;

                        message.readAt =
                            new Date();

                    }


                    await message.save();

                }

            }


            // -------------------------------------------------
            // CLEAR THIS USER'S UNREAD COUNT
            // -------------------------------------------------

            const unreadEntry =
                conversation.unreadCounts?.find(
                    item =>
                        String(
                            item.user
                        ) ===
                        String(
                            user._id
                        )
                );


            if (
                unreadEntry
            ) {

                unreadEntry.count =
                    0;

                await conversation.save();

            }


            // -------------------------------------------------
            // INFORM OTHER PARTICIPANTS
            // -------------------------------------------------

            messenger.to(
                messengerRoom(
                    conversationId
                )
            ).emit(
                "messengerConversationRead",
                {

                    conversationId,

                    userId:
                        user._id

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

        // =========================================================
// VOICE CALL SIGNALING
// =========================================================

// ---------------------------------------------------------
// START VOICE CALL
// ---------------------------------------------------------

socket.on(
    "startVoiceCall",

    
    async (data) => {

        try {

           const {
    conversationId,
    receiverId
} = data || {};


            if (
    !conversationId ||
    !receiverId
) {

    socket.emit(
        "voiceCallError",
        {
            message:
                "Conversation and receiver are required."
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
                    "voiceCallError",
                    {
                        message:
                            "Conversation not found."
                    }
                );

                return;

            }


            const caller =
                socket.gpaUser;


            // -------------------------------------------------
            // ONLY FOUNDER / ADMIN CAN START CALLS
            // -------------------------------------------------

            if (
                caller.role !== "founder" &&
                caller.role !== "admin"
            ) {

                socket.emit(
                    "voiceCallError",
                    {
                        message:
                            "Only Founder or Admin can start a voice call."
                    }
                );

                return;

            }


            // -------------------------------------------------
            // VERIFY CONVERSATION ACCESS
            // -------------------------------------------------

            const allowed =
                await canAccessConversation(
                    caller,
                    conversation
                );


            if (!allowed) {

                socket.emit(
                    "voiceCallError",
                    {
                        message:
                            "You are not allowed to call in this conversation."
                    }
                );

                return;

            }


            // -------------------------------------------------
// GET SELECTED RECEIVER
// -------------------------------------------------

const receiver =
    await User.findById(
        receiverId
    )
    .select(
        "_id name role"
    );


if (!receiver) {

    socket.emit(
        "voiceCallError",
        {
            message:
                "Receiver not found."
        }
    );

    return;

}

// -------------------------------------------------
// RECEIVER MUST BE IN THIS CONVERSATION
// -------------------------------------------------

const receiverInConversation =
    conversation.participants.some(
        participant =>
            String(
                participant
            ) ===
            String(
                receiver._id
            )
    );


if (!receiverInConversation) {

    socket.emit(
        "voiceCallError",
        {
            message:
                "This receiver is not part of the conversation."
        }
    );

    return;

}


            // -------------------------------------------------
// ONLY TEACHER / STUDENT CAN RECEIVE
// -------------------------------------------------

if (
    receiver.role !== "teacher" &&
    receiver.role !== "student"
) {

    socket.emit(
        "voiceCallError",
        {
            message:
                "Voice calls are only available between Founder/Admin and Teacher/Student."
        }
    );

    return;

}


            // -------------------------------------------------
// SEND INCOMING CALL TO SELECTED RECEIVER ONLY
// -------------------------------------------------

messenger
    .to(
        `gpa-user:${receiver._id}`
    )
    .emit(
        "incomingVoiceCall",
        {

            conversationId:
                String(
                    conversation._id
                ),

            callerId:
                String(
                    caller._id
                ),

            callerName:
                caller.name,

            callerRole:
                caller.role

        }
    );


            // -------------------------------------------------
            // CONFIRM CALL STARTED
            // -------------------------------------------------

            socket.emit(
                "voiceCallStarted",
                {

                    conversationId:
                        String(
                            conversation._id
                        )

                }
            );

                }
        catch (error) {

            console.error(
                "START VOICE CALL ERROR:",
                error
            );

            socket.emit(
                "voiceCallError",
                {
                    message:
                        "Unable to start voice call."
                }
            );

        }

    }
);
// =========================================================
// WEBRTC OFFER SIGNALING
// =========================================================

socket.on(
    "voiceOffer",
    async (data) => {

        try {

            const {
                conversationId,
                receiverId,
                offer
            } = data || {};

            if (
                !conversationId ||
                !receiverId ||
                !offer
            ) {
                return;
            }

            const conversation =
                await Conversation.findById(
                    conversationId
                );

            if (!conversation) {
                return;
            }

            const caller =
                socket.gpaUser;

            const allowed =
                await canAccessConversation(
                    caller,
                    conversation
                );

            if (!allowed) {
                return;
            }

            messenger
                .to(`gpa-user:${receiverId}`)
                .emit(
                    "voiceOffer",
                    {
                        conversationId:
                            String(
                                conversationId
                            ),

                        callerId:
                            String(
                                caller._id
                            ),

                        offer
                    }
                );

        } catch (error) {

            console.error(
                "VOICE OFFER ERROR:",
                error
            );

        }

    }
);

// =========================================================
// WEBRTC ANSWER SIGNALING
// =========================================================

socket.on(
    "voiceAnswer",
    async (data) => {

        try {

            const {
                conversationId,
                callerId,
                answer
            } = data || {};

            if (
                !conversationId ||
                !callerId ||
                !answer
            ) {
                return;
            }

            const conversation =
                await Conversation.findById(
                    conversationId
                );

            if (!conversation) {
                return;
            }

            const receiver =
                socket.gpaUser;

            const allowed =
                await canAccessConversation(
                    receiver,
                    conversation
                );

            if (!allowed) {
                return;
            }

            messenger
                .to(`gpa-user:${callerId}`)
                .emit(
                    "voiceAnswer",
                    {
                        conversationId:
                            String(
                                conversationId
                            ),

                        receiverId:
                            String(
                                receiver._id
                            ),

                        answer
                    }
                );

        }
        catch (error) {

            console.error(
                "VOICE ANSWER ERROR:",
                error
            );

        }

    }
);

// =========================================================
// WEBRTC ICE CANDIDATE
// =========================================================

socket.on(
    "voiceIceCandidate",
    async (data) => {

        try {

            const {
                conversationId,
                receiverId,
                candidate
            } = data || {};

            if (
                !conversationId ||
                !receiverId ||
                !candidate
            ) {
                return;
            }

            const conversation =
                await Conversation.findById(
                    conversationId
                );

            if (!conversation) {
                return;
            }

            const sender =
                socket.gpaUser;

            const allowed =
                await canAccessConversation(
                    sender,
                    conversation
                );

            if (!allowed) {
                return;
            }

            // -------------------------------------------------
            // SEND ICE CANDIDATE TO OTHER USER
            // -------------------------------------------------

            messenger
                .to(
                    `gpa-user:${receiverId}`
                )
                .emit(
                    "voiceIceCandidate",
                    {
                        conversationId:
                            String(
                                conversationId
                            ),

                        senderId:
                            String(
                                sender._id
                            ),

                        candidate
                    }
                );

        }
        catch (error) {

            console.error(
                "VOICE ICE CANDIDATE ERROR:",
                error
            );

        }

    }
);

// =========================================================
// ACCEPT VOICE CALL
// =========================================================

socket.on(
    "acceptVoiceCall",
    async (data) => {

        try {

            const {
                conversationId,
                callerId
            } = data || {};

            if (
                !conversationId ||
                !callerId
            ) {

                return;

            }

            messenger
                .to(
                    `gpa-user:${callerId}`
                )
                .emit(
                    "voiceCallAccepted",
                    {

                        conversationId:
                            String(
                                conversationId
                            ),

                        acceptedBy:
                            String(
                                socket.gpaUser._id
                            )

                    }
                );

        }
        catch (error) {

            console.error(
                "ACCEPT VOICE CALL ERROR:",
                error
            );

        }

    }
);


// ---------------------------------------------------------
// REJECT VOICE CALL
// ---------------------------------------------------------

socket.on(
    "rejectVoiceCall",
    async (data) => {

        try {

            const {
                conversationId,
                callerId
            } = data || {};


            if (
                !conversationId ||
                !callerId
            ) {

                return;

            }


            messenger
                .to(
                    `gpa-user:${callerId}`
                )
                .emit(
                    "voiceCallRejected",
                    {

                        conversationId:
                            String(
                                conversationId
                            ),

                        rejectedBy:
                            String(
                                socket.gpaUser._id
                            )

                    }
                );

        }
        catch (error) {

            console.error(
                "REJECT VOICE CALL ERROR:",
                error
            );

        }

    }
);


// ---------------------------------------------------------
// END VOICE CALL
// ---------------------------------------------------------

socket.on(
    "endVoiceCall",
    async (data) => {

        try {

            const {
                conversationId,
                receiverId
            } = data || {};


            if (
                !conversationId ||
                !receiverId
            ) {

                return;

            }


            messenger
                .to(
                    `gpa-user:${receiverId}`
                )
                .emit(
                    "voiceCallEnded",
                    {

                        conversationId:
                            String(
                                conversationId
                            ),

                        endedBy:
                            String(
                                socket.gpaUser._id
                            )

                    }
                );

        }
        catch (error) {

            console.error(
                "END VOICE CALL ERROR:",
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