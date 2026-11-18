import "./Navbar.css";
function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        StoreRate
      </div>

      <div className="navbar-links">
        <a href="/">Home</a>
        <a href="#stores">Stores</a>
        <a href="#about">About</a>
      </div>

      <div className="navbar-actions">
        <button className="login-btn">Login</button>
        <button className="register-btn">Register</button>
      </div>
    </nav>
  );
}

export default Navbar;
