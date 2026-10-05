// ============================================================
// GPA MESSENGER - USER SERVICE
// ============================================================
// Purpose:
// - Find users available inside GPA Messenger
// - Apply Messenger visibility rules
// - Reuse EXISTING Academy PeriodAssignment system
// - Return only safe Messenger user information
//
// IMPORTANT:
// - No UI code
// - No Socket.IO code
// - No phone numbers
// - No password
// - No duplicate mapping system
// ============================================================

const User = require("../../models/User");
const PeriodAssignment = require("../../models/PeriodAssignment");

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
// GET USERS AVAILABLE TO MESSENGER USER
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

    const currentUser =
        await User.findById(currentUserId)
            .select(
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
    //
    // 1. Founder
    // 2. Admin
    // 3. Students assigned to this teacher
    //
    // IMPORTANT:
    // The EXISTING Academy PeriodAssignment system is used.
    //
    // This is the same system used by:
    //
    // /api/teacher/all-period-assignments
    //
    // Therefore Messenger and "My Students" use the
    // SAME source of truth.
    // ========================================================

    if (currentUser.role === "teacher") {

        // ----------------------------------------------------
        // Find all periods belonging to this teacher
        // ----------------------------------------------------

        const periods =
            await PeriodAssignment.find({

                teacher: currentUser._id

            })
            .populate(
                "assignments.student",
                "name studentId"
            );


        // ----------------------------------------------------
        // Collect unique student IDs
        // ----------------------------------------------------

        const studentIdSet = new Set();


        periods.forEach(period => {

            if (
                !period.assignments ||
                !Array.isArray(period.assignments)
            ) {
                return;
            }


            period.assignments.forEach(assignment => {

                const student =
                    assignment.student;


                if (!student || !student._id) {
                    return;
                }


                studentIdSet.add(
                    String(student._id)
                );

            });

        });


        const studentIds =
            Array.from(studentIdSet);


        // ----------------------------------------------------
        // Load Founder + Admin + mapped students
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

                    // Students assigned through
                    // existing PeriodAssignment system
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
            "[GPA MESSENGER USER SERVICE] Teacher:",
            currentUser.name
        );

        console.log(
            "[GPA MESSENGER USER SERVICE] Periods found:",
            periods.length
        );

        console.log(
            "[GPA MESSENGER USER SERVICE] Students found:",
            studentIds.length
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
    // - Teachers who are assigned to the student
    //
    // We again use the EXISTING PeriodAssignment system.
    // ========================================================

    if (currentUser.role === "student") {

        // ----------------------------------------------------
        // Find PeriodAssignments containing this student
        // ----------------------------------------------------

        const periods =
            await PeriodAssignment.find({

                "assignments.student":
                    currentUser._id

            })
            .select(
                "teacher"
            );


        // ----------------------------------------------------
        // Collect teacher IDs
        // ----------------------------------------------------

        const teacherIdSet = new Set();


        periods.forEach(period => {

            if (!period.teacher) {
                return;
            }


            teacherIdSet.add(
                String(period.teacher)
            );

        });


        const teacherIds =
            Array.from(teacherIdSet);


        // ----------------------------------------------------
        // Load Founder + Admin + mapped teachers
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

                    // Teachers assigned through
                    // existing PeriodAssignment system
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