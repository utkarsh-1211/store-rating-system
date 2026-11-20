import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    </div>
  );
}

export default Profile;