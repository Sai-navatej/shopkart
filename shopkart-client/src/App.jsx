import "./App.css";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import OrderDetails from "./pages/OrderDetails";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Redirect the root page to Login */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                {/* Public routes */}
                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/home"
                        element={<Home />}
                    />

                    <Route
                        path="/products"
                        element={<Products />}
                    />

                    <Route
                        path="/products/:id"
                        element={<ProductDetails />}
                    />

                    <Route
                        path="/cart"
                        element={<Cart />}
                    />

                    <Route
                        path="/wishlist"
                        element={<Wishlist />}
                    />

                    <Route
                        path="/checkout"
                        element={<Checkout />}
                    />

                    {/* My Orders page */}
                    <Route
                        path="/orders"
                        element={<Orders />}
                    />
                </Route>
                <Route
                    path="/orders/:id"
                    element={<OrderDetails />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;