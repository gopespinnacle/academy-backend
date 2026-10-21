const mongoose = require("mongoose");

const messengerWebPushSubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    expirationTime: { type: Number, default: null },
    userAgent: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });

messengerWebPushSubscriptionSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.models.MessengerWebPushSubscription ||
    mongoose.model("MessengerWebPushSubscription", messengerWebPushSubscriptionSchema);
