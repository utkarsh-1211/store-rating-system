
import React from "react";
import "./Home.css";

const stores = [
  {
    id: 1,
    name: "Tech World",
    category: "Electronics",
    rating: 4.5,
    reviews: 120,
  },
  {
    id: 2,
    name: "Fashion Hub",
    category: "Clothing",
    rating: 4.2,
    reviews: 85,
  },
  {
    id: 3,
    name: "Fresh Mart",
    category: "Grocery",
    rating: 4.8,
    reviews: 200,
  },
  {
    id: 4,
    name: "Book Corner",
    category: "Books",
    rating: 4.0,
    reviews: 65,
  },
  {
    id: 5,
    name: "Home Decor",
    category: "Furniture",
    rating: 4.3,
    reviews: 95,
  },
  {
    id: 6,
    name: "Sports Zone",
    category: "Sports",
    rating: 4.6,
    reviews: 110,
  },
];

function Home() {
  return (
    <div className="home-container">
      <section className="hero-section">
        <h1>Discover & Rate Your Favorite Stores</h1>
        <p>
          Explore stores, check ratings, and share your shopping
          experiences with others.
        </p>

        <button className="explore-btn">Explore Stores</button>
      </section>

      <section className="stores-section">
        <div className="section-heading">
          <h2>Popular Stores</h2>
          <p>Discover the highest-rated stores</p>
        </div>

        <div className="store-grid">
          {stores.map((store) => (
            <div className="store-card" key={store.id}>
              <div className="store-icon">🏪</div>

              <h3>{store.name}</h3>

              <p className="store-category">
                {store.category}
              </p>

              <div className="store-rating">
                <span>⭐ {store.rating}</span>
                <span>{store.reviews} Reviews</span>
              </div>

              <button className="view-btn">
                View Details
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;

