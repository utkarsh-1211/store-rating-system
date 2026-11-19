import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div
        className="navbar-logo"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      >
        StoreRate
      </div>

      <div className="navbar-links">
        <Link to="/">Home</Link>
        <a href="/#stores">Stores</a>
        <a href="/#about">About</a>
      </div>

      <div className="navbar-actions">
        {user ? (
          <>
            <button
              className="login-btn"
              onClick={() => navigate("/profile")}
            >
              {user.name}
            </button>
            <button className="register-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              className="login-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button
              className="register-btn"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;