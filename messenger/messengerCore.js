/**
 * ============================================================
 * GPA MESSENGER
 * Messenger Core / Heart
 * ============================================================
 *
 * This file is the central coordinator for GPA Messenger.
 *
 * IMPORTANT:
 * - Chat logic does NOT belong here.
 * - Call logic does NOT belong here.
 * - Notification logic does NOT belong here.
 * - Permission logic does NOT belong here.
 *
 * This file only connects and initializes Messenger modules.
 *
 * ============================================================
 */

const MessengerCallSocket = require("./call/messengerCallSocket");

const MessengerCore = {
    initialized: false,

    modules: {},

    /**
     * Initialize GPA Messenger.
     *
     * Future modules will be registered here:
     *
     * Chat
     * Call
     * Notification
     * Permissions
     * Monitoring
     * Retention
     */
    initialize(options = {}) {

        if (this.initialized) {
            console.log("GPA Messenger Core already initialized.");
            return this;
        }

        console.log("========================================");
        console.log(" GPA MESSENGER CORE");
        console.log(" Initializing...");
        console.log("========================================");

        this.modules = {
            chat: null,
            call: null,
            notification: null,
            permissions: null,
            monitoring: null,
            retention: null
        };

        this.options = options;

        // Initialize Call Socket module
if (options.io) {
    MessengerCallSocket.initialize(options.io);

    this.registerModule(
        "callSocket",
        MessengerCallSocket
    );
}

        this.initialized = true;

        console.log("GPA Messenger Core initialized.");
        console.log("Modules ready for registration.");

        return this;
    },

    /**
     * Register a Messenger module.
     *
     * Example later:
     *
     * MessengerCore.registerModule("chat", ChatModule);
     */
    registerModule(name, module) {

        if (!name) {
            throw new Error("Messenger module name is required.");
        }

        if (!module) {
            throw new Error(
                `Messenger module "${name}" cannot be empty.`
            );
        }

        this.modules[name] = module;

        console.log(
            `GPA Messenger module registered: ${name}`
        );

        return module;
    },

    /**
     * Get a registered module.
     */
    getModule(name) {

        return this.modules[name] || null;
    },

    /**
     * Check whether Messenger Core is initialized.
     */
    isInitialized() {

        return this.initialized;
    }
};

module.exports = MessengerCore;