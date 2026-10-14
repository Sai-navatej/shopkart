import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../services/api";

function ProtectedRoute() {
    const [authenticated, setAuthenticated] = useState(null);

    useEffect(() => {
        let active = true;

        const verifyAuthentication = async () => {
            try {
                await api.get("/customers/me");

                if (active) {
                    setAuthenticated(true);
                }
            } catch (error) {
                if (active) {
                    setAuthenticated(false);
                }
            }
        };

        verifyAuthentication();

        return () => {
            active = false;
        };
    }, []);

    if (authenticated === null) {
        return <div>Checking authentication...</div>;
    }

    return authenticated
        ? <Outlet />
        : <Navigate to="/login" replace />;
}

export default ProtectedRoute;