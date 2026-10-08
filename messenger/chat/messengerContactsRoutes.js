/**
 * ============================================================
 * GPA MESSENGER
 * CONTACTS ROUTES
 * ============================================================
 *
 * PURPOSE:
 *
 * Return Messenger contacts according to the logged-in user's
 * Academy role and existing Academy mapping.
 *
 * ACCESS RULES:
 *
 * FOUNDER
 *  - All Teachers
 *  - All Students
 *  - All Admins
 *
 * ADMIN
 *  - Teachers
 *  - Students
 *  - Founder
 *
 * TEACHER
 *  - Founder
 *  - Admins
 *  - Mapped Students
 *
 * STUDENT
 *  - Founder
 *  - Admins
 *  - Mapped Teachers
 *
 * ============================================================
 */

const express =
    require("express");

const jwt =
    require("jsonwebtoken");

const User =
    require("../../models/User");

const PeriodAssignment =
    require("../../models/PeriodAssignment");

const router =
    express.Router();


// ============================================================
// GET MESSENGER CONTACTS
// ============================================================

router.get(
    "/",
    async (req, res) => {

        try {

            // ==================================================
            // GET TOKEN
            // ==================================================

            const authHeader =
                req.headers.authorization;

            if (
                !authHeader ||
                !authHeader.startsWith("Bearer ")
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Authentication token is required."

                });

            }


            const token =
                authHeader.split(" ")[1];


            // ==================================================
            // VERIFY TOKEN
            // ==================================================

            let decoded;

            try {

                decoded =
                    jwt.verify(
                        token,
                        process.env.JWT_SECRET
                    );

            }
            catch (error) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid or expired authentication token."

                });

            }


            if (!decoded || !decoded.id) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid user authentication."

                });

            }


            // ==================================================
            // LOAD CURRENT USER
            // ==================================================

            const currentUser =
                await User.findById(
                    decoded.id
                )
                .select(
                    "_id name email role"
                )
                .lean();


            if (!currentUser) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Logged-in user not found."

                });

            }


            console.log(
                "[GPA MESSENGER CONTACTS] " +
                "Loading contacts for:",
                currentUser.name,
                currentUser.role
            );


            // ==================================================
            // FOUNDER
            // ==================================================

            if (
                currentUser.role ===
                "founder"
            ) {

                const contacts =
                    await User.find({

                        role: {
                            $in: [
                                "teacher",
                                "student",
                                "admin"
                            ]
                        }

                    })
                    .select(
                        "_id name email role grade board " +
                        "studentId teacherId adminId"
                    )
                    .sort({
                        name: 1
                    })
                    .lean();


                console.log(
                    "[GPA MESSENGER CONTACTS] " +
                    "Founder contacts:",
                    contacts.length
                );


                return res.status(200).json({

                    success: true,

                    count:
                        contacts.length,

                    contacts:
                        contacts

                });

            }


            // ==================================================
            // ADMIN
            // ==================================================

            if (
                currentUser.role ===
                "admin"
            ) {

                const contacts =
                    await User.find({

                        role: {
                            $in: [
                                "founder",
                                "teacher",
                                "student"
                            ]
                        }

                    })
                    .select(
                        "_id name email role grade board " +
                        "studentId teacherId adminId"
                    )
                    .sort({
                        name: 1
                    })
                    .lean();


                console.log(
                    "[GPA MESSENGER CONTACTS] " +
                    "Admin contacts:",
                    contacts.length
                );


                return res.status(200).json({

                    success: true,

                    count:
                        contacts.length,

                    contacts:
                        contacts

                });

            }


            // ==================================================
            // TEACHER
            // ==================================================

            if (
                currentUser.role ===
                "teacher"
            ) {

                // ----------------------------------------------
                // FIND PERIODS WHERE THIS TEACHER IS ASSIGNED
                // ----------------------------------------------

                const periods =
                    await PeriodAssignment.find({

                        $or: [

                            {
                                teacher:
                                    currentUser._id
                            },

                            {
                                assistantTeacher:
                                    currentUser._id
                            }

                        ]

                    })
                    .populate(
                        "assignments.student",
                        "_id name email role grade board studentId"
                    )
                    .lean();


                // ----------------------------------------------
                // COLLECT UNIQUE MAPPED STUDENTS
                // ----------------------------------------------

                const studentMap =
                    new Map();


                periods.forEach(
                    period => {

                        if (
                            !period.assignments ||
                            !Array.isArray(
                                period.assignments
                            )
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


                // ----------------------------------------------
                // FOUNDER
                // ----------------------------------------------

                const founders =
                    await User.find({

                        role:
                            "founder"

                    })
                    .select(
                        "_id name email role"
                    )
                    .lean();


                // ----------------------------------------------
                // ADMINS
                // ----------------------------------------------

                const admins =
                    await User.find({

                        role:
                            "admin"

                    })
                    .select(
                        "_id name email role"
                    )
                    .lean();


                // ----------------------------------------------
                // COMBINE CONTACTS
                // ----------------------------------------------

                const contacts = [

                    ...founders,

                    ...admins,

                    ...Array.from(
                        studentMap.values()
                    )

                ];


                console.log(
                    "[GPA MESSENGER CONTACTS] " +
                    "Teacher contacts:",
                    contacts.length
                );


                return res.status(200).json({

                    success: true,

                    count:
                        contacts.length,

                    contacts:
                        contacts

                });

            }


            // ==================================================
            // STUDENT
            // ==================================================

            if (
                currentUser.role ===
                "student"
            ) {

                // ----------------------------------------------
                // FIND PERIODS WHERE THIS STUDENT IS ASSIGNED
                // ----------------------------------------------

                const periods =
                    await PeriodAssignment.find({

                        "assignments.student":
                            currentUser._id

                    })
                    .populate(
                        "teacher",
                        "_id name email role teacherId"
                    )
                    .populate(
                        "assistantTeacher",
                        "_id name email role teacherId"
                    )
                    .lean();


                // ----------------------------------------------
                // COLLECT UNIQUE MAPPED TEACHERS
                // ----------------------------------------------

                const teacherMap =
                    new Map();


                periods.forEach(
                    period => {

                        // --------------------------------------
                        // PRIMARY TEACHER
                        // --------------------------------------

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


                        // --------------------------------------
                        // ASSISTANT TEACHER
                        // --------------------------------------

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


                // ----------------------------------------------
                // FOUNDER
                // ----------------------------------------------

                const founders =
                    await User.find({

                        role:
                            "founder"

                    })
                    .select(
                        "_id name email role"
                    )
                    .lean();


                // ----------------------------------------------
                // ADMINS
                // ----------------------------------------------

                const admins =
                    await User.find({

                        role:
                            "admin"

                    })
                    .select(
                        "_id name email role"
                    )
                    .lean();


                // ----------------------------------------------
                // COMBINE CONTACTS
                // ----------------------------------------------

                const contacts = [

                    ...founders,

                    ...admins,

                    ...Array.from(
                        teacherMap.values()
                    )

                ];


                console.log(
                    "[GPA MESSENGER CONTACTS] " +
                    "Student contacts:",
                    contacts.length
                );


                return res.status(200).json({

                    success: true,

                    count:
                        contacts.length,

                    contacts:
                        contacts

                });

            }


            // ==================================================
            // UNKNOWN ROLE
            // ==================================================

            return res.status(403).json({

                success: false,

                message:
                    "Messenger access denied for this role."

            });

        }
        catch (error) {

            console.error(
                "[GPA MESSENGER CONTACTS API] " +
                "Failed to load contacts:",
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


module.exports =
    router;