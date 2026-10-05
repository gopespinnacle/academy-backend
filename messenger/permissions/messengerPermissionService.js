// ============================================================
// GPA MESSENGER - PERMISSION SERVICE
// ============================================================
// Purpose:
// - Backend-enforced Messenger permissions
// - Controls who can chat with whom
// - Controls audio/video call permissions
// - Controls monitoring permissions
// - Controls phone-number visibility
//
// IMPORTANT:
// - This is the security layer.
// - Frontend visibility is NOT security.
// - Backend must always verify permission.
// ============================================================

const User = require("../../models/User");

const TeacherStudentMap =
    require("../../models/TeacherStudentMap");


// ============================================================
// HELPER — CONVERT ID TO STRING
// ============================================================

function normalizeId(id) {

    if (!id) {
        return null;
    }

    return String(id);

}


// ============================================================
// HELPER — CHECK SAME USER
// ============================================================

function isSameUser(userId, targetUserId) {

    const user =
        normalizeId(userId);

    const target =
        normalizeId(targetUserId);

    return (
        user &&
        target &&
        user === target
    );

}


// ============================================================
// CHAT PERMISSION
// ============================================================

async function canChat(
    userId,
    targetUserId
) {

    try {

        // ----------------------------------------------------
        // Basic validation
        // ----------------------------------------------------

        if (!userId || !targetUserId) {

            console.warn(
                "[GPA MESSENGER PERMISSION] Missing user ID."
            );

            return false;

        }


        // ----------------------------------------------------
        // Prevent self chat
        // ----------------------------------------------------

        if (
            isSameUser(
                userId,
                targetUserId
            )
        ) {

            return false;

        }


        // ----------------------------------------------------
        // Load current user
        // ----------------------------------------------------

        const user =
            await User
                .findById(userId)
                .select("_id name role");


        // ----------------------------------------------------
        // Load target user
        // ----------------------------------------------------

        const targetUser =
            await User
                .findById(targetUserId)
                .select("_id name role");


        if (!user) {

            console.warn(
                "[GPA MESSENGER PERMISSION] Current user not found:",
                userId
            );

            return false;

        }


        if (!targetUser) {

            console.warn(
                "[GPA MESSENGER PERMISSION] Target user not found:",
                targetUserId
            );

            return false;

        }


        // ----------------------------------------------------
        // Normalize roles
        // ----------------------------------------------------

        const userRole =
            String(user.role || "")
                .toLowerCase()
                .trim();


        const targetRole =
            String(targetUser.role || "")
                .toLowerCase()
                .trim();


        console.log(
            "[GPA MESSENGER PERMISSION] Chat check:",
            {
                userId: normalizeId(user._id),
                userRole,
                targetId: normalizeId(targetUser._id),
                targetRole
            }
        );


        // ====================================================
        // FOUNDER
        // ====================================================
        // Founder can chat with everyone.
        // ====================================================

        if (userRole === "founder") {

            console.log(
                "[GPA MESSENGER PERMISSION] Founder chat ALLOWED."
            );

            return true;

        }


        // ====================================================
        // ADMIN
        // ====================================================
        // Admin can chat with everyone.
        // ====================================================

        if (userRole === "admin") {

            console.log(
                "[GPA MESSENGER PERMISSION] Admin chat ALLOWED."
            );

            return true;

        }


        // ====================================================
        // TEACHER
        // ====================================================

        if (userRole === "teacher") {

            // -----------------------------------------------
            // Teacher can chat with Founder
            // -----------------------------------------------

            if (targetRole === "founder") {

                return true;

            }


            // -----------------------------------------------
            // Teacher can chat with Admin
            // -----------------------------------------------

            if (targetRole === "admin") {

                return true;

            }


            // -----------------------------------------------
            // Teacher → Student
            // Must use existing Academy mapping.
            // -----------------------------------------------

            if (targetRole === "student") {

                const mapping =
                    await TeacherStudentMap.findOne({

                        teacher: user._id,

                        student: targetUser._id

                    });


                return !!mapping;

            }


            // -----------------------------------------------
            // Teacher → unrelated Teacher
            // Not allowed unless an existing Academy
            // mapping system explicitly supports it.
            // -----------------------------------------------

            return false;

        }


        // ====================================================
        // STUDENT
        // ====================================================

        if (userRole === "student") {

            // -----------------------------------------------
            // Student can chat with Founder
            // -----------------------------------------------

            if (targetRole === "founder") {

                return true;

            }


            // -----------------------------------------------
            // Student can chat with Admin
            // -----------------------------------------------

            if (targetRole === "admin") {

                return true;

            }


            // -----------------------------------------------
            // Student → Teacher
            // Must use existing Academy mapping.
            // -----------------------------------------------

            if (targetRole === "teacher") {

                const mapping =
                    await TeacherStudentMap.findOne({

                        teacher: targetUser._id,

                        student: user._id

                    });


                return !!mapping;

            }


            // -----------------------------------------------
            // Student → Student
            // -----------------------------------------------

            return false;

        }


        // ====================================================
        // UNKNOWN ROLE
        // ====================================================

        return false;


    } catch (error) {

        console.error(
            "[GPA MESSENGER PERMISSION] canChat error:",
            error
        );

        return false;

    }

}


// ============================================================
// AUDIO CALL PERMISSION
// ============================================================

async function canAudioCall(
    userId,
    targetUserId
) {

    try {

        const user =
            await User
                .findById(userId)
                .select("_id role");


        const targetUser =
            await User
                .findById(targetUserId)
                .select("_id role");


        if (!user || !targetUser) {

            return false;

        }


        const userRole =
            String(user.role || "")
                .toLowerCase()
                .trim();


        const targetRole =
            String(targetUser.role || "")
                .toLowerCase()
                .trim();


        // Founder → Teacher / Student

        if (
            userRole === "founder" &&
            (
                targetRole === "teacher" ||
                targetRole === "student"
            )
        ) {

            return true;

        }


        // Admin → Teacher / Student

        if (
            userRole === "admin" &&
            (
                targetRole === "teacher" ||
                targetRole === "student"
            )
        ) {

            return true;

        }


        return false;


    } catch (error) {

        console.error(
            "[GPA MESSENGER PERMISSION] canAudioCall error:",
            error
        );

        return false;

    }

}


// ============================================================
// VIDEO CALL
// ============================================================
// GPA Messenger does NOT support video calling.
// ============================================================

async function canVideoCall() {

    return false;

}


// ============================================================
// FOUNDER MONITORING
// ============================================================

async function canMonitor(
    userId
) {

    try {

        const user =
            await User
                .findById(userId)
                .select("_id role");


        if (!user) {

            return false;

        }


        return (
            String(user.role || "")
                .toLowerCase()
                .trim() === "founder"
        );


    } catch (error) {

        console.error(
            "[GPA MESSENGER PERMISSION] canMonitor error:",
            error
        );

        return false;

    }

}


// ============================================================
// PHONE NUMBER
// ============================================================
// Phone numbers are NEVER exposed through Messenger.
// ============================================================

async function canSeePhoneNumber() {

    return false;

}


// ============================================================
// SAFE USER OBJECT
// ============================================================

function getSafeMessengerUser(
    user
) {

    if (!user) {

        return null;

    }


    return {

        _id: user._id,

        name: user.name,

        role: user.role,

        studentId:
            user.studentId || null,

        teacherId:
            user.teacherId || null,

        adminId:
            user.adminId || null

    };

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    canChat,

    canAudioCall,

    canVideoCall,

    canMonitor,

    canSeePhoneNumber,

    getSafeMessengerUser

};


// ============================================================
// END GPA MESSENGER PERMISSION SERVICE
// ============================================================