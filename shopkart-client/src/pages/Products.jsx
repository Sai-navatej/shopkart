import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";

function Products() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const getProducts = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/products", {
                    params: {
                        search,
                        category
                    }
                });

                setProducts(response.data.products);
            } catch (error) {
                console.log(error);

                setError(
                    "Something went wrong while loading products."
                );
            } finally {
                setLoading(false);
            }
        };

        getProducts();
    }, [search, category]);

    return (
        <div>
            <Navbar />

            <h1>ShopKart Products</h1>

            <SearchBar
                search={search}
                category={category}
                setSearch={setSearch}
                setCategory={setCategory}
            />

            {loading && <h2>Loading products...</h2>}

            {error && <h2>{error}</h2>}

            {!loading && !error && products.length === 0 && (
                <h2>No products found.</h2>
            )}

            {!loading && !error && products.length > 0 && (
                <div className="products-grid">
                    {products.map((product) => (
                        <ProductCard
                            key={product._id}
                            product={product}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Products;