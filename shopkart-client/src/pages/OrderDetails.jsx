
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function OrderDetails() {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(`/orders/${id}`);
                const data = response.data;

                setOrder(data.order || data);
            } catch (err) {
                console.error("Failed to fetch order:", err);
                setError(
                    err.response?.data?.message ||
                    "Unable to load this order."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    if (loading) {
        return <main style={styles.container}>Loading order details...</main>;
    }

    if (error) {
        return (
            <main style={styles.container}>
                <h2>Order Details</h2>
                <p style={styles.error}>{error}</p>
                <Link to="/orders">← Back to My Orders</Link>
            </main>
        );
    }

    if (!order) {
        return (
            <main style={styles.container}>
                <h2>Order not found</h2>
                <Link to="/orders">← Back to My Orders</Link>
            </main>
        );
    }

    return (
        <main style={styles.container}>
            <Link to="/orders" style={styles.backLink}>
                ← Back to My Orders
            </Link>

            <h1>Order Details</h1>
            <p style={styles.muted}>Order ID: {order._id}</p>

            <section style={styles.card}>
                <div style={styles.row}>
                    <strong>Order Status</strong>
                    <span>{order.status || "Unknown"}</span>
                </div>

                <div style={styles.row}>
                    <strong>Payment Status</strong>
                    <span>{order.paymentStatus || "Unknown"}</span>
                </div>

                <div style={styles.row}>
                    <strong>Order Date</strong>
                    <span>
                        {order.createdAt
                            ? new Date(order.createdAt).toLocaleString()
                            : "Unavailable"}
                    </span>
                </div>
            </section>

            <section style={styles.card}>
                <h2>Items Ordered</h2>

                {(order.items || []).map((item, index) => (
                    <div
                        key={item._id || item.product?._id || index}
                        style={styles.row}
                    >
                        <span>
                            {item.name ||
                                item.product?.name ||
                                item.title ||
                                "Product"}
                            {" × "}
                            {item.quantity || 1}
                        </span>

                        <span>
                            ₹{(
                                Number(item.price || 0) *
                                Number(item.quantity || 1)
                            ).toLocaleString("en-IN")}
                        </span>
                    </div>
                ))}

                <div style={styles.total}>
                    Total: ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                </div>
            </section>

            <section style={styles.card}>
                <h2>Shipping Address</h2>
                {order.shippingAddress ? (
                    <div>
                        <p>{order.shippingAddress.fullName}</p>
                        <p>{order.shippingAddress.phone}</p>
                        <p>{order.shippingAddress.addressLine}</p>
                        <p>
                            {[
                                order.shippingAddress.city,
                                order.shippingAddress.state,
                                order.shippingAddress.postalCode,
                                order.shippingAddress.country
                            ]
                                .filter(Boolean)
                                .join(", ")}
                        </p>
                    </div>
                ) : (
                    <p>Shipping address unavailable.</p>
                )}
            </section>
        </main>
    );
}

const styles = {
    container: {
        maxWidth: "850px",
        margin: "40px auto",
        padding: "24px",
        color: "#172033"
    },
    card: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "22px",
        marginTop: "20px"
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        padding: "12px 0",
        borderBottom: "1px solid #e2e8f0",
        flexWrap: "wrap"
    },
    total: {
        textAlign: "right",
        fontWeight: "bold",
        fontSize: "20px",
        marginTop: "20px"
    },
    muted: {
        color: "#64748b",
        overflowWrap: "anywhere"
    },
    error: {
        color: "#dc2626"
    },
    backLink: {
        color: "#2563eb",
        textDecoration: "none"
    }
};

export default OrderDetails;
