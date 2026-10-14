const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
    addToWishlist,
    removeFromWishlist,
    getWishlist
} = require("../controllers/wishlist.controller");

router.post("/:productId", authMiddleware, addToWishlist);

router.delete("/:productId", authMiddleware, removeFromWishlist);

router.get("/", authMiddleware, getWishlist);

module.exports = router;