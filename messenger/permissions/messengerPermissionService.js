/**
 * ============================================================
 * GPA MESSENGER
 * Permission Service
 * ============================================================
 *
 * This file answers:
 *
 * "Can THIS USER perform THIS ACTION with THAT USER?"
 *
 * IMPORTANT:
 *
 * - Uses the existing User model.
 * - Uses the existing TeacherStudentMap model.
 * - Does NOT create a new mapping system.
 * - Does NOT handle HTTP requests.
 * - Does NOT handle Socket.IO.
 * - Does NOT handle Chat.
 * - Does NOT handle Calling itself.
 *
 * ============================================================
 */

const User =
    require("../../models/User");

const TeacherStudentMap =
    require("../../models/TeacherStudentMap");

const {
    MESSENGER_ROLES,
    MESSENGER_FEATURES,
    canUseFeature,
    isMessengerRole
} =
    require("./messengerPermission");


/**
 * ============================================================
 * BASIC USER VALIDATION
 * ============================================================
 */

function isValidUser(user) {

    if (!user) {
        return false;
    }

    if (!user._id) {
        return false;
    }

    if (!isMessengerRole(user.role)) {
        return false;
    }

    return true;
}


/**
 * ============================================================
 * SAME USER CHECK
 * ============================================================
 */

function isSameUser(userA, userB) {

    if (!userA || !userB) {
        return false;
    }

    return String(userA._id) === String(userB._id);
}


/**
 * ============================================================
 * TEACHER ↔ STUDENT MAPPING
 * ============================================================
 *
 * This uses the EXISTING Academy mapping model.
 *
 * We intentionally do NOT create another mapping collection.
 *
 * The existing TeacherStudentMap represents:
 *
 * Teacher
 *    ↕
 * Student
 *
 * with subjects/languages/ECA information.
 * ============================================================
 */

async function areTeacherAndStudentMapped(
    teacherId,
    studentId
) {

    if (!teacherId || !studentId) {
        return false;
    }

    const mapping =
        await TeacherStudentMap.findOne({

            teacher: teacherId,

            student: studentId

        }).select("_id");

    return !!mapping;
}


/**
 * ============================================================
 * USER-TO-USER MAPPING CHECK
 * ============================================================
 *
 * Returns true only when the two users have an Academy
 * teacher ↔ student relationship.
 *
 * Direction is handled automatically.
 * ============================================================
 */

async function areUsersMapped(
    userA,
    userB
) {

    if (!isValidUser(userA)) {
        return false;
    }

    if (!isValidUser(userB)) {
        return false;
    }


    /*
     * Teacher → Student
     */

    if (
        userA.role === MESSENGER_ROLES.TEACHER &&
        userB.role === MESSENGER_ROLES.STUDENT
    ) {

        return await areTeacherAndStudentMapped(
            userA._id,
            userB._id
        );
    }


    /*
     * Student → Teacher
     */

    if (
        userA.role === MESSENGER_ROLES.STUDENT &&
        userB.role === MESSENGER_ROLES.TEACHER
    ) {

        return await areTeacherAndStudentMapped(
            userB._id,
            userA._id
        );
    }


    /*
     * Teacher ↔ Teacher
     *
     * The supplied Academy mapping model does not define
     * teacher-to-teacher mapping.
     *
     * Therefore we DO NOT invent a new rule here.
     */

    if (
        userA.role === MESSENGER_ROLES.TEACHER &&
        userB.role === MESSENGER_ROLES.TEACHER
    ) {

        return false;
    }


    /*
     * Student ↔ Student
     *
     * Students are not mapped directly to other students.
     */

    if (
        userA.role === MESSENGER_ROLES.STUDENT &&
        userB.role === MESSENGER_ROLES.STUDENT
    ) {

        return false;
    }


    return false;
}


/**
 * ============================================================
 * CHAT PERMISSION
 * ============================================================
 *
 * Rules:
 *
 * Founder
 *   → everyone
 *
 * Admin
 *   → everyone
 *
 * Teacher
 *   → mapped students
 *   → Founder
 *   → Admin
 *
 * Student
 *   → mapped teacher(s)
 *   → Founder
 *   → Admin
 *
 * Self-chat is not allowed.
 * ============================================================
 */

async function canChat(
    currentUser,
    targetUser
) {

    if (!isValidUser(currentUser)) {
        return false;
    }

    if (!isValidUser(targetUser)) {
        return false;
    }

    /*
     * A user cannot start a Messenger conversation
     * with themselves.
     */

    if (isSameUser(currentUser, targetUser)) {
        return false;
    }


    /*
     * The role itself must be allowed to use Chat.
     */

    if (
        !canUseFeature(
            currentUser.role,
            MESSENGER_FEATURES.CHAT
        )
    ) {

        return false;
    }


    /*
     * Founder
     *
     * Founder can chat with everyone.
     */

    if (
        currentUser.role ===
        MESSENGER_ROLES.FOUNDER
    ) {

        return true;
    }


    /*
     * Admin
     *
     * Admin can chat with everyone.
     */

    if (
        currentUser.role ===
        MESSENGER_ROLES.ADMIN
    ) {

        return true;
    }


    /*
     * Teacher
     */

    if (
        currentUser.role ===
        MESSENGER_ROLES.TEACHER
    ) {

        /*
         * Teacher → Founder
         */

        if (
            targetUser.role ===
            MESSENGER_ROLES.FOUNDER
        ) {

            return true;
        }


        /*
         * Teacher → Admin
         */

        if (
            targetUser.role ===
            MESSENGER_ROLES.ADMIN
        ) {

            return true;
        }


        /*
         * Teacher → mapped Student
         */

        if (
            targetUser.role ===
            MESSENGER_ROLES.STUDENT
        ) {

            return await areUsersMapped(
                currentUser,
                targetUser
            );
        }


        /*
         * Teacher → unrelated Teacher
         *
         * No teacher-to-teacher mapping is defined
         * in the supplied Academy mapping model.
         */

        return false;
    }


    /*
     * Student
     */

    if (
        currentUser.role ===
        MESSENGER_ROLES.STUDENT
    ) {

        /*
         * Student → Founder
         */

        if (
            targetUser.role ===
            MESSENGER_ROLES.FOUNDER
        ) {

            return true;
        }


        /*
         * Student → Admin
         */

        if (
            targetUser.role ===
            MESSENGER_ROLES.ADMIN
        ) {

            return true;
        }


        /*
         * Student → mapped Teacher
         */

        if (
            targetUser.role ===
            MESSENGER_ROLES.TEACHER
        ) {

            return await areUsersMapped(
                currentUser,
                targetUser
            );
        }


        /*
         * Student → Student
         */

        return false;
    }


    return false;
}


/**
 * ============================================================
 * AUDIO CALL PERMISSION
 * ============================================================
 *
 * Only:
 *
 * Founder → Teacher
 * Founder → Student
 *
 * Admin → Teacher
 * Admin → Student
 *
 * Teachers and Students cannot initiate calls.
 *
 * Video calling is NOT part of GPA Messenger.
 * ============================================================
 */

async function canAudioCall(
    currentUser,
    targetUser
) {

    if (!isValidUser(currentUser)) {
        return false;
    }

    if (!isValidUser(targetUser)) {
        return false;
    }

    if (isSameUser(currentUser, targetUser)) {
        return false;
    }


    /*
     * Role-level audio-call permission.
     */

    if (
        !canUseFeature(
            currentUser.role,
            MESSENGER_FEATURES.AUDIO_CALL
        )
    ) {

        return false;
    }


    /*
     * Target must be Teacher or Student.
     */

    const targetIsAllowed =
        targetUser.role ===
            MESSENGER_ROLES.TEACHER ||

        targetUser.role ===
            MESSENGER_ROLES.STUDENT;


    if (!targetIsAllowed) {
        return false;
    }


    /*
     * Founder → Teacher / Student
     */

    if (
        currentUser.role ===
        MESSENGER_ROLES.FOUNDER
    ) {

        return true;
    }


    /*
     * Admin → Teacher / Student
     */

    if (
        currentUser.role ===
        MESSENGER_ROLES.ADMIN
    ) {

        return true;
    }


    return false;
}


/**
 * ============================================================
 * VIDEO CALL PERMISSION
 * ============================================================
 *
 * Always false.
 *
 * GPA Messenger is AUDIO ONLY.
 * ============================================================
 */

function canVideoCall() {

    return false;
}


/**
 * ============================================================
 * MONITORING PERMISSION
 * ============================================================
 *
 * Founder only.
 * ============================================================
 */

function canMonitor(
    currentUser
) {

    if (!isValidUser(currentUser)) {
        return false;
    }

    return canUseFeature(
        currentUser.role,
        MESSENGER_FEATURES.MONITORING
    );
}


/**
 * ============================================================
 * PHONE NUMBER ACCESS
 * ============================================================
 *
 * Messenger users must never receive phone numbers.
 * ============================================================
 */

function canSeePhoneNumber() {

    return false;
}


/**
 * ============================================================
 * GET SAFE USER PROFILE
 * ============================================================
 *
 * This function is intentionally designed to prevent
 * Messenger from accidentally exposing private fields.
 *
 * Phone number is NEVER returned.
 *
 * Password is NEVER returned.
 *
 * Login credentials are NEVER returned.
 * ============================================================
 */

function getSafeMessengerUser(user) {

    if (!user) {
        return null;
    }

    return {

        id: user._id,

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


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {

    isValidUser,

    isSameUser,

    areTeacherAndStudentMapped,

    areUsersMapped,

    canChat,

    canAudioCall,

    canVideoCall,

    canMonitor,

    canSeePhoneNumber,

    getSafeMessengerUser

};