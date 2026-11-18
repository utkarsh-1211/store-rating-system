
import React, { useEffect, useState } from "react";
import "./Home.css";

function Home() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/stores"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch stores");
        }

        const data = await response.json();
        setStores(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  return (
    <div className="home">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Discover & Rate Your Favorite Stores</h1>

          <p>
            Explore stores, check ratings, and share your
            shopping experiences with others.
          </p>

          <a href="#popular-stores" className="hero-button">
            Explore Stores
          </a>
        </div>
      </section>

      {/* Popular Stores Section */}
      <section className="popular-stores" id="popular-stores">

        <div className="section-heading">
          <h2>Popular Stores</h2>
          <p>Discover the highest-rated stores</p>
        </div>

        {loading && (
          <p className="loading">Loading stores...</p>
        )}

        {error && (
          <p className="error">{error}</p>
        )}

        {!loading && !error && stores.length === 0 && (
          <p className="empty-message">
            No stores available right now.
          </p>
        )}

        {!loading && !error && stores.length > 0 && (
          <div className="store-grid">

            {stores.map((store) => (
              <article className="store-card" key={store.id}>

                <div className="store-icon">🏬</div>

                <h3>{store.name}</h3>

                <p className="store-category">
                  {store.category}
                </p>

                <p className="store-address">
                  📍 {store.address}
                </p>

                <p className="store-description">
                  {store.description}
                </p>

              </article>
            ))}

          </div>
        )}

      </section>

    </div>
  );
}

export default Home;
