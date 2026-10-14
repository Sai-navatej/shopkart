import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback
} from "react";

import api from "../services/api";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch the current user's cart
    const fetchCart = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/cart");

            const cartItems = response.data.cart || [];

            setCart(cartItems);

            return cartItems;
        } catch (error) {
            console.error("FETCH CART ERROR:", error);

            setError(
                error.response?.data?.message ||
                "Failed to load cart"
            );

            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Add product to cart
    const addToCart = async (productId) => {
        try {
            const response = await api.post(
                `/cart/${productId}`
            );

            await fetchCart();

            return response.data;
        } catch (error) {
            console.error("ADD TO CART ERROR:", error);
            throw error;
        }
    };

    // Update product quantity
    const updateQuantity = async (productId, quantity) => {
        try {
            const response = await api.patch(
                `/cart/${productId}`,
                { quantity }
            );

            await fetchCart();

            return response.data;
        } catch (error) {
            console.error("UPDATE QUANTITY ERROR:", error);
            throw error;
        }
    };

    // Remove product from cart
    const removeFromCart = async (productId) => {
        try {
            const response = await api.delete(
                `/cart/${productId}`
            );

            await fetchCart();

            return response.data;
        } catch (error) {
            console.error("REMOVE FROM CART ERROR:", error);
            throw error;
        }
    };

    // Fetch cart when the application starts
    useEffect(() => {
        fetchCart().catch(() => {
            // fetchCart already records the error in state.
        });
    }, [fetchCart]);

    return (
        <CartContext.Provider
            value={{
                cart,
                loading,
                error,
                fetchCart,
                addToCart,
                updateQuantity,
                removeFromCart
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    return useContext(CartContext);
};