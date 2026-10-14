
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../services/api";

function Navbar() {
    const navigate = useNavigate();
    const { cart } = useCart();

    // Calculate the total number of items in the cart
    const cartCount = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const handleLogout = async () => {
        try {
            await api.post("/customers/logout");
            navigate("/login");
        } catch (error) {
            console.log("LOGOUT ERROR:", error);
        }
    };

    return (
        <nav>
            <h2>ShopKart</h2>

            <div>
                <button onClick={() => navigate("/home")}>
                    Home
                </button>

                <button onClick={() => navigate("/products")}>
                    Products
                </button>

                <button onClick={() => navigate("/wishlist")}>
                    Wishlist
                </button>

                <button onClick={() => navigate("/cart")}>
                    🛒 Cart ({cartCount})
                </button>

                <button onClick={() => navigate("/orders")}>
                    My Orders
                </button>

                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
