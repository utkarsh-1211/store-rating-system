import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validatePassword } from "../utils/validators";
import "./Profile.css";

const API_BASE_URL = "http://localhost:5000";

function Profile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [myRatings, setMyRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    const fetchMyRatings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ratings/my-ratings`, {
          headers: { Authorization: `Bearer ${token}` }
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
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setMyRatings((prev) => prev.filter((item) => item.id !== ratingId));
      }
    } catch (err) {
      console.error("Failed to delete rating:", err);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!currentPassword) {
      setPwError("Please enter your current password.");
      return;
    }

    const validationErr = validatePassword(newPassword);
    if (validationErr) {
      setPwError(validationErr);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError("New password and confirm password do not match.");
      return;
    }

    setPwSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        setPwError(data.message || "Failed to update password.");
        return;
      }

      setPwSuccess(data.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError("Unable to connect to the server.");
    } finally {
      setPwSaving(false);
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
            <span className="profile-label">Address</span>
            <span className="profile-value">{user.address || "Not provided"}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Account Role</span>
            <span className="profile-value">{user.role}</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="profile-home-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
          {user.role === "ADMIN" && (
            <button className="profile-logout-btn" onClick={() => navigate("/admin")}>
              Admin Dashboard
            </button>
          )}
          {user.role === "STORE_OWNER" && (
            <button className="profile-logout-btn" onClick={() => navigate("/owner")}>
              Owner Dashboard
            </button>
          )}
          <button className="profile-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Update Password Card */}
      <div className="my-ratings-card">
        <h3>Update Password</h3>

        {pwError && (
          <p style={{ color: "#b91c1c", background: "#fef2f2", padding: "0.7rem", borderRadius: "8px", fontSize: "0.88rem" }}>
            {pwError}
          </p>
        )}
        {pwSuccess && (
          <p style={{ color: "#047857", background: "#ecfdf5", padding: "0.7rem", borderRadius: "8px", fontSize: "0.88rem" }}>
            {pwSuccess}
          </p>
        )}

        <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: "0.75rem" }}>
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.95rem" }}
          />
          <input
            type="password"
            placeholder="New Password (8–16 chars, 1 uppercase, 1 special char)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.95rem" }}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.95rem" }}
          />
          <button
            type="submit"
            className="profile-logout-btn"
            disabled={pwSaving}
            style={{ alignSelf: "flex-start", padding: "0.7rem 1.4rem" }}
          >
            {pwSaving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* My Reviews Card */}
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