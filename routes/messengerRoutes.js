const express = require("express");

const router = express.Router();

const jwt = require("jsonwebtoken");

const User =
    require("../models/User");

const PeriodAssignment =
    require("../models/PeriodAssignment");

const Conversation =
    require("../models/Conversation");

const GPAMessage =
    require("../models/GPAMessage");

const messengerAuth =
    require("../middleware/messengerAuth");

// =========================================================
// GET CURRENT MESSENGER USER
// =========================================================

router.get(
    "/me",
    messengerAuth,
    async (req, res) => {

        try {

            const user =
                await User.findById(req.user._id)
                    .select(
                        "_id name email role studentId teacherId"
                    );

            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."

                });

            }

            return res.json({

                success: true,

                user

            });

        }
        catch (error) {

            console.error(
                "GET MESSENGER ME ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load current user."

            });

        }

    }
);


// =========================================================
// HELPER — CHECK TEACHER ↔ STUDENT MAPPING
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
// HELPER — GET OR CREATE CONVERSATION
// =========================================================

async function getOrCreateConversation(
    user1,
    user2
) {

    let conversation =
        await Conversation.findOne({

            participants: {
                $all: [
                    user1,
                    user2
                ]
            },

            $expr: {
                $eq: [
                    {
                        $size:
                            "$participants"
                    },
                    2
                ]
            }

        });

    if (conversation) {

        return conversation;

    }


    conversation =
        await Conversation.create({

            participants: [
                user1,
                user2
            ],

            unreadCounts: [

                {
                    user: user1,
                    count: 0
                },

                {
                    user: user2,
                    count: 0
                }

            ]

        });

    return conversation;

}


// =========================================================
// GET MY MESSENGER CONTACTS
// =========================================================

router.get(
    "/contacts",
    messengerAuth,
    async (req, res) => {

        try {

            const user =
                req.user;


            // =================================================
            // FOUNDER
            // =================================================

            if (
                user.role ===
                "founder"
            ) {

                const users =
                    await User.find({

                        role: {
                            $in: [
                                "teacher",
                                "student"
                            ]
                        }

                    })
                    .select(
                        "_id name email role studentId teacherId"
                    )
                    .sort({
                        name: 1
                    });


                return res.json({

                    success: true,

                    contacts:
                        users

                });

            }


            // =================================================
            // TEACHER
            // =================================================

            if (
                user.role ===
                "teacher"
            ) {

                const periods =
                    await PeriodAssignment.find({

                        $or: [

                            {
                                teacher:
                                    user._id
                            },

                            {
                                assistantTeacher:
                                    user._id
                            }

                        ]

                    })
                    .populate(
                        "assignments.student",
                        "_id name email studentId grade"
                    );


                const studentMap =
                    new Map();


                periods.forEach(
                    period => {

                        if (
                            !period.assignments
                        ) {

                            return;

                        }


                        period.assignments.forEach(
                            assignment => {

                                const student =
                                    assignment.student;


                                if (!student) {

                                    return;

                                }


                                studentMap.set(
                                    String(
                                        student._id
                                    ),
                                    student
                                );

                            }
                        );

                    }
                );


                const contacts =
                    Array.from(
                        studentMap.values()
                    );


                return res.json({

                    success: true,

                    contacts

                });

            }


            // =================================================
            // STUDENT
            // =================================================

            if (
                user.role ===
                "student"
            ) {

                const periods =
                    await PeriodAssignment.find({

                        "assignments.student":
                            user._id

                    })
                    .populate(
                        "teacher",
                        "_id name email teacherId"
                    )
                    .populate(
                        "assistantTeacher",
                        "_id name email teacherId"
                    );


                const teacherMap =
                    new Map();


                periods.forEach(
                    period => {

                        if (
                            period.teacher
                        ) {

                            teacherMap.set(

                                String(
                                    period.teacher._id
                                ),

                                period.teacher

                            );

                        }


                        if (
                            period.assistantTeacher
                        ) {

                            teacherMap.set(

                                String(
                                    period.assistantTeacher._id
                                ),

                                period.assistantTeacher

                            );

                        }

                    }
                );


                const contacts =
                    Array.from(
                        teacherMap.values()
                    );


                return res.json({

                    success: true,

                    contacts

                });

            }


            return res.status(403).json({

                success: false,

                message:
                    "Messenger access denied."

            });

        }
        catch (error) {

            console.error(
                "MESSENGER CONTACTS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load Messenger contacts."

            });

        }

    }
);


// =========================================================
// CREATE / GET CONVERSATION
// =========================================================

router.post(
    "/conversations",
    messengerAuth,
    async (req, res) => {

        try {

            const currentUser =
                req.user;

            const {
                userId
            } = req.body;


            if (!userId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "User ID is required."

                });

            }


            const targetUser =
                await User.findById(
                    userId
                );


            if (!targetUser) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User not found."

                });

            }


            // =================================================
            // TEACHER / STUDENT PERMISSION
            // =================================================

            if (
                currentUser.role ===
                    "teacher" &&
                targetUser.role ===
                    "student"
            ) {

                const allowed =
                    await areTeacherAndStudentMapped(
                        currentUser._id,
                        targetUser._id
                    );


                if (!allowed) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "This student is not mapped to you."

                    });

                }

            }


            if (
                currentUser.role ===
                    "student" &&
                targetUser.role ===
                    "teacher"
            ) {

                const allowed =
                    await areTeacherAndStudentMapped(
                        targetUser._id,
                        currentUser._id
                    );


                if (!allowed) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "This teacher is not mapped to you."

                    });

                }

            }


            // =================================================
            // STUDENT CANNOT CHAT WITH STUDENT
            // =================================================

            if (
                currentUser.role ===
                    "student" &&
                targetUser.role ===
                    "student"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Student-to-student messaging is not allowed."

                });

            }


            // =================================================
            // TEACHER CANNOT CHAT WITH TEACHER
            // =================================================

            if (
                currentUser.role ===
                    "teacher" &&
                targetUser.role ===
                    "teacher"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Teacher-to-teacher messaging is not allowed."

                });

            }


            const conversation =
                await getOrCreateConversation(

                    currentUser._id,

                    targetUser._id

                );


            const populated =
                await Conversation.findById(
                    conversation._id
                )
                .populate(
                    "participants",
                    "_id name email role studentId teacherId"
                );


            return res.json({

                success: true,

                conversation:
                    populated

            });

        }
        catch (error) {

            console.error(
                "CREATE CONVERSATION ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to create conversation."

            });

        }

    }
);


// =========================================================
// GET MY CONVERSATIONS
// =========================================================

router.get(
    "/conversations",
    messengerAuth,
    async (req, res) => {

        try {

            const user =
                req.user;


            let conversations;


            // =================================================
            // FOUNDER
            // =================================================

            if (
                user.role ===
                "founder"
            ) {

                conversations =
                    await Conversation.find({

                        participants: {
                            $elemMatch: {
                                $exists: true
                            }
                        }

                    })
                    .populate(
                        "participants",
                        "_id name email role studentId teacherId"
                    )
                    .populate(
                        "lastMessageSender",
                        "_id name role"
                    )
                    .sort({
                        lastMessageAt: -1,
                        updatedAt: -1
                    });


            }
            else {

                // =================================================
                // TEACHER / STUDENT
                // =================================================

                conversations =
                    await Conversation.find({

                        participants:
                            user._id

                    })
                    .populate(
                        "participants",
                        "_id name email role studentId teacherId"
                    )
                    .populate(
                        "lastMessageSender",
                        "_id name role"
                    )
                    .sort({
    lastMessageAt: -1,
    updatedAt: -1
});

            }


            return res.json({

                success: true,

                conversations

            });

        }
        catch (error) {

            console.error(
                "GET CONVERSATIONS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load conversations."

            });

        }

    }
);


// =========================================================
// GET MESSAGE HISTORY
// =========================================================

router.get(
    "/conversations/:conversationId/messages",
    messengerAuth,
    async (req, res) => {

        try {

            const {
                conversationId
            } = req.params;

            const user =
                req.user;


            const conversation =
                await Conversation.findById(
                    conversationId
                );


            if (!conversation) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Conversation not found."

                });

            }


            // =================================================
            // ACCESS CHECK
            // =================================================

            const isParticipant =
                conversation.participants.some(
                    participant =>
                        String(participant)
                        ===
                        String(user._id)
                );


            let allowed =
                isParticipant;


            // Founder can monitor conversations
            if (
                user.role ===
                "founder"
            ) {

                allowed = true;

            }


            if (!allowed) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You are not allowed to access this conversation."

                });

            }


            const messages =
                await GPAMessage.find({

                    conversation:
                        conversationId

                })
                .populate(
                    "sender",
                    "_id name role"
                )
                .populate(
                    "receiver",
                    "_id name role"
                )
                .sort({
                    createdAt: 1
                });


            // =================================================
            // MARK RECEIVED MESSAGES AS READ
            // =================================================

            if (
                user.role !==
                "founder"
            ) {

                await GPAMessage.updateMany(

                    {

                        conversation:
                            conversationId,

                        receiver:
                            user._id,

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
                    conversation.unreadCounts
                        ?.find(
                            item =>
                                String(
                                    item.user
                                )
                                ===
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

            }


            return res.json({

                success: true,

                messages

            });

        }
        catch (error) {

            console.error(
                "GET MESSAGE HISTORY ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load messages."

            });

        }

    }
);


// =========================================================
// SEND TEXT MESSAGE
// =========================================================

router.post(
    "/messages",
    messengerAuth,
    async (req, res) => {

        try {

            const {
                conversationId,
                message
            } = req.body;

            const sender =
                req.user;


            if (
                !conversationId ||
                !message ||
                !message.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Conversation and message are required."

                });

            }


            const conversation =
                await Conversation.findById(
                    conversationId
                );


            if (!conversation) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Conversation not found."

                });

            }


            // =================================================
            // DETERMINE RECEIVER
            // =================================================

            let receiverId =
                conversation.participants
                    .find(
                        participant =>
                            String(
                                participant
                            )
                            !==
                            String(
                                sender._id
                            )
                    );


            // Founder may send to either participant
            if (
                sender.role ===
                "founder"
            ) {

                receiverId =
                    conversation.participants[0];

            }


            if (!receiverId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Receiver could not be determined."

                });

            }


            const receiver =
                await User.findById(
                    receiverId
                );


            if (!receiver) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Receiver not found."

                });

            }


            // =================================================
            // TEACHER / STUDENT SECURITY
            // =================================================

            if (
                sender.role ===
                    "teacher"
            ) {

                if (
                    receiver.role !==
                    "student"
                ) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "Teachers can only message mapped students."

                    });

                }


                const allowed =
                    await areTeacherAndStudentMapped(
                        sender._id,
                        receiver._id
                    );


                if (!allowed) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "This student is not mapped to you."

                    });

                }

            }


            if (
                sender.role ===
                    "student"
            ) {

                if (
                    receiver.role !==
                    "teacher"
                ) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "Students can only message mapped teachers."

                    });

                }


                const allowed =
                    await areTeacherAndStudentMapped(
                        receiver._id,
                        sender._id
                    );


                if (!allowed) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "This teacher is not mapped to you."

                    });

                }

            }


            // =================================================
            // CREATE MESSAGE
            // =================================================

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


            // =================================================
            // UPDATE CONVERSATION
            // =================================================

            conversation.lastMessage =
                message.trim();

            conversation.lastMessageAt =
                new Date();

            conversation.lastMessageSender =
                sender._id;


            let unreadEntry =
                conversation.unreadCounts
                    ?.find(
                        item =>
                            String(
                                item.user
                            )
                            ===
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


            await conversation.save();


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


            return res.status(201).json({

                success: true,

                message:
                    populatedMessage

            });

        }
        catch (error) {

            console.error(
                "SEND MESSAGE ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to send message."

            });

        }

    }
);


// =========================================================
// MARK CONVERSATION READ
// =========================================================

router.put(
    "/conversations/:conversationId/read",
    messengerAuth,
    async (req, res) => {

        try {

            const user =
                req.user;

            const {
                conversationId
            } = req.params;


            const conversation =
                await Conversation.findById(
                    conversationId
                );


            if (!conversation) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Conversation not found."

                });

            }


            const isParticipant =
                conversation.participants.some(
                    participant =>
                        String(
                            participant
                        )
                        ===
                        String(
                            user._id
                        )
                );


            if (
                !isParticipant &&
                user.role !==
                    "founder"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Access denied."

                });

            }


            await GPAMessage.updateMany(

                {

                    conversation:
                        conversationId,

                    receiver:
                        user._id,

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
                conversation.unreadCounts
                    ?.find(
                        item =>
                            String(
                                item.user
                            )
                            ===
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


            return res.json({

                success: true,

                message:
                    "Conversation marked as read."

            });

        }
        catch (error) {

            console.error(
                "MARK READ ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to mark conversation as read."

            });

        }

    }
);


module.exports = router;