/**
 * ============================================================
 * GPA MESSENGER
 * PRIMARY USER MESSAGE HISTORY SOCKET
 * ============================================================
 */

const PrimaryUserMessage =
    require("./primaryUserMessage");

class PrimaryUserMessageHistorySocket {

    initialize(io) {

        if (!io) {
            throw new Error(
                "[GPA PRIMARY MESSAGE HISTORY] " +
                "Socket.IO instance is required."
            );
        }

        console.log(
            "[GPA PRIMARY MESSAGE HISTORY] " +
            "Module initialized."
        );

        io.on(
            "connection",
            (socket) => {

                console.log(
                    "[GPA PRIMARY MESSAGE HISTORY] " +
                    "Socket connected:",
                    socket.id
                );

                // ====================================================
                // LOAD MESSAGE HISTORY FOR ONE CONVERSATION
                // ====================================================

                socket.on(
                    "gpa:primary:message:history",
                    async (data) => {

                        try {

                            console.log(
                                "[GPA PRIMARY MESSAGE HISTORY] " +
                                "History request received:",
                                data
                            );

                            if (
                                !data ||
                                !data.conversationId
                            ) {

                                console.warn(
                                    "[GPA PRIMARY MESSAGE HISTORY] " +
                                    "conversationId is required."
                                );

                                socket.emit(
                                    "gpa:primary:message:history:received",
                                    []
                                );

                                return;
                            }

                            const messages =
                                await PrimaryUserMessage
                                    .find({
                                        conversationId:
                                            data.conversationId
                                    })
                                    .sort({
                                        sentAt: 1
                                    })
                                    .lean();

                            console.log(
                                "[GPA PRIMARY MESSAGE HISTORY] " +
                                "Conversation:",
                                data.conversationId
                            );

                            console.log(
                                "[GPA PRIMARY MESSAGE HISTORY] " +
                                "Messages loaded:",
                                messages.length
                            );

                            socket.emit(
                                "gpa:primary:message:history:received",
                                messages
                            );

                        } catch (error) {

                            console.error(
                                "[GPA PRIMARY MESSAGE HISTORY] " +
                                "Failed to load history:",
                                error
                            );

                            socket.emit(
                                "gpa:primary:message:history:received",
                                []
                            );

                        }

                    }
                );

            }
        );

    }

}

module.exports =
    new PrimaryUserMessageHistorySocket();