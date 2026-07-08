/*
===========================================================
Gopes Pinnacle Academy
Virtual Classroom V2
Meeting Socket Manager
===========================================================
*/

window.MeetingSocket = (() => {

    let socket = null;

    let connected = false;

    function connect(serverUrl) {

        if (socket) return socket;

        socket = io(serverUrl, {

            transports: ["websocket"],

            reconnection: true,

            reconnectionAttempts: Infinity,

            reconnectionDelay: 1000,

            reconnectionDelayMax: 5000,

            timeout: 20000

        });

        socket.on("connect", () => {

            connected = true;

            MeetingUtils.success(

                "Socket Connected",

                socket.id

            );

        });

        socket.on("disconnect", reason => {

            connected = false;

            MeetingUtils.warning(

                "Socket Disconnected",

                reason

            );

        });

        socket.on("reconnect", attempt => {

            connected = true;

            MeetingUtils.success(

                "Socket Reconnected",

                attempt

            );

        });

        socket.on("connect_error", err => {

            MeetingUtils.error(

                "Socket Error",

                err.message

            );

        });

        return socket;

    }

    function getSocket() {

        return socket;

    }

    function getId() {

        if (!socket) return null;

        return socket.id;

    }

    function isConnected() {

        return connected;

    }

    function emit(event, data = {}) {

        if (!socket) return;

        socket.emit(event, data);

    }

    function on(event, callback) {

        if (!socket) return;

        socket.on(event, callback);

    }

    function once(event, callback) {

        if (!socket) return;

        socket.once(event, callback);

    }

    function off(event) {

        if (!socket) return;

        socket.off(event);

    }

    function disconnect() {

        if (!socket) return;

        socket.disconnect();

    }

    return {

        connect,

        emit,

        on,

        once,

        off,

        disconnect,

        getSocket,

        getId,

        isConnected

    };

})();