import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";

function Wishlist() {
     const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removing, setRemoving] = useState("");

    useEffect(() => {
        const getWishlist = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/wishlist");

                setWishlist(response.data.wishlist || []);
            } catch (error) {
                console.log(error);
                setError("Failed to load wishlist");
            } finally {
                setLoading(false);
            }
        };

        getWishlist();
    }, []);
    const handleRemove = async (productId) => {
    try {
        setRemoving(productId);

        await api.delete(`/wishlist/${productId}`);

        setWishlist((currentWishlist) =>
            currentWishlist.filter(
                (product) => product._id !== productId
            )
        );
    } catch (error) {
        console.log(error);

        alert(
            error.response?.data?.message ||
            "Unable to remove product from wishlist"
        );
    } finally {
        setRemoving("");
    }
};

    if (loading) {
        return (
            <div>
                <Navbar />
                <h2>Loading wishlist...</h2>
            </div>
        );
    }

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

            <div className="wishlist-page">
                <h1>My Wishlist ❤️</h1>

                {wishlist.length === 0 ? (
                    <div className="empty-wishlist">
                        <h2>Your wishlist is empty</h2>
                        <p>Add products you love to see them here.</p>
                    </div>
                ) : (
                    <div className="wishlist-grid">
                        {wishlist.map((product) => (
                            <div
                                className="wishlist-card"
                                key={product._id}
                            >
                                <img
                                    src={product.image}
                                    alt={product.name || "Product image"}
                                    onError={(e) => {
                                     e.currentTarget.onerror = null;
                                     e.currentTarget.src =
                                      `https://placehold.co/500x350/png?text=${encodeURIComponent(
                                    product.name || "Product Image"
                                      )}`;
                                         }}
                                        />

                                <div className="wishlist-card-content">
                                    <h2>{product.name}</h2>

                                    <p className="wishlist-category">
                                        {product.category}
                                    </p>

                                    <p className="wishlist-description">
                                        {product.description}
                                    </p>

                                    <h3>₹{product.price}</h3>

                                   <button
                                        onClick={() => handleRemove(product._id)}
                                        disabled={removing === product._id}
                                   >
                                    {removing === product._id
                                        ? "Removing..."
                                        : "❤️ Remove from Wishlist"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Wishlist;