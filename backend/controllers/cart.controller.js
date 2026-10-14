const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const mongoose = require("mongoose");

// Add product to cart
const addToCart = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const customer = await Customer.findById(req.user._id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const existingItem = customer.cart.find(
            (item) => item.product.toString() === productId
        );

        if (existingItem) {
            if (existingItem.quantity + 1 > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient stock"
                });
            }

            existingItem.quantity += 1;
        } else {
            if (product.stock < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Product is out of stock"
                });
            }

            customer.cart.push({
                product: product._id,
                quantity: 1
            });
        }

        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Product added to cart",
            cart: customer.cart
        });

    } catch (error) {
        console.error("ADD CART ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// Get cart
const getCart = async (req, res) => {
    try {
        const customer = await Customer.findById(req.user._id)
            .populate("cart.product");

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        return res.status(200).json({
            success: true,
            cart: customer.cart
        });

    } catch (error) {
        console.error("GET CART ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// Update cart quantity
const updateCartQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock"
            });
        }

        const customer = await Customer.findById(req.user._id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const cartItem = customer.cart.find(
            (item) => item.product.toString() === productId
        );

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        cartItem.quantity = quantity;

        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Cart quantity updated",
            cart: customer.cart
        });

    } catch (error) {
        console.error("UPDATE CART ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// Remove product from cart
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const customer = await Customer.findById(req.user._id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const cartItem = customer.cart.find(
            (item) => item.product.toString() === productId
        );

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        customer.cart = customer.cart.filter(
            (item) => item.product.toString() !== productId
        );

        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart: customer.cart
        });

    } catch (error) {
        console.error("REMOVE CART ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// Export all controller functions
module.exports = {
    addToCart,
    getCart,
    updateCartQuantity,
    removeFromCart
};