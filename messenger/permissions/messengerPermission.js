/**
 * ============================================================
 * GPA MESSENGER
 * Permission Definitions
 * ============================================================
 *
 * This file contains ONLY Messenger permission definitions.
 *
 * It does NOT:
 *
 * - Query MongoDB
 * - Authenticate users
 * - Handle HTTP requests
 * - Handle Socket.IO
 * - Handle chat messages
 * - Handle calls
 *
 * Those responsibilities belong to other modules.
 *
 * ============================================================
 */

const MESSENGER_ROLES = Object.freeze({

    FOUNDER: "founder",

    ADMIN: "admin",

    TEACHER: "teacher",

    STUDENT: "student"

});


/**
 * ============================================================
 * MESSENGER FEATURES
 * ============================================================
 */

const MESSENGER_FEATURES = Object.freeze({

    CHAT: "chat",

    AUDIO_CALL: "audioCall",

    VIDEO_CALL: "videoCall",

    MONITORING: "monitoring",

    PHONE_NUMBER: "phoneNumber"

});


/**
 * ============================================================
 * ROLE CAPABILITIES
 * ============================================================
 *
 * These are the high-level Messenger capabilities.
 *
 * Actual user-to-user access is checked separately by
 * messengerPermissionService.js.
 */

const MESSENGER_ROLE_CAPABILITIES = Object.freeze({

    founder: Object.freeze({

        canChat: true,

        canAudioCall: true,

        canVideoCall: false,

        canMonitor: true,

        canSeePhoneNumber: false

    }),

    admin: Object.freeze({

        canChat: true,

        canAudioCall: true,

        canVideoCall: false,

        canMonitor: false,

        canSeePhoneNumber: false

    }),

    teacher: Object.freeze({

        canChat: true,

        canAudioCall: false,

        canVideoCall: false,

        canMonitor: false,

        canSeePhoneNumber: false

    }),

    student: Object.freeze({

        canChat: true,

        canAudioCall: false,

        canVideoCall: false,

        canMonitor: false,

        canSeePhoneNumber: false

    })

});


/**
 * ============================================================
 * FEATURE ACCESS
 * ============================================================
 *
 * Returns whether a role is allowed to use a Messenger feature.
 *
 * This is only the role-level check.
 *
 * It does NOT decide whether a particular user can contact
 * another particular user.
 */

function canUseFeature(role, feature) {

    const capabilities =
        MESSENGER_ROLE_CAPABILITIES[role];

    if (!capabilities) {

        return false;
    }

    switch (feature) {

        case MESSENGER_FEATURES.CHAT:

            return capabilities.canChat;


        case MESSENGER_FEATURES.AUDIO_CALL:

            return capabilities.canAudioCall;


        case MESSENGER_FEATURES.VIDEO_CALL:

            return capabilities.canVideoCall;


        case MESSENGER_FEATURES.MONITORING:

            return capabilities.canMonitor;


        case MESSENGER_FEATURES.PHONE_NUMBER:

            return capabilities.canSeePhoneNumber;


        default:

            return false;
    }
}


/**
 * ============================================================
 * ROLE VALIDATION
 * ============================================================
 */

function isMessengerRole(role) {

    return Object.values(
        MESSENGER_ROLES
    ).includes(role);

}


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {

    MESSENGER_ROLES,

    MESSENGER_FEATURES,

    MESSENGER_ROLE_CAPABILITIES,

    canUseFeature,

    isMessengerRole

};