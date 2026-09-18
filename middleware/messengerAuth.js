const jwt = require("jsonwebtoken");
const User = require("../models/User");


// =========================================================
// GPA MESSENGER AUTHENTICATION
// =========================================================

const messengerAuth = async (req, res, next) => {

    try {

        // Get Authorization header
        const authHeader =
            req.headers.authorization;


        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Messenger authentication required."

            });

        }


        // Extract token
        const token =
            authHeader.split(" ")[1];


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication token missing."

            });

        }


        // Verify token
        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // Find logged-in user
        const user =
            await User.findById(decoded.id)
                .select(
                    "_id name email role studentId teacherId"
                );


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "User not found."

            });

        }


        // Attach user to request
        req.user = user;


        // Continue to Messenger route
        next();

    }
    catch (error) {

        console.error(
            "MESSENGER AUTH ERROR:",
            error
        );


        return res.status(401).json({

            success: false,

            message:
                "Invalid or expired authentication token."

        });

    }

};


module.exports = messengerAuth;