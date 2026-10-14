import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Cart.css";

function Cart() {
    const {
        cart,
        loading,
        error,
        fetchCart,
        updateQuantity,
        removeFromCart
    } = useCart();

    const navigate = useNavigate();

    const subtotal = cart.reduce(
        (total, item) =>
            total + (item.product?.price || 0) * item.quantity,
        0
    );

    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const increaseQuantity = async (item) => {
        try {
            await updateQuantity(
                item.product._id,
                item.quantity + 1
            );
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to update quantity"
            );
        }
    };

    const decreaseQuantity = async (item) => {
        if (item.quantity <= 1) return;

        try {
            await updateQuantity(
                item.product._id,
                item.quantity - 1
            );
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to update quantity"
            );
        }
    };

    const handleRemove = async (productId) => {
        try {
            await removeFromCart(productId);
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to remove product"
            );
        }
    };

    if (loading && cart.length === 0) {
        return (
            <>
                <Navbar />
                <div className="cart-message">
                    <div className="cart-loader"></div>
                    <h2>Loading your cart...</h2>
                </div>
            </>
        );
    }

    if (error && cart.length === 0) {
        return (
            <>
                <Navbar />
                <div className="cart-message">
                    <h2>Unable to load your cart</h2>
                    <p>{error}</p>
                    <button
                        className="cart-primary-btn"
                        onClick={() => fetchCart().catch(() => {})}
                    >
                        Try Again
                    </button>
                </div>
            </>
        );
    }

    if (cart.length === 0) {
        return (
            <>
                <Navbar />
                <main className="cart-page">
                    <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <h1>Your cart is empty</h1>
                        <p>
                            Looks like you haven't added anything to
                            your cart yet.
                        </p>
                        <button
                            className="cart-primary-btn"
                            onClick={() => navigate("/products")}
                        >
                            Explore Products
                        </button>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="cart-page">
                <div className="cart-container">
                    <div className="cart-heading">
                        <div>
                            <p className="cart-eyebrow">
                                YOUR SHOPPING BAG
                            </p>
                            <h1>My Cart</h1>
                            <p className="cart-subtitle">
                                Review your items before checking out.
                            </p>
                        </div>

                        <div className="cart-item-count">
                            {totalItems}{" "}
                            {totalItems === 1 ? "item" : "items"}
                        </div>
                    </div>

                    <div className="cart-layout">
                        <section className="cart-products">
                            <div className="cart-section-heading">
                                <h2>Cart Items</h2>
                                <span>{cart.length} products</span>
                            </div>

                            {cart.map((item) => {
                                const product = item.product;

                                if (!product) return null;

                                const fallbackImage =
                                    `https://placehold.co/300x300/png?text=${
                                        encodeURIComponent(
                                            product.name || "Product"
                                        )
                                    }`;

                                return (
                                    <article
                                        className="cart-item"
                                        key={item._id || product._id}
                                    >
                                        <div className="cart-product-image">
                                            <img
                                                src={
                                                    product.image ||
                                                    fallbackImage
                                                }
                                                alt={product.name}
                                                onError={(event) => {
                                                    event.currentTarget.onerror =
                                                        null;
                                                    event.currentTarget.src =
                                                        fallbackImage;
                                                }}
                                            />
                                        </div>

                                        <div className="cart-product-info">
                                            <h3>{product.name}</h3>
                                            <p className="cart-category">
                                                {product.category || "General"}
                                            </p>

                                            <p className="cart-unit-price">
                                                ₹
                                                {Number(
                                                    product.price
                                                ).toLocaleString("en-IN")}
                                                <span> / item</span>
                                            </p>

                                            <div className="cart-quantity">
                                                <button
                                                    onClick={() =>
                                                        decreaseQuantity(item)
                                                    }
                                                    disabled={
                                                        item.quantity <= 1 ||
                                                        loading
                                                    }
                                                    aria-label="Decrease quantity"
                                                >
                                                    −
                                                </button>

                                                <span>{item.quantity}</span>

                                                <button
                                                    onClick={() =>
                                                        increaseQuantity(item)
                                                    }
                                                    disabled={
                                                        item.quantity >=
                                                            product.stock ||
                                                        loading
                                                    }
                                                    aria-label="Increase quantity"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className="cart-product-right">
                                            <p className="cart-line-total">
                                                ₹
                                                {(
                                                    product.price *
                                                    item.quantity
                                                ).toLocaleString("en-IN")}
                                            </p>

                                            <button
                                                className="cart-remove-btn"
                                                onClick={() =>
                                                    handleRemove(product._id)
                                                }
                                                disabled={loading}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}

                            <button
                                className="continue-shopping-btn"
                                onClick={() => navigate("/products")}
                            >
                                ← Continue Shopping
                            </button>
                        </section>

                        <aside className="cart-summary">
                            <h2>Order Summary</h2>

                            <div className="summary-row">
                                <span>Items</span>
                                <span>{totalItems}</span>
                            </div>

                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>
                                    ₹{subtotal.toLocaleString("en-IN")}
                                </span>
                            </div>

                            <div className="summary-row">
                                <span>Delivery</span>
                                <span className="free-delivery">
                                    FREE
                                </span>
                            </div>

                            <div className="summary-divider"></div>

                            <div className="summary-total">
                                <span>Total</span>
                                <strong>
                                    ₹{subtotal.toLocaleString("en-IN")}
                                </strong>
                            </div>

                            {/* Navigate to Checkout */}
                            <button
                                className="checkout-btn"
                                onClick={() => navigate("/checkout")}
                            >
                                Proceed to Checkout →
                            </button>

                            <div className="cart-security">
                                <span>🔒</span>
                                <p>
                                    Your shopping experience is secure.
                                </p>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}

export default Cart;