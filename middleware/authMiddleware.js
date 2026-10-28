const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {

            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 🔹 Load user from DB
            const user = await User.findById(decoded.id).select("-password");

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            req.user = user;

            next();

        } catch (error) {
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};


const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
    console.log("REGISTER AUTHORIZATION DEBUG:", {
        userId: String(req.user._id),
        role: req.user.role,
        allowedRoles: roles
    });

    return res.status(403).json({
        message: "Access denied. Not allowed for this role"
    });
}
        next();
    };
};
module.exports = { protect, authorize };