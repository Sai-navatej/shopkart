import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/orders");

        // Support either an array or an object containing an orders array.
        const data = response.data;
        const ordersList = Array.isArray(data)
          ? data
          : Array.isArray(data.orders)
            ? data.orders
            : [];

        setOrders(ordersList);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load your orders. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <h2>My Orders</h2>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2>My Orders</h2>
        <p style={styles.error}>{error}</p>
        <button onClick={() => window.location.reload()} style={styles.button}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>My Orders</h1>
      <p style={styles.subtitle}>View your ShopKart purchases here.</p>

      {orders.length === 0 ? (
        <div style={styles.empty}>
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet.</p>
          <Link to="/products" style={styles.link}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div style={styles.list}>
          {orders.map((order) => (
            <div key={order._id} style={styles.card}>
              <div style={styles.header}>
                <div>
                  <h3>Order #{order._id.slice(-8)}</h3>
                  <p style={styles.muted}>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : "Date unavailable"}
                  </p>
                </div>

                <div style={styles.badges}>
                  <span style={styles.status}>
                    {order.status || "Processing"}
                  </span>
                  <span style={styles.payment}>
                    Payment: {order.paymentStatus || "Pending"}
                  </span>
                </div>
              </div>

              <div style={styles.items}>
                {(order.items || []).map((item, index) => (
                  <div
                    key={item._id || item.product?._id || index}
                    style={styles.item}
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
                      ₹
                      {(
                        Number(item.price || 0) * Number(item.quantity || 1)
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>

              <div style={styles.footer}>
                <strong>
                  Total: ₹
                  {Number(order.totalAmount || 0).toLocaleString("en-IN")}
                </strong>

                <Link
                  to={`/orders/${order._id}`}
                  style={styles.detailsLink}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/products" style={styles.backLink}>
        ← Continue Shopping
      </Link>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "40px auto",
    padding: "24px",
    color: "#172033",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: "28px",
  },
  list: {
    display: "grid",
    gap: "20px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "22px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "16px",
  },
  muted: {
    color: "#64748b",
    fontSize: "13px",
  },
  badges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  status: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "13px",
  },
  payment: {
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "13px",
  },
  items: {
    padding: "14px 0",
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "8px 0",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "16px",
  },
  detailsLink: {
    background: "#2563eb",
    color: "#ffffff",
    padding: "9px 14px",
    borderRadius: "7px",
    textDecoration: "none",
  },
  empty: {
    textAlign: "center",
    background: "#ffffff",
    padding: "40px 20px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  link: {
    color: "#2563eb",
    fontWeight: "600",
  },
  backLink: {
    display: "inline-block",
    marginTop: "24px",
    color: "#2563eb",
    textDecoration: "none",
  },
  button: {
    padding: "10px 16px",
    cursor: "pointer",
  },
  error: {
    color: "#dc2626",
  },
};

export default Orders;