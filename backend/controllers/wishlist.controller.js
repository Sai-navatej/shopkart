const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const mongoose = require("mongoose");

// Add a product to wishlist
const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        // Validate product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Find customer
        const customer = await Customer.findById(req.user.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Prevent duplicate products
        const alreadyExists = customer.wishlist.some(
            id => id.toString() === productId
        );

        if (alreadyExists) {
            return res.status(409).json({
                success: false,
                message: "Product already in wishlist"
            });
        }

        // Add product to wishlist
        customer.wishlist.push(product._id);
        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Product added to wishlist"
        });

    } catch (error) {
        console.error("ADD WISHLIST ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// Remove a product from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        // Validate product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        // Find customer
        const customer = await Customer.findById(req.user.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Find product in wishlist
        const index = customer.wishlist.findIndex(
            id => id.toString() === productId
        );

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: "Product not in wishlist"
            });
        }

        // Remove product
        customer.wishlist.splice(index, 1);
        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist"
        });

    } catch (error) {
        console.error("REMOVE WISHLIST ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// Get all wishlist products
const getWishlist = async (req, res) => {
    try {
        // Find customer and populate product details
        const customer = await Customer.findById(req.user.id)
            .populate("wishlist");

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        return res.status(200).json({
            success: true,
            count: customer.wishlist.length,
            wishlist: customer.wishlist
        });

    } catch (error) {
        console.error("GET WISHLIST ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    addToWishlist,
    removeFromWishlist,
    getWishlist
};