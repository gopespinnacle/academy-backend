/*
===========================================================
Gopes Pinnacle Academy
Virtual Classroom V2
Meeting Utilities
===========================================================
*/

window.MeetingUtils = (() => {

    function generateId() {
        return crypto.randomUUID();
    }

    function formatTime(date = new Date()) {

        return date.toLocaleTimeString("en-IN", {

            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true

        });

    }

    function formatDate(date = new Date()) {

        return date.toLocaleDateString("en-IN");

    }

    function log(title, value = "") {

        console.log(
            `%c${title}`,
            "color:#0b84ff;font-weight:bold;",
            value
        );

    }

    function error(title, value = "") {

        console.error(
            `%c${title}`,
            "color:red;font-weight:bold;",
            value
        );

    }

    function success(title, value = "") {

        console.log(
            `%c${title}`,
            "color:green;font-weight:bold;",
            value
        );

    }

    function warning(title, value = "") {

        console.warn(
            `%c${title}`,
            "color:orange;font-weight:bold;",
            value
        );

    }

    function isTeacher(role) {

        return role === "teacher";

    }

    function isStudent(role) {

        return role === "student";

    }

    function isFounder(role) {

        return role === "founder";

    }

    function isAssistantTeacher(role) {

        return role === "assistant-teacher";

    }

    function sleep(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));

    }

    function debounce(fn, delay = 300) {

        let timer;

        return (...args) => {

            clearTimeout(timer);

            timer = setTimeout(() => {

                fn(...args);

            }, delay);

        };

    }

    function throttle(fn, delay = 100) {

        let waiting = false;

        return (...args) => {

            if (waiting) return;

            waiting = true;

            fn(...args);

            setTimeout(() => {

                waiting = false;

            }, delay);

        };

    }

    function copy(text) {

        navigator.clipboard.writeText(text);

    }

    function bytesToSize(bytes) {

        const sizes = [

            "Bytes",
            "KB",
            "MB",
            "GB"

        ];

        if (bytes === 0) return "0 Byte";

        const i = parseInt(
            Math.floor(Math.log(bytes) / Math.log(1024))
        );

        return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];

    }

    function getConnectionQuality(rtt = 0) {

        if (rtt < 80) return "Excellent";

        if (rtt < 150) return "Good";

        if (rtt < 300) return "Average";

        return "Poor";

    }

    return {

        generateId,

        formatTime,

        formatDate,

        log,

        error,

        success,

        warning,

        isTeacher,

        isStudent,

        isFounder,

        isAssistantTeacher,

        sleep,

        debounce,

        throttle,

        copy,

        bytesToSize,

        getConnectionQuality

    };

})();