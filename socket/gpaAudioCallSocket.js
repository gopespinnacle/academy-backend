
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendPushNotification } =
    require("../services/fcmService");
let activeCallLookup = () => null;
function initialize(io) {
  const audioNamespace = io.of("/gpa-audio-call");

  // Active calls are kept in memory for this initial version.
  const activeCalls = new Map();
  const userActiveCalls = new Map();


    activeCallLookup = (callId, userId) => {
    const call = activeCalls.get(String(callId));

    if (
        !call ||
        call.status !== "active" ||
        (
            call.callerId !== String(userId) &&
            call.recipientId !== String(userId)
        )
    ) {
        return null;
    }

    return {
        callId: call.callId,
        roomName: `gpa-audio-${call.callId}`,
        userId: String(userId)
    };
};

  function sendError(acknowledge, message) {
    if (typeof acknowledge === "function") {
      acknowledge({ ok: false, message });
    }
  }

  function endCall(callId, reason) {
    const call = activeCalls.get(callId);
    if (!call) return;

    activeCalls.delete(callId);
    userActiveCalls.delete(call.callerId);
    userActiveCalls.delete(call.recipientId);

    audioNamespace.to(`user:${call.callerId}`).emit("call:ended", {
      callId,
      reason
    });

    audioNamespace.to(`user:${call.recipientId}`).emit("call:ended", {
      callId,
      reason
    });
  }

  // Authenticate GPA Audio Call connections independently.
  audioNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("User not found."));
      }

      socket.user = {
        id: String(user._id),
        name: user.name || "User",
        role: user.role
      };

      next();
    } catch (error) {
      next(new Error("GPA Audio Call authentication failed."));
    }
  });

  audioNamespace.on("connection", (socket) => {
    const userId = socket.user.id;

    socket.join(`user:${userId}`);

    console.log("GPA Audio Call connected:", userId);

    // Recover a ringing call when the recipient reconnects.
socket.on("call:check-pending", async (acknowledge) => {
    try {
        const callId = userActiveCalls.get(userId);
        const call = callId ? activeCalls.get(callId) : null;

        if (
            !call ||
            call.status !== "ringing" ||
            call.recipientId !== userId
        ) {
            if (typeof acknowledge === "function") {
                acknowledge({ ok: true, pending: false });
            }
            return;
        }

        const caller = await User.findById(call.callerId)
            .select("name role")
            .lean();

        if (!caller) {
            if (typeof acknowledge === "function") {
                acknowledge({ ok: true, pending: false });
            }
            return;
        }

        const incomingCall = {
            callId: call.callId,
            caller: {
                id: call.callerId,
                name: caller.name || "Academy user",
                role: caller.role
            }
        };

        socket.emit("call:incoming", incomingCall);

        if (typeof acknowledge === "function") {
            acknowledge({ ok: true, pending: true });
        }
    } catch (error) {
        console.error(
            "[GPA AUDIO CALL] Pending-call recovery error:",
            error.message
        );

        if (typeof acknowledge === "function") {
            acknowledge({ ok: false });
        }
    }
});

    // Only founders and admins can initiate calls.
    socket.on("call:invite", async (data = {}, acknowledge) => {
      try {
        if (!["founder", "admin"].includes(socket.user.role)) {
          return sendError(
            acknowledge,
            "You are not permitted to initiate calls."
          );
        }

        const recipientId = String(data.recipientId || "");

        if (!/^[a-fA-F0-9]{24}$/.test(recipientId)) {
          return sendError(acknowledge, "Invalid recipient ID.");
        }

        if (recipientId === userId) {
          return sendError(acknowledge, "You cannot call yourself.");
        }

        if (
          userActiveCalls.has(userId) ||
          userActiveCalls.has(recipientId)
        ) {
          return sendError(
            acknowledge,
            "One of the users is already in a call."
          );
        }

        const recipient = await User.findById(recipientId)
          .select("_id name role");

        if (!recipient) {
          return sendError(acknowledge, "Recipient not found.");
        }

        // Check whether the recipient is currently connected.
const recipientSockets = await audioNamespace
    .in(`user:${recipientId}`)
    .fetchSockets();

if (recipientSockets.length === 0) {
    endCall(callId, "recipient-offline");

    return sendError(
        acknowledge,
        "Recipient is offline. They must be logged in to receive calls."
    );
}

        const callId = crypto.randomUUID();

        const call = {
          callId,
          callerId: userId,
          recipientId,
          status: "ringing"
        };

        activeCalls.set(callId, call);
        userActiveCalls.set(userId, callId);
        userActiveCalls.set(recipientId, callId);

        audioNamespace.to(`user:${recipientId}`).emit("call:incoming", {
          callId,
          caller: {
            id: userId,
            name: socket.user.name,
            role: socket.user.role
          }
        });

        

        if (typeof acknowledge === "function") {
          acknowledge({
            ok: true,
            callId,
            message: "Call invitation sent."
          });
        }
      } catch (error) {
        console.error("GPA Audio Call invitation error:", error);
        sendError(acknowledge, "Unable to send call invitation.");
      }
    });

    // Only the intended recipient can accept.
    socket.on("call:accept", (data = {}, acknowledge) => {
      const call = activeCalls.get(String(data.callId || ""));

      if (
        !call ||
        call.status !== "ringing" ||
        call.recipientId !== userId
      ) {
        return sendError(acknowledge, "This call cannot be accepted.");
      }

      call.status = "active";

      audioNamespace.to(`user:${call.callerId}`).emit("call:accepted", {
        callId: call.callId,
        recipient: {
          id: userId,
          name: socket.user.name
        }
      });

      if (typeof acknowledge === "function") {
        acknowledge({ ok: true, message: "Call accepted." });
      }
    });

    // Only the intended recipient can decline.
    socket.on("call:decline", (data = {}, acknowledge) => {
      const call = activeCalls.get(String(data.callId || ""));

      if (
        !call ||
        call.status !== "ringing" ||
        call.recipientId !== userId
      ) {
        return sendError(acknowledge, "This call cannot be declined.");
      }

      endCall(call.callId, "declined");

      if (typeof acknowledge === "function") {
        acknowledge({ ok: true, message: "Call declined." });
      }
    });

    // Relay WebRTC messages only between the two participants
    // of an accepted call.
    socket.on("call:signal", (data = {}, acknowledge) => {
      const call = activeCalls.get(String(data.callId || ""));

      if (!call || call.status !== "active") {
        return sendError(acknowledge, "No active call found.");
      }

      const isParticipant =
        call.callerId === userId || call.recipientId === userId;

      if (!isParticipant) {
        return sendError(acknowledge, "You are not part of this call.");
      }

      const expectedRecipient =
        call.callerId === userId
          ? call.recipientId
          : call.callerId;

      if (
        String(data.recipientId || "") !== expectedRecipient ||
        !data.signal ||
        typeof data.signal !== "object" ||
        Array.isArray(data.signal)
      ) {
        return sendError(acknowledge, "Invalid signaling message.");
      }

      audioNamespace.to(`user:${expectedRecipient}`).emit("call:signal", {
        callId: call.callId,
        senderId: userId,
        signal: data.signal
      });

      if (typeof acknowledge === "function") {
        acknowledge({ ok: true });
      }
    });

    
    // Coordinate LiveKit fallback for both participants.
    socket.on("call:fallback-request", (data = {}, acknowledge) => {
        const call = activeCalls.get(String(data.callId || ""));

        if (
            !call ||
            call.status !== "active" ||
            (call.callerId !== userId && call.recipientId !== userId)
        ) {
            return sendError(acknowledge, "No active call found for fallback.");
        }

        const fallbackData = {
            callId: call.callId,
            roomName: `gpa-audio-${call.callId}`
        };

        // Notify both participants so they join the same LiveKit room.
        audioNamespace.to(`user:${call.callerId}`).emit(
            "call:fallback",
            fallbackData
        );

        audioNamespace.to(`user:${call.recipientId}`).emit(
            "call:fallback",
            fallbackData
        );

        if (typeof acknowledge === "function") {
            acknowledge({ ok: true });
        }
    });


    // Either participant can end an existing call.
    socket.on("call:end", (data = {}, acknowledge) => {
      const call = activeCalls.get(String(data.callId || ""));

      if (
        !call ||
        (call.callerId !== userId && call.recipientId !== userId)
      ) {
        return sendError(acknowledge, "Call not found.");
      }

      endCall(call.callId, "ended");

      if (typeof acknowledge === "function") {
        acknowledge({ ok: true });
      }
    });

    socket.on("disconnect", () => {
    const callId = userActiveCalls.get(userId);
    const call = callId ? activeCalls.get(callId) : null;

    if (call) {
        // Preserve an unanswered call when its recipient disconnects.
        if (
            call.status === "ringing" &&
            call.recipientId === userId
        ) {
            console.log(
                "[GPA AUDIO CALL] Recipient disconnected; preserving ringing call:",
                call.callId
            );
        } else {
            endCall(callId, "connection-lost");
        }
    }

    console.log("GPA Audio Call disconnected:", userId);
});
  });
}

module.exports = {
    initialize,

    getActiveCallForUser: (...args) =>
        activeCallLookup(...args)
};
