import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

const API_BASE_URL = "http://localhost:5000";

function Profile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [myRatings, setMyRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(true);

  useEffect(() => {
    const fetchMyRatings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ratings/my-ratings`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMyRatings(data.ratings || []);
        }
      } catch (err) {
        console.error("Failed to fetch user ratings:", err);
      } finally {
        setLoadingRatings(false);
      }
    };

    if (token) {
      fetchMyRatings();
    }
  }, [token]);

  const handleDeleteRating = async (ratingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ratings/${ratingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMyRatings((prev) => prev.filter((item) => item.id !== ratingId));
      }
    } catch (err) {
      console.error("Failed to delete rating:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{initial}</div>
          <h2>{user.name}</h2>
          <span className="profile-role-badge">{user.role}</span>
        </div>

        <div className="profile-details">
          <div className="profile-row">
            <span className="profile-label">User ID</span>
            <span className="profile-value">#{user.id}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Full Name</span>
            <span className="profile-value">{user.name}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Email</span>
            <span className="profile-value">{user.email}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Account Role</span>
            <span className="profile-value">{user.role}</span>
          </div>
        </div>

        <div className="profile-actions">
          <button
            className="profile-home-btn"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
          <button
            className="profile-logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* User's Submitted Ratings History */}
      <div className="my-ratings-card">
        <h3>My Reviews ({myRatings.length})</h3>

        {loadingRatings ? (
          <p className="my-ratings-empty">Loading your reviews...</p>
        ) : myRatings.length === 0 ? (
          <p className="my-ratings-empty">
            You haven't rated any stores yet. Visit a store to leave your first review!
          </p>
        ) : (
          <div className="my-ratings-list">
            {myRatings.map((item) => (
              <div key={item.id} className="my-rating-item">
                <div className="my-rating-top">
                  <Link to={`/stores/${item.store_id}`} className="my-rating-store">
                    {item.store_name}
                  </Link>
                  <span className="my-rating-stars">
                    {"★".repeat(item.rating)}
                    {"☆".repeat(5 - item.rating)}
                  </span>
                </div>

                {item.store_category && (
                  <span className="my-rating-category">{item.store_category}</span>
                )}

                {item.review && <p className="my-rating-text">{item.review}</p>}

                <div className="my-rating-footer">
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  <button
                    type="button"
                    className="my-rating-delete-btn"
                    onClick={() => handleDeleteRating(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;