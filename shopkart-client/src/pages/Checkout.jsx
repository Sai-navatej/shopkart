
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "./Checkout.css";

function Checkout() {
    const { cart, loading } = useCart();
    const navigate = useNavigate();

    const [shippingAddress, setShippingAddress] = useState({
        fullName: "",
        phone: "",
        addressLine: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
    });

    const [errors, setErrors] = useState({});
    const [paymentLoading, setPaymentLoading] = useState(false);

    const subtotal = cart.reduce(
        (total, item) =>
            total + (item.product?.price || 0) * item.quantity,
        0
    );

    const handleChange = (event) => {
        const { name, value } = event.target;

        setShippingAddress((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!shippingAddress.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        }

        if (!/^[6-9]\d{9}$/.test(shippingAddress.phone.trim())) {
            newErrors.phone = "Enter a valid 10-digit Indian mobile number";
        }

        if (!shippingAddress.addressLine.trim()) {
            newErrors.addressLine = "Address is required";
        }

        if (!shippingAddress.city.trim()) {
            newErrors.city = "City is required";
        }

        if (!shippingAddress.state.trim()) {
            newErrors.state = "State is required";
        }

        if (!/^\d{6}$/.test(shippingAddress.postalCode.trim())) {
            newErrors.postalCode = "Enter a valid 6-digit PIN code";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);

            document.body.appendChild(script);
        });
    };

    const handlePlaceOrder = async (event) => {
        event.preventDefault();

        if (paymentLoading) return;

        if (cart.length === 0) {
            alert("Your cart is empty.");
            navigate("/cart");
            return;
        }

        if (!validateForm()) return;

        setPaymentLoading(true);

        try {
            const razorpayLoaded = await loadRazorpayScript();

            if (!razorpayLoaded) {
                throw new Error(
                    "Unable to load Razorpay. Check your internet connection and try again."
                );
            }

            // The backend calculates the authoritative total from database prices.
            const response = await api.post(
                "/orders/create-payment-order",
                {
                    shippingAddress: {
                        fullName: shippingAddress.fullName.trim(),
                        phone: shippingAddress.phone.trim(),
                        addressLine: shippingAddress.addressLine.trim(),
                        city: shippingAddress.city.trim(),
                        state: shippingAddress.state.trim(),
                        postalCode: shippingAddress.postalCode.trim(),
                        country: shippingAddress.country,
                    },
                }
            );

            const data = response.data;

            if (
                !data.razorpayOrderId ||
                !data.orderId ||
                !data.key ||
                !data.amount
            ) {
                throw new Error(
                    "The server did not return all required payment details."
                );
            }

            const options = {
                key: data.key,
                amount: data.amount,
                currency: data.currency || "INR",
                name: "ShopKart",
                description: "Payment for your order",
                order_id: data.razorpayOrderId,

                handler: async function (paymentResponse) {
                    try {
                        // Verify the payment on the backend.
                        const verificationResponse = await api.post(
                            "/orders/verify-payment",
                            {
                                orderId: data.orderId,
                                razorpay_order_id:
                                    paymentResponse.razorpay_order_id,
                                razorpay_payment_id:
                                    paymentResponse.razorpay_payment_id,
                                razorpay_signature:
                                    paymentResponse.razorpay_signature,
                            }
                        );

                        if (
                            verificationResponse.data.success !== true
                        ) {
                            throw new Error(
                                verificationResponse.data.message ||
                                    "Payment verification failed."
                            );
                        }

                        alert(
                            "Payment successful! Your order has been placed."
                        );

                        // CHANGED: Open this specific order's details page.
                        navigate(`/orders/${data.orderId}`);
                    } catch (error) {
                        console.error(
                            "Payment verification error:",
                            error.response?.data || error
                        );

                        alert(
                            error.response?.data?.message ||
                                error.message ||
                                "Payment verification failed. Check your order status before retrying."
                        );
                    } finally {
                        setPaymentLoading(false);
                    }
                },

                prefill: {
                    name: shippingAddress.fullName.trim(),
                    contact: shippingAddress.phone.trim(),
                },

                notes: {
                    address: shippingAddress.addressLine.trim(),
                    city: shippingAddress.city.trim(),
                    state: shippingAddress.state.trim(),
                    postalCode: shippingAddress.postalCode.trim(),
                },

                theme: {
                    color: "#142b68",
                },

                modal: {
                    ondismiss: function () {
                        setPaymentLoading(false);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);

            razorpay.on("payment.failed", function (paymentResponse) {
                console.error(
                    "Razorpay payment failed:",
                    paymentResponse.error
                );

                alert(
                    paymentResponse.error?.description ||
                        "Payment failed. Please try again."
                );

                setPaymentLoading(false);
            });

            razorpay.open();
        } catch (error) {
            console.error(
                "Checkout error:",
                error.response?.data || error
            );

            alert(
                error.response?.data?.message ||
                    error.message ||
                    "Unable to start checkout. Please try again."
            );

            setPaymentLoading(false);
        }
    };

    if (loading && cart.length === 0) {
        return (
            <>
                <Navbar />
                <div className="checkout-message">
                    Loading your cart...
                </div>
            </>
        );
    }

    if (cart.length === 0) {
        return (
            <>
                <Navbar />
                <div className="checkout-message">
                    <h2>Your cart is empty</h2>
                    <p>
                        Add some products before proceeding to checkout.
                    </p>
                    <button
                        className="checkout-primary-button"
                        onClick={() => navigate("/products")}
                    >
                        Explore Products
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="checkout-page">
                <div className="checkout-container">
                    <header className="checkout-heading">
                        <p className="checkout-eyebrow">ALMOST THERE</p>
                        <h1>Checkout</h1>
                        <p>
                            Enter your shipping details to continue.
                        </p>
                    </header>

                    <form
                        className="checkout-layout"
                        onSubmit={handlePlaceOrder}
                        noValidate
                    >
                        <section className="shipping-card">
                            <h2>Shipping Information</h2>
                            <p className="checkout-section-description">
                                Where should we deliver your order?
                            </p>

                            <div className="checkout-form-grid">
                                <div className="checkout-field full-width">
                                    <label htmlFor="fullName">Full Name</label>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        autoComplete="name"
                                        placeholder="Enter your full name"
                                        value={shippingAddress.fullName}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.fullName && (
                                        <span className="checkout-error">
                                            {errors.fullName}
                                        </span>
                                    )}
                                </div>

                                <div className="checkout-field full-width">
                                    <label htmlFor="phone">Mobile Number</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        inputMode="numeric"
                                        autoComplete="tel"
                                        maxLength={10}
                                        placeholder="10-digit mobile number"
                                        value={shippingAddress.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.phone && (
                                        <span className="checkout-error">
                                            {errors.phone}
                                        </span>
                                    )}
                                </div>

                                <div className="checkout-field full-width">
                                    <label htmlFor="addressLine">Address</label>
                                    <textarea
                                        id="addressLine"
                                        name="addressLine"
                                        autoComplete="street-address"
                                        placeholder="House number, street, area"
                                        rows={3}
                                        value={shippingAddress.addressLine}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.addressLine && (
                                        <span className="checkout-error">
                                            {errors.addressLine}
                                        </span>
                                    )}
                                </div>

                                <div className="checkout-field">
                                    <label htmlFor="city">City</label>
                                    <input
                                        id="city"
                                        name="city"
                                        type="text"
                                        autoComplete="address-level2"
                                        placeholder="Enter city"
                                        value={shippingAddress.city}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.city && (
                                        <span className="checkout-error">
                                            {errors.city}
                                        </span>
                                    )}
                                </div>

                                <div className="checkout-field">
                                    <label htmlFor="state">State</label>
                                    <input
                                        id="state"
                                        name="state"
                                        type="text"
                                        autoComplete="address-level1"
                                        placeholder="Enter state"
                                        value={shippingAddress.state}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.state && (
                                        <span className="checkout-error">
                                            {errors.state}
                                        </span>
                                    )}
                                </div>

                                <div className="checkout-field">
                                    <label htmlFor="postalCode">PIN Code</label>
                                    <input
                                        id="postalCode"
                                        name="postalCode"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="postal-code"
                                        maxLength={6}
                                        placeholder="6-digit PIN code"
                                        value={shippingAddress.postalCode}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.postalCode && (
                                        <span className="checkout-error">
                                            {errors.postalCode}
                                        </span>
                                    )}
                                </div>

                                <div className="checkout-field">
                                    <label htmlFor="country">Country</label>
                                    <input
                                        id="country"
                                        name="country"
                                        type="text"
                                        value={shippingAddress.country}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </section>

                        <aside className="checkout-summary">
                            <h2>Order Summary</h2>

                            <div className="checkout-items">
                                {cart.map((item) => {
                                    if (!item.product) return null;

                                    return (
                                        <div
                                            className="checkout-product"
                                            key={
                                                item._id || item.product._id
                                            }
                                        >
                                            <div className="checkout-product-info">
                                                <h3>{item.product.name}</h3>
                                                <p>Qty: {item.quantity}</p>
                                            </div>

                                            <strong>
                                                ₹
                                                {(
                                                    item.product.price *
                                                    item.quantity
                                                ).toLocaleString("en-IN")}
                                            </strong>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="checkout-summary-divider" />

                            <div className="checkout-total-row">
                                <span>Subtotal</span>
                                <strong>
                                    ₹{subtotal.toLocaleString("en-IN")}
                                </strong>
                            </div>

                            <div className="checkout-total-row">
                                <span>Delivery</span>
                                <strong className="checkout-free">FREE</strong>
                            </div>

                            <div className="checkout-summary-divider" />

                            <div className="checkout-grand-total">
                                <span>Total</span>
                                <strong>
                                    ₹{subtotal.toLocaleString("en-IN")}
                                </strong>
                            </div>

                            <button
                                className="checkout-primary-button"
                                type="submit"
                                disabled={paymentLoading}
                            >
                                {paymentLoading
                                    ? "Connecting to Payment..."
                                    : "Continue to Payment →"}
                            </button>

                            <p className="checkout-security">
                                🔒 Your shipping details will be handled
                                securely.
                            </p>
                        </aside>
                    </form>
                </div>
            </main>
        </>
    );
}

export default Checkout;
