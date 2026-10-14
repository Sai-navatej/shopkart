
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.email || !formData.password) {
            setError("Email and password are required");
            return;
        }

        try {
            await api.post("/customers/login", formData);
            navigate("/home");
        } catch (error) {
            if (error.response?.status === 401) {
                setError("Invalid Credentials");
            } else {
                setError(
                    error.response?.data?.message || "Login failed"
                );
            }
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1>Login</h1>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    {error && (
                        <p className="login-error">{error}</p>
                    )}

                    <button className="login-button" type="submit">
                        Login
                    </button>
                </form>

                <p className="login-register">
                    Don't have an account?
                    <button
                        className="register-button"
                        type="button"
                        onClick={() => navigate("/register")}
                    >
                        Register
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Login;
