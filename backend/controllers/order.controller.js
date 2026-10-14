const crypto = require("crypto");
const Razorpay = require("razorpay");

const Order = require("../models/order.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// Initialize Razorpay using backend environment variables.
const razorpay =
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
        ? new Razorpay({
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET,
          })
        : null;


// Check Razorpay configuration.
const requireRazorpay = (res) => {
    if (!razorpay) {
        res.status(503).json({
            success: false,
            message:
                "Razorpay is not configured. Check your backend .env file.",
        });

        return false;
    }

    return true;
};


// Validate shipping information.
const validateShippingAddress = (shippingAddress) => {
    if (
        !shippingAddress ||
        typeof shippingAddress !== "object" ||
        Array.isArray(shippingAddress)
    ) {
        return "Please provide shipping information.";
    }

    const {
        fullName,
        phone,
        addressLine,
        city,
        state,
        postalCode,
        country,
    } = shippingAddress;

    const requiredFields = {
        fullName,
        phone,
        addressLine,
        city,
        state,
        postalCode,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
        if (typeof value !== "string" || !value.trim()) {
            return `Please provide a valid ${field}.`;
        }
    }

    if (fullName.trim().length > 100) {
        return "Full name must not exceed 100 characters.";
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
        return "Please provide a valid 10-digit Indian mobile number.";
    }

    if (addressLine.trim().length > 250) {
        return "Address must not exceed 250 characters.";
    }

    if (city.trim().length > 100) {
        return "City must not exceed 100 characters.";
    }

    if (state.trim().length > 100) {
        return "State must not exceed 100 characters.";
    }

    if (!/^\d{6}$/.test(postalCode.trim())) {
        return "Please provide a valid 6-digit PIN code.";
    }

    if (
        country !== undefined &&
        (typeof country !== "string" || country.trim().length > 100)
    ) {
        return "Please provide a valid country.";
    }

    return null;
};


// Create Razorpay payment order.
const createPaymentOrder = async (req, res) => {
    try {
        if (!requireRazorpay(res)) {
            return;
        }

        const userId = req.user.id;

        // Accept shipping details from the frontend request.
        // The frontend sends them inside req.body.shippingAddress.
        const shippingAddress =
            req.body.shippingAddress || req.body;

        console.log("Creating payment order for customer:", userId);

        const validationError =
            validateShippingAddress(shippingAddress);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        const {
            fullName,
            phone,
            addressLine,
            city,
            state,
            postalCode,
            country,
        } = shippingAddress;

        // Load customer cart and current product information.
        const customer = await Customer.findById(userId).populate(
            "cart.product"
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found.",
            });
        }

        if (!customer.cart || customer.cart.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty.",
            });
        }

        const items = [];
        let totalPaise = 0;

        // Calculate prices on the server.
        for (const cartItem of customer.cart) {
            const product = cartItem.product;
            const quantity = cartItem.quantity;

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "A product in your cart no longer exists.",
                });
            }

            if (!Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity for ${product.name}.`,
                });
            }

            if (
                !Number.isFinite(product.stock) ||
                product.stock < quantity
            ) {
                return res.status(409).json({
                    success: false,
                    message: `${product.name} does not have enough stock.`,
                });
            }

            if (
                !Number.isFinite(product.price) ||
                product.price <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid price for ${product.name}.`,
                });
            }

            const pricePaise = Math.round(product.price * 100);
            const itemTotalPaise = pricePaise * quantity;

            if (
                !Number.isSafeInteger(pricePaise) ||
                pricePaise <= 0 ||
                !Number.isSafeInteger(itemTotalPaise)
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid price or quantity for ${product.name}.`,
                });
            }

            totalPaise += itemTotalPaise;

            if (!Number.isSafeInteger(totalPaise)) {
                return res.status(400).json({
                    success: false,
                    message: "Order total is too large.",
                });
            }

            // Store a snapshot of the product in the order.
            items.push({
                product: product._id,
                name: product.name,
                price: pricePaise / 100,
                quantity,
                image: product.image || "",
            });
        }

        if (totalPaise <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order total.",
            });
        }

        // Create Razorpay order. Amount must be in paise.
        let razorpayOrder;

        try {
            razorpayOrder = await razorpay.orders.create({
                amount: totalPaise,
                currency: "INR",
                receipt: `shopkart_${crypto.randomUUID()}`,
            });
        } catch (razorpayError) {
            // Print diagnostic information without exposing credentials.
            console.error("Razorpay order creation failed.");
            console.error("Error name:", razorpayError?.name);
            console.error("Error message:", razorpayError?.message);
            console.error("HTTP status:", razorpayError?.statusCode);
            console.error(
                "Razorpay error details:",
                razorpayError?.error
            );
            console.error("Error cause:", razorpayError?.cause);
            console.error("Error stack:", razorpayError?.stack);

            return res.status(502).json({
                success: false,
                message:
                    "Razorpay could not create the payment order. Check the backend terminal for details.",
            });
        }

        // Save the order in MongoDB.
        let order;

        try {
            order = await Order.create({
                user: userId,
                items,

                shippingAddress: {
                    fullName: fullName.trim(),
                    phone: phone.trim(),
                    addressLine: addressLine.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    postalCode: postalCode.trim(),
                    country:
                        typeof country === "string" && country.trim()
                            ? country.trim()
                            : "India",
                },

                totalAmount: totalPaise / 100,
                paymentStatus: "PENDING",
                status: "PROCESSING",
                razorpayOrderId: razorpayOrder.id,
            });
        } catch (error) {
            console.error("MongoDB order creation error:", error);

            return res.status(500).json({
                success: false,
                message:
                    "Could not save the order. Check your order history before attempting another payment.",
            });
        }

        return res.status(201).json({
            success: true,
            message: "Payment order created successfully.",
            orderId: order._id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error("Create payment order error:");
        console.error("Error name:", error?.name);
        console.error("Error message:", error?.message);
        console.error("HTTP status:", error?.statusCode);
        console.error("Error details:", error?.error);
        console.error("Error cause:", error?.cause);
        console.error("Error stack:", error?.stack);

        return res.status(500).json({
            success: false,
            message:
                "Failed to create payment order. Check the backend terminal for details.",
        });
    }
};


// Verify Razorpay payment.
const verifyPayment = async (req, res) => {
    let claimedOrderId = null;
    let reservedProducts = [];

    try {
        if (!requireRazorpay(res)) {
            return;
        }

        const userId = req.user.id;

        const {
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        if (
            !orderId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing payment verification details.",
            });
        }

        // Find an order belonging to the logged-in customer.
        const order = await Order.findOne({
            _id: orderId,
            user: userId,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found.",
            });
        }

        // Allow safe retries for an already verified payment.
        if (order.paymentStatus === "PAID") {
            if (order.razorpayPaymentId === razorpay_payment_id) {
                return res.status(200).json({
                    success: true,
                    message: "Payment has already been verified.",
                    order,
                });
            }

            return res.status(409).json({
                success: false,
                message: "This order has already been paid.",
            });
        }

        if (order.paymentStatus !== "PENDING") {
            return res.status(409).json({
                success: false,
                message: "This order is not awaiting payment.",
            });
        }

        if (order.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({
                success: false,
                message: "Payment order ID mismatch.",
            });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;

        if (!secret) {
            return res.status(503).json({
                success: false,
                message: "Payment configuration is missing.",
            });
        }

        // Verify the HMAC SHA-256 payment signature.
        if (
            typeof razorpay_signature !== "string" ||
            !/^[a-fA-F0-9]{64}$/.test(razorpay_signature)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature.",
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(
                `${razorpay_order_id}|${razorpay_payment_id}`
            )
            .digest();

        const receivedSignature = Buffer.from(
            razorpay_signature,
            "hex"
        );

        if (
            receivedSignature.length !== expectedSignature.length ||
            !crypto.timingSafeEqual(
                expectedSignature,
                receivedSignature
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment signature verification failed.",
            });
        }

        // Confirm payment status directly with Razorpay.
        const payment = await razorpay.payments.fetch(
            razorpay_payment_id
        );

        if (
            payment.order_id !== razorpay_order_id ||
            payment.amount !== Math.round(order.totalAmount * 100) ||
            payment.currency !== "INR"
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment details do not match the order.",
            });
        }

        if (payment.status !== "captured") {
            return res.status(409).json({
                success: false,
                message:
                    "Payment has not been captured yet. Check the payment status before retrying.",
            });
        }

        /*
         * Claim the order using razorpayPaymentId while paymentStatus
         * remains PENDING. This avoids using an unsupported status value.
         */
        const claimedOrder = await Order.findOneAndUpdate(
            {
                _id: order._id,
                user: userId,
                paymentStatus: "PENDING",
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: null,
            },
            {
                $set: {
                    razorpayPaymentId: razorpay_payment_id,
                },
            },
            {
                new: true,
            }
        );

        if (!claimedOrder) {
            const latestOrder = await Order.findById(order._id);

            if (
                latestOrder &&
                latestOrder.paymentStatus === "PAID" &&
                latestOrder.razorpayPaymentId ===
                    razorpay_payment_id
            ) {
                return res.status(200).json({
                    success: true,
                    message: "Payment has already been verified.",
                    order: latestOrder,
                });
            }

            return res.status(409).json({
                success: false,
                message:
                    "This payment is already being processed. Check your order status before retrying.",
            });
        }

        claimedOrderId = claimedOrder._id;

        // Decrease product stock after payment is confirmed.
        for (const item of claimedOrder.items) {
            const updatedProduct = await Product.findOneAndUpdate(
                {
                    _id: item.product,
                    stock: {
                        $gte: item.quantity,
                    },
                },
                {
                    $inc: {
                        stock: -item.quantity,
                    },
                },
                {
                    new: true,
                }
            );

            if (!updatedProduct) {
                throw new Error(
                    `Insufficient stock for ${item.name}. Payment was captured; reconciliation or refund may be required.`
                );
            }

            reservedProducts.push({
                product: item.product,
                quantity: item.quantity,
            });
        }

        // Mark the order as paid.
        const paidOrder = await Order.findOneAndUpdate(
            {
                _id: claimedOrder._id,
                paymentStatus: "PENDING",
                razorpayPaymentId: razorpay_payment_id,
            },
            {
                $set: {
                    paymentStatus: "PAID",
                    status: "PLACED",
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!paidOrder) {
            throw new Error(
                "Could not finalize the order. Reconciliation is required."
            );
        }

        // Remove purchased quantities from the customer's cart.
        const customer = await Customer.findById(userId);

        if (customer) {
            for (const item of paidOrder.items) {
                const cartItem = customer.cart.find(
                    (entry) =>
                        entry.product.toString() ===
                        item.product.toString()
                );

                if (!cartItem) {
                    continue;
                }

                if (cartItem.quantity <= item.quantity) {
                    customer.cart.pull({
                        product: item.product,
                    });
                } else {
                    cartItem.quantity -= item.quantity;
                }
            }

            await customer.save();
        }

        claimedOrderId = null;
        reservedProducts = [];

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully.",
            order: paidOrder,
        });
    } catch (error) {
        console.error("Verify payment error:", error);

        // Best-effort rollback of stock changes.
        for (const reserved of reservedProducts) {
            try {
                await Product.updateOne(
                    {
                        _id: reserved.product,
                    },
                    {
                        $inc: {
                            stock: reserved.quantity,
                        },
                    }
                );
            } catch (rollbackError) {
                console.error(
                    "Stock rollback error:",
                    rollbackError
                );
            }
        }

        // Release the verification claim if the order is still pending.
        if (claimedOrderId) {
            try {
                await Order.updateOne(
                    {
                        _id: claimedOrderId,
                        paymentStatus: "PENDING",
                    },
                    {
                        $set: {
                            razorpayPaymentId: null,
                        },
                    }
                );
            } catch (rollbackError) {
                console.error(
                    "Order verification rollback error:",
                    rollbackError
                );
            }
        }

        return res.status(500).json({
            success: false,
            message:
                "Payment verification could not be completed. If Razorpay captured the payment, do not pay again until you have checked your order status.",
        });
    }
};


// Get all orders for the logged-in customer.
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.id,
        }).sort({
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            orders,
        });
    } catch (error) {
        console.error("Get orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders.",
        });
    }
};


// Get one order belonging to the logged-in customer.
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found.",
            });
        }

        return res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID.",
            });
        }

        console.error("Get order by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch order.",
        });
    }
};


// Export controller functions.
module.exports = {
    createPaymentOrder,
    verifyPayment,
    getMyOrders,
    getOrderById,
};