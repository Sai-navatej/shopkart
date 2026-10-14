import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

function ProductDetails() {
    const { id } = useParams();

    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [adding, setAdding] = useState(false);

    const [isWishlisted, setIsWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // Fetch product details
    useEffect(() => {
        const getProduct = async () => {
            try {
                const response = await api.get(`/products/${id}`);

                setProduct(response.data.product);
            } catch (error) {
                console.log(error);

                setError(
                    "Something went wrong while loading the product."
                );
            } finally {
                setLoading(false);
            }
        };

        getProduct();
    }, [id]);

    // Check whether product is already in wishlist
    useEffect(() => {
        const checkWishlist = async () => {
            try {
                const response = await api.get("/wishlist");

                const wishlist = response.data.wishlist || [];

                const exists = wishlist.some(
                    (item) => item._id === id
                );

                setIsWishlisted(exists);
            } catch (error) {
                console.log(error);
            }
        };

        checkWishlist();
    }, [id]);

    // Add product to cart
    const handleAddToCart = async () => {
        try {
            setAdding(true);

            await addToCart(product._id);

            alert("Product added to cart!");
        } catch (error) {
            console.log(error);

            alert(
                error.response?.data?.message ||
                "Unable to add product to cart"
            );
        } finally {
            setAdding(false);
        }
    };

    // Add or remove product from wishlist
    const handleWishlist = async () => {
        try {
            setWishlistLoading(true);

            if (isWishlisted) {
                // Remove from wishlist
                await api.delete(`/wishlist/${product._id}`);

                setIsWishlisted(false);

                alert("Product removed from wishlist!");
            } else {
                // Add to wishlist
                await api.post(`/wishlist/${product._id}`);

                setIsWishlisted(true);

                alert("Product added to wishlist!");
            }
        } catch (error) {
            console.log(error);

            alert(
                error.response?.data?.message ||
                "Unable to update wishlist"
            );
        } finally {
            setWishlistLoading(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div>
                <Navbar />

                <h2>Loading product...</h2>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div>
                <Navbar />

                <h2>{error}</h2>
            </div>
        );
    }

    return (
        <div>
            <Navbar />

            <div className="product-details">

                <img
                    src={product.image}
                    alt={product.name}
                    onError={(e) => {
                        e.currentTarget.src =
                            `https://placehold.co/600x450/png?text=${encodeURIComponent(
                                product.name
                            )}`;
                    }}
                />

                <div>
                    <h1>{product.name}</h1>

                    <p>{product.description}</p>

                    <h2>₹{product.price}</h2>

                    <p>
                        Category: {product.category}
                    </p>

                    <p>
                        {product.stock > 0
                            ? `In Stock (${product.stock})`
                            : "Out of Stock"}
                    </p>

                    {/* Add to Cart */}
                    <button
                        onClick={handleAddToCart}
                        disabled={
                            product.stock === 0 || adding
                        }
                    >
                        {adding
                            ? "Adding..."
                            : product.stock === 0
                            ? "Out of Stock"
                            : "Add to Cart"}
                    </button>

                    {/* Wishlist */}
                    <button
                        onClick={handleWishlist}
                        disabled={wishlistLoading}
                    >
                        {wishlistLoading
                            ? "Updating..."
                            : isWishlisted
                            ? "💔 Remove from Wishlist"
                            : "❤️ Add to Wishlist"}
                    </button>

                </div>

            </div>
        </div>
    );
}

export default ProductDetails;