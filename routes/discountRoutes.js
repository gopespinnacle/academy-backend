const express = require("express");
const router = express.Router();

const Discount = require("../models/Discount");



/* =========================
   CREATE DISCOUNT
========================= */

router.post("/create", async (req, res) => {

    try {

        const { couponCode, discountPercent } = req.body;

        const discount = new Discount({
            couponCode,
            discountPercent
        });

        await discount.save();

        res.json({
            success: true,
            message: "Discount Created"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});



/* =========================
   GET ALL DISCOUNTS
========================= */

router.get("/all", async (req, res) => {

    try {

        const discounts = await Discount.find();

        res.json(discounts);

    } catch (err) {

        res.status(500).json({
            success: false
        });

    }

});



/* =========================
   DELETE DISCOUNT
========================= */

router.delete("/delete/:id", async (req, res) => {

    try {

        await Discount.findByIdAndDelete(
            req.params.id
        );

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({
            success: false
        });

    }

});



/* =========================
   UPDATE DISCOUNT
========================= */

router.put("/update/:id", async (req, res) => {

    try {

        const {
            couponCode,
            discountPercent
        } = req.body;

        await Discount.findByIdAndUpdate(
            req.params.id,
            {
                couponCode,
                discountPercent
            }
        );

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({
            success: false
        });

    }

});



/* =========================
   VALIDATE COUPON
========================= */

router.post("/validate", async (req, res) => {

    try {

        const { couponCode } = req.body;

        const discount =
            await Discount.findOne({
                couponCode
            });

        if (!discount) {

            return res.json({
                success: false
            });

        }

        res.json({
            success: true,
            discountPercent:
                discount.discountPercent
        });

    } catch (err) {

        res.status(500).json({
            success: false
        });

    }

});



module.exports = router;