import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./OwnerDashboard.css";

const API_BASE_URL = "http://localhost:5000";

function OwnerDashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState({
    stores: [],
    averageRating: 0,
    totalRatings: 0,
    raters: []
  });
  const [sort, setSort] = useState({ sortBy: "updated_at", sortOrder: "DESC" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setError("");
      const params = new URLSearchParams({
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder
      });
      const res = await fetch(`${API_BASE_URL}/api/owner/dashboard?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.message || "Failed to load dashboard.");
        return;
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [token, sort]);

  useEffect(() => {
    if (token) fetchDashboard();
  }, [token, fetchDashboard]);

  const toggleSort = (field) => {
    setSort((prev) => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "ASC" ? "DESC" : "ASC"
    }));
  };

  const renderSortIcon = (field) => {
    if (sort.sortBy !== field) return " ↕";
    return sort.sortOrder === "ASC" ? " ↑" : " ↓";
  };

  if (loading) {
    return <div className="owner-container">Loading Store Owner Dashboard...</div>;
  }

  return (
    <div className="owner-container">
      <div className="owner-header">
        <div>
          <h1>Store Owner Dashboard</h1>
          <p>Welcome back, {user?.name}. Track your store performance and customer ratings.</p>
        </div>
        <Link to="/profile" className="owner-profile-link">
          Update Password / Profile
        </Link>
      </div>

      {error && <div className="owner-error">{error}</div>}

      {/* Summary Stats */}
      <div className="owner-stats-grid">
        <div className="owner-stat-card">
          <span className="owner-stat-label">Average Rating</span>
          <strong className="owner-stat-value">
            ★ {Number(data.averageRating).toFixed(1)}
          </strong>
        </div>
        <div className="owner-stat-card">
          <span className="owner-stat-label">Total Ratings Received</span>
          <strong className="owner-stat-value">{data.totalRatings}</strong>
        </div>
        <div className="owner-stat-card">
          <span className="owner-stat-label">Assigned Stores</span>
          <strong className="owner-stat-value">{data.stores.length}</strong>
        </div>
      </div>

      {/* Assigned Stores List */}
      <div className="owner-card">
        <h2>My Store(s)</h2>
        {data.stores.length === 0 ? (
          <p className="owner-empty">
            No store has been assigned to your account yet. Contact the System Administrator.
          </p>
        ) : (
          <div className="owner-stores-grid">
            {data.stores.map((store) => (
              <div key={store.id} className="owner-store-box">
                <h3>{store.name}</h3>
                <p>{store.email || "No email"}</p>
                <p>{store.address}</p>
                <span className="owner-store-badge">
                  ★ {Number(store.average_rating).toFixed(1)} ({store.total_ratings} ratings)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users Who Rated */}
      <div className="owner-card">
        <h2>Users Who Rated Your Store</h2>
        <div className="owner-table-wrapper">
          <table className="owner-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("user_name")}>
                  User Name{renderSortIcon("user_name")}
                </th>
                <th onClick={() => toggleSort("user_email")}>
                  Email{renderSortIcon("user_email")}
                </th>
                <th>Address</th>
                {data.stores.length > 1 && (
                  <th onClick={() => toggleSort("store_name")}>
                    Store{renderSortIcon("store_name")}
                  </th>
                )}
                <th onClick={() => toggleSort("rating")}>
                  Rating{renderSortIcon("rating")}
                </th>
                <th>Review</th>
                <th onClick={() => toggleSort("updated_at")}>
                  Date{renderSortIcon("updated_at")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.raters.length === 0 ? (
                <tr>
                  <td colSpan={data.stores.length > 1 ? 7 : 6} className="owner-empty-cell">
                    No ratings submitted for your store yet.
                  </td>
                </tr>
              ) : (
                data.raters.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.user_name}</strong></td>
                    <td>{item.user_email}</td>
                    <td>{item.user_address || "—"}</td>
                    {data.stores.length > 1 && <td>{item.store_name}</td>}
                    <td className="owner-stars">
                      {"★".repeat(item.rating)}
                      {"☆".repeat(5 - item.rating)} ({item.rating})
                    </td>
                    <td>{item.review || "—"}</td>
                    <td>{new Date(item.updated_at || item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;