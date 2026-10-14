import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ProductCard({ product }) {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const fallbackImage = `https://placehold.co/500x350/png?text=${encodeURIComponent(
        product.name || "Product Image"
    )}`;

    const handleAddToWishlist = async () => {
        try {
            setLoading(true);
            setMessage("");
            setError("");

            const response = await api.post(
                `/wishlist/${product._id}`
            );

            setMessage(
                response.data.message || "Added to Wishlist ❤️"
            );
        } catch (err) {
            console.error("ADD TO WISHLIST ERROR:", err);

            setError(
                err.response?.data?.message ||
                "Unable to add product to wishlist"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-card">
            <img
                src={product.image || fallbackImage}
                alt={product.name || "Product image"}
                onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackImage;
                }}
            />

            <h2>{product.name}</h2>

            <p>{product.category}</p>

            <h3>₹{product.price}</h3>

            <p>
                {product.stock > 0
                    ? `In Stock (${product.stock})`
                    : "Out of Stock"}
            </p>

            <button
                onClick={() =>
                    navigate(`/products/${product._id}`)
                }
            >
                View Details
            </button>

            <button
                onClick={handleAddToWishlist}
                disabled={loading}
            >
                {loading
                    ? "Adding..."
                    : "❤️ Add to Wishlist"}
            </button>

            {message && (
                <p className="wishlist-success">
                    {message}
                </p>
            )}

            {error && (
                <p className="wishlist-error">
                    {error}
                </p>
            )}
        </div>
    );
}

export default ProductCard;