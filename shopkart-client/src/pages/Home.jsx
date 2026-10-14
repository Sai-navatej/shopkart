import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";

function Home() {
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getProfile = async () => {
            try {
                const response = await api.get("/customers/me");

                setCustomer(response.data.customer);
            } catch (error) {
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        getProfile();
    }, [navigate]);

    if (loading) {
        return <h2>Loading...</h2>;
    }

    return (
        <div>
            <Navbar />

            <h1>Welcome to ShopKart</h1>

            {customer && (
                <div>
                    <h2>Hello, {customer.fullName}!</h2>

                    <p>Email: {customer.email}</p>

                    <p>Phone: {customer.phone}</p>
                </div>
            )}
        </div>
    );
}

export default Home;