const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema({

    couponCode: {
        type: String,
        required: true,
        unique: true
    },

    discountPercent: {
        type: Number,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model(
    "Discount",
    discountSchema
);