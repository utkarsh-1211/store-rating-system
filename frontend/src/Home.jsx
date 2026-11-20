import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const API_BASE_URL = "http://localhost:5000";

function Home() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search, Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("highest");

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setError("");
        const response = await fetch(`${API_BASE_URL}/api/stores`);
        if (!response.ok) {
          throw new Error("Failed to fetch stores");
        }
        const data = await response.json();
        setStores(data);
      } catch (err) {
        setError("Unable to load stores. Make sure the backend server is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  // Build unique category dropdown list from database stores
  const categories = useMemo(() => {
    const unique = new Set(
      stores.map((store) => store.category).filter(Boolean)
    );
    return ["ALL", ...Array.from(unique)];
  }, [stores]);

  // Apply search, category filter, and sorting
  const filteredStores = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return stores
      .filter((store) => {
        const matchesCategory =
          selectedCategory === "ALL" || store.category === selectedCategory;

        const matchesSearch =
          !query ||
          store.name?.toLowerCase().includes(query) ||
          store.address?.toLowerCase().includes(query) ||
          store.category?.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "highest") {
          return Number(b.average_rating || 0) - Number(a.average_rating || 0);
        }
        if (sortBy === "most_reviewed") {
          return Number(b.total_ratings || 0) - Number(a.total_ratings || 0);
        }
        if (sortBy === "name_asc") {
          return (a.name || "").localeCompare(b.name || "");
        }
        return 0;
      });
  }, [stores, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1>Discover & Rate Local Stores</h1>
        <p>Find top-rated shops, read honest reviews, and share your experience.</p>
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="home-controls">
        <input
          type="text"
          className="home-search-input"
          placeholder="Search stores by name, category, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="home-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "ALL" ? "All Categories" : cat}
            </option>
          ))}
        </select>

        <select
          className="home-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="highest">Highest Rated</option>
          <option value="most_reviewed">Most Reviewed</option>
          <option value="name_asc">Name (A–Z)</option>
        </select>
      </div>

      <div className="stores-section">
        {loading ? (
          <div className="home-status-msg">Loading stores...</div>
        ) : error ? (
          <div className="home-error-msg">{error}</div>
        ) : filteredStores.length === 0 ? (
          <div className="home-status-msg">
            No stores matched your search or filter.
          </div>
        ) : (
          <>
            <p className="stores-count">
              Showing {filteredStores.length}{" "}
              {filteredStores.length === 1 ? "store" : "stores"}
            </p>

            <div className="stores-grid">
              {filteredStores.map((store) => (
                <Link
                  to={`/stores/${store.id}`}
                  key={store.id}
                  className="store-card"
                >
                  <div>
                    <div className="store-card-top">
                      <span className="store-card-category">
                        {store.category || "General"}
                      </span>
                      <span className="store-card-rating">
                        ★ {Number(store.average_rating || 0).toFixed(1)}
                      </span>
                    </div>

                    <h2>{store.name}</h2>

                    {store.address && (
                      <p className="store-card-address">📍 {store.address}</p>
                    )}

                    {store.description && (
                      <p className="store-card-desc">{store.description}</p>
                    )}
                  </div>

                  <div className="store-card-footer">
                    <span className="store-card-reviews">
                      {store.total_ratings || 0}{" "}
                      {store.total_ratings === 1 ? "review" : "reviews"}
                    </span>
                    <span className="store-card-cta">View & Rate →</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
