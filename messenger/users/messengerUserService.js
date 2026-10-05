// ============================================================
// GPA MESSENGER - USER SERVICE
// ============================================================
// Purpose:
// - Find users available inside GPA Messenger
// - Apply Messenger user visibility rules
// - Reuse existing Academy Teacher-Student mapping
// - Return only safe Messenger user information
//
// IMPORTANT:
// - No UI code
// - No Socket.IO code
// - No phone numbers
// - No password
// - No duplicate mapping system
// - Backend remains responsible for access control
// ============================================================

const User = require("../../models/User");

const TeacherStudentMap =
    require("../../models/TeacherStudentMap");

const {
    isMessengerRole
} = require("../permissions/messengerPermission");


// ============================================================
// SAFE USER DATA
// ============================================================

function getSafeUser(user) {

    if (!user) {
        return null;
    }

    return {
        _id: user._id,
        name: user.name,
        role: user.role,
        studentId: user.studentId || null,
        teacherId: user.teacherId || null,
        adminId: user.adminId || null
    };

}


// ============================================================
// GET USERS AVAILABLE TO A MESSENGER USER
// ============================================================

async function getMessengerUsers(currentUserId) {

    if (!currentUserId) {

        throw new Error(
            "Messenger user ID is required."
        );

    }


    // ========================================================
    // CURRENT USER
    // ========================================================

    const currentUser =
        await User.findById(
            currentUserId
        ).select(
            "_id name role studentId teacherId adminId"
        );


    if (!currentUser) {

        throw new Error(
            "Messenger user not found."
        );

    }


    if (!isMessengerRole(currentUser.role)) {

        throw new Error(
            "User role is not allowed to use Messenger."
        );

    }


    // ========================================================
    // FOUNDER
    // ========================================================
    //
    // Founder can see:
    // - Admins
    // - Teachers
    // - Students
    //
    // Founder is not included in own list.
    // ========================================================

    if (currentUser.role === "founder") {

        const users =
            await User.find({

                role: {
                    $in: [
                        "admin",
                        "teacher",
                        "student"
                    ]
                }

            })
            .select(
                "_id name role studentId teacherId adminId"
            )
            .sort({
                name: 1
            });


        return users
            .map(getSafeUser)
            .filter(Boolean);

    }


    // ========================================================
    // ADMIN
    // ========================================================
    //
    // Admin can see:
    // - Founder
    // - Other Admins
    // - Teachers
    // - Students
    //
    // Current admin is excluded.
    // ========================================================

    if (currentUser.role === "admin") {

        const users =
            await User.find({

                _id: {
                    $ne: currentUser._id
                },

                role: {
                    $in: [
                        "founder",
                        "admin",
                        "teacher",
                        "student"
                    ]
                }

            })
            .select(
                "_id name role studentId teacherId adminId"
            )
            .sort({
                name: 1
            });


        return users
            .map(getSafeUser)
            .filter(Boolean);

    }


    // ========================================================
    // TEACHER
    // ========================================================
    //
    // Teacher can see:
    // - Founder
    // - Admin
    // - Mapped Students
    // - Mapped Teachers
    //
    // Existing TeacherStudentMap is used.
    // ========================================================

    if (currentUser.role === "teacher") {

        // ----------------------------------------------------
        // Find students directly mapped to this teacher
        // ----------------------------------------------------

        const mappings =
            await TeacherStudentMap.find({

                teacher: currentUser._id

            }).select(
                "student"
            );


        const studentIds =
            mappings
                .map(mapping => mapping.student)
                .filter(Boolean);


        // ----------------------------------------------------
        // Find other teachers who are also mapped to
        // those same students.
        //
        // This does NOT create a new mapping system.
        // It uses the existing Academy mapping.
        // ----------------------------------------------------

        let mappedTeacherIds = [];


        if (studentIds.length > 0) {

            const teacherMappings =
                await TeacherStudentMap.find({

                    student: {
                        $in: studentIds
                    }

                }).select(
                    "teacher"
                );


            mappedTeacherIds =
                teacherMappings
                    .map(mapping => mapping.teacher)
                    .filter(Boolean);

        }


        // ----------------------------------------------------
        // Remove current teacher
        // ----------------------------------------------------

        mappedTeacherIds =
            mappedTeacherIds.filter(

                teacherId =>
                    teacherId.toString() !==
                    currentUser._id.toString()

            );


        // ----------------------------------------------------
        // Get allowed users
        // ----------------------------------------------------

        const users =
            await User.find({

                $or: [

                    // Founder
                    {
                        role: "founder"
                    },

                    // Admin
                    {
                        role: "admin"
                    },

                    // Mapped Students
                    {
                        _id: {
                            $in: studentIds
                        },

                        role: "student"
                    },

                    // Teachers sharing mapped students
                    {
                        _id: {
                            $in: mappedTeacherIds
                        },

                        role: "teacher"
                    }

                ]

            })
            .select(
                "_id name role studentId teacherId adminId"
            )
            .sort({
                name: 1
            });


        return users
            .map(getSafeUser)
            .filter(Boolean);

    }


    // ========================================================
    // STUDENT
    // ========================================================
    //
    // Student can see:
    // - Founder
    // - Admin
    // - Mapped Teacher(s)
    //
    // No unrelated teachers.
    // ========================================================

    if (currentUser.role === "student") {

        // ----------------------------------------------------
        // Find teachers mapped to this student
        // ----------------------------------------------------

        const mappings =
            await TeacherStudentMap.find({

                student: currentUser._id

            }).select(
                "teacher"
            );


        const teacherIds =
            mappings
                .map(mapping => mapping.teacher)
                .filter(Boolean);


        // ----------------------------------------------------
        // Get allowed users
        // ----------------------------------------------------

        const users =
            await User.find({

                $or: [

                    // Founder
                    {
                        role: "founder"
                    },

                    // Admin
                    {
                        role: "admin"
                    },

                    // Mapped Teachers
                    {
                        _id: {
                            $in: teacherIds
                        },

                        role: "teacher"
                    }

                ]

            })
            .select(
                "_id name role studentId teacherId adminId"
            )
            .sort({
                name: 1
            });


        return users
            .map(getSafeUser)
            .filter(Boolean);

    }


    // ========================================================
    // FALLBACK
    // ========================================================

    return [];

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    getMessengerUsers,

    getSafeUser

};


// ============================================================
// END GPA MESSENGER USER SERVICE
// ============================================================