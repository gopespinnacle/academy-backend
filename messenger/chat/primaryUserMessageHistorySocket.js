/**
 * ============================================================
 * GPA MESSENGER
 * MODULE 4
 * PRIMARY USER MESSAGE HISTORY SOCKET
 * ============================================================
 *
 * PURPOSE:
 *
 * Load previously saved Primary User messages
 * from MongoDB when requested by the frontend.
 *
 * THIS MODULE ONLY HANDLES MESSAGE HISTORY.
 *
 * It does NOT:
 *
 * - send new messages
 * - save new messages
 * - handle receivers
 * - handle notifications
 * - handle calls
 * - handle attachments
 *
 * ============================================================
 */


const PrimaryUserMessage =
    require("./primaryUserMessage");



class PrimaryUserMessageHistorySocket {


    // ============================================================
    // INITIALIZE
    // ============================================================

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


        // --------------------------------------------------------
        // SOCKET CONNECTION
        // --------------------------------------------------------

        io.on(
            "connection",
            (socket) => {


                // ------------------------------------------------
                // LOAD PRIMARY USER MESSAGE HISTORY
                // ------------------------------------------------

                socket.on(
                    "gpa:primary:message:history",
                    async () => {


                        console.log(
                            "[GPA PRIMARY MESSAGE HISTORY] " +
                            "History requested by Primary User."
                        );


                        try {


                            // ------------------------------------
                            // GET SAVED MESSAGES
                            // ------------------------------------

                            const messages =
                                await PrimaryUserMessage
                                    .find({})
                                    .sort({
                                        sentAt: 1
                                    })
                                    .lean();


                            // ------------------------------------
                            // SEND HISTORY TO SAME USER
                            // ------------------------------------

                            socket.emit(
                                "gpa:primary:message:history:received",
                                messages
                            );


                            console.log(
                                "[GPA PRIMARY MESSAGE HISTORY] " +
                                "History sent:",
                                messages.length,
                                "messages."
                            );


                        } catch (error) {


                            console.error(
                                "[GPA PRIMARY MESSAGE HISTORY] " +
                                "Failed to load history:",
                                error
                            );


                            socket.emit(
                                "gpa:primary:message:history:error",
                                {
                                    message:
                                        "Unable to load message history."
                                }
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