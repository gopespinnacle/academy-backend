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
const TeacherStudentMap = require("../../models/TeacherStudentMap");

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
    // LOAD CURRENT USER
    // ========================================================

    const currentUser = await User.findById(
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

    if (currentUser.role === "founder") {

        const users = await User.find({

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

    if (currentUser.role === "admin") {

        const users = await User.find({

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
//
// Existing TeacherStudentMap is the
// authoritative Academy mapping.
// ========================================================

if (currentUser.role === "teacher") {

    // ----------------------------------------------------
    // Get this teacher's existing Academy mappings
    // ----------------------------------------------------

    const mappings = await TeacherStudentMap.find({
        teacher: currentUser._id
    }).select(
        "student"
    );


    // ----------------------------------------------------
    // Extract mapped student IDs
    // ----------------------------------------------------

    const studentIds = mappings
        .map(mapping => mapping.student)
        .filter(Boolean);


    console.log(
        "[GPA MESSENGER USER SERVICE] Teacher mapping:",
        {
            teacherId: currentUser._id.toString(),
            teacherName: currentUser.name,
            mappedStudentCount: studentIds.length,
            mappedStudentIds:
                studentIds.map(id => id.toString())
        }
    );


    // ----------------------------------------------------
    // Get ONLY:
    // Founder
    // Admin
    // Mapped Students
    // ----------------------------------------------------

    const users = await User.find({

        $or: [

            // Founder
            {
                role: "founder"
            },

            // Admin
            {
                role: "admin"
            },

            // This teacher's mapped students ONLY
            {
                _id: {
                    $in: studentIds
                },
                role: "student"
            }

        ]

    })
    .select(
        "_id name role studentId teacherId adminId"
    )
    .sort({
        name: 1
    });


    console.log(
        "[GPA MESSENGER USER SERVICE] Teacher users returned:",
        {
            teacherName: currentUser.name,
            totalUsers: users.length,
            studentsReturned:
                users.filter(
                    user => user.role === "student"
                ).length
        }
    );


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
    // Existing TeacherStudentMap remains the
    // authoritative mapping source.
    // ========================================================

    if (currentUser.role === "student") {

        const mappings = await TeacherStudentMap.find({

            student: currentUser._id

        }).select(
            "teacher"
        );
              


        const users = await User.find({

            $or: [

                // Founder
                {
                    role: "founder"
                },

                // Admin
                {
                    role: "admin"
                },

                // Mapped teachers
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