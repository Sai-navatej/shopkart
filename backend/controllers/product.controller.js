const Product = require("../models/product.model");
const mongoose = require("mongoose");

const createProduct = async (req, res) => {
     console.log("CREATE PRODUCT CALLED");
    try {
        const {
            name,
            description,
            price,
            category,
            image,
            stock
        } = req.body;

        // Check required fields
        if (
            !name ||
            !description ||
            price === undefined ||
            !category ||
            !image ||
            stock === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check price
        if (price <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be greater than 0"
            });
        }

        // Check stock
        if (stock < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock cannot be negative"
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            image,
            stock
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
const getAllProducts = async (req, res) => {
    try {
        const { search, category } = req.query;

        const filter = {};

        if (search) {
            filter.name = {
                $regex: search,
                $options: "i"
            };
        }

        if (category) {
            filter.category = category;
        }

        const products = await Product.find(filter);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

   } catch (error) {
    console.log("GET PRODUCTS ERROR:", error);

    res.status(500).json({
        success: false,
        message: error.message
    });
}
};
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(id);

        // Product not found
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
    console.log("PRODUCT ERROR:", error);

    res.status(500).json({
        success: false,
        message: error.message
    });
}
};
module.exports = {
    createProduct,
    getAllProducts,
    getProductById
};