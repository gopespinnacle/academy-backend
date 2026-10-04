/**
 * ============================================================
 * GPA MESSENGER
 * WebRTC Configuration Module
 * ============================================================
 *
 * IMPORTANT:
 *
 * This backend module does NOT create an RTCPeerConnection.
 *
 * Actual WebRTC audio processing happens on:
 *
 * 1. GPA Web Messenger
 * 2. GPA Android Messenger
 *
 * This module provides the STUN + TURN configuration
 * required by those clients.
 *
 * Socket.IO signaling remains separate.
 *
 * ============================================================
 */

class MessengerCallWebRTC {

    constructor() {
        this.initialized = false;
        this.iceServers = [];
    }

    /**
     * Initialize WebRTC configuration.
     */
    initialize() {

        if (this.initialized) {
            console.log(
                "[GPA WEBRTC] WebRTC module already initialized."
            );

            return this;
        }

        console.log(
            "[GPA WEBRTC] Initializing WebRTC configuration..."
        );

        this.iceServers = this.buildIceServers();

        this.initialized = true;

        console.log(
            "[GPA WEBRTC] WebRTC configuration initialized."
        );

        return this;
    }

    /**
     * Build STUN + TURN server configuration.
     *
     * TURN credentials are read from environment variables.
     */
    buildIceServers() {

        const servers = [];

        /*
         * ------------------------------------------------------
         * STUN
         * ------------------------------------------------------
         *
         * Used for discovering the public network path.
         */

        const stunUrl =
            process.env.MESSENGER_STUN_URL ||
            "stun:stun.l.google.com:19302";

        servers.push({
            urls: stunUrl
        });

        /*
         * ------------------------------------------------------
         * TURN
         * ------------------------------------------------------
         *
         * TURN is required when direct peer-to-peer
         * connection is not possible.
         */

        if (
            process.env.MESSENGER_TURN_URL &&
            process.env.MESSENGER_TURN_USERNAME &&
            process.env.MESSENGER_TURN_CREDENTIAL
        ) {

            servers.push({
                urls: process.env.MESSENGER_TURN_URL,
                username: process.env.MESSENGER_TURN_USERNAME,
                credential: process.env.MESSENGER_TURN_CREDENTIAL
            });

            console.log(
                "[GPA WEBRTC] TURN server configured."
            );

        } else {

            console.log(
                "[GPA WEBRTC] TURN server credentials not configured yet."
            );

        }

        return servers;
    }

    /**
     * Return WebRTC ICE configuration.
     *
     * Credentials are intentionally returned only
     * when they are configured.
     */
    getIceServers() {

        if (!this.initialized) {
            this.initialize();
        }

        return this.iceServers;
    }

    /**
     * Return a client-safe WebRTC configuration.
     */
    getClientConfiguration() {

        return {
            iceServers: this.getIceServers()
        };
    }

    /**
     * Check whether WebRTC configuration is initialized.
     */
    isInitialized() {

        return this.initialized;
    }
}

module.exports = new MessengerCallWebRTC();