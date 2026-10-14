const express = require("express");
const router = express.Router();

const {
    createPaymentOrder,
    verifyPayment,
    getMyOrders,
    getOrderById
} = require("../controllers/order.controller");

const authMiddleware = require("../middlewares/auth.middleware");

// Create a Razorpay payment order
router.post(
    "/create-payment-order",
    authMiddleware,
    createPaymentOrder
);

// Verify Razorpay payment
router.post(
    "/verify-payment",
    authMiddleware,
    verifyPayment
);

// Get all orders for the logged-in customer
router.get(
    "/",
    authMiddleware,
    getMyOrders
);

// Get one order by ID
router.get(
    "/:id",
    authMiddleware,
    getOrderById
);

module.exports = router;