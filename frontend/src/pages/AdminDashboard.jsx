import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

const API_BASE_URL = "http://localhost:5000";

const EMPTY_FORM = {
  name: "",
  category: "",
  address: "",
  description: ""
};

function AdminDashboard() {
  const { token } = useAuth();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStores = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stores`);
      if (!response.ok) throw new Error("Failed to fetch stores");
      const data = await response.json();
      setStores(data);
    } catch (err) {
      setError("Unable to load stores from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Store name is required.");
      return;
    }

    setSubmitting(true);

    try {
      const url = editingId
        ? `${API_BASE_URL}/api/stores/${editingId}`
        : `${API_BASE_URL}/api/stores`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save store.");
        return;
      }

      setSuccess(
        editingId ? "Store updated successfully!" : "Store added successfully!"
      );
      setFormData(EMPTY_FORM);
      setEditingId(null);
      await fetchStores();
    } catch (err) {
      setError("Unable to connect to server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (store) => {
    setError("");
    setSuccess("");
    setEditingId(store.id);
    setFormData({
      name: store.name || "",
      category: store.category || "",
      address: store.address || "",
      description: store.description || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError("");
  };

  const handleDelete = async (storeId, storeName) => {
    const confirmed = window.confirm(
      `Delete "${storeName}" and all its reviews? This cannot be undone.`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to delete store.");
        return;
      }

      setSuccess("Store deleted successfully.");
      if (editingId === storeId) {
        setEditingId(null);
        setFormData(EMPTY_FORM);
      }
      await fetchStores();
    } catch (err) {
      setError("Unable to connect to server.");
    }
  };

  const totalReviews = stores.reduce(
    (sum, s) => sum + Number(s.total_ratings || 0),
    0
  );

  return (
    <div className="admin-container">
      <div className="admin-wrapper">
        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Add, edit, and manage stores across StoreRate.</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-label">Total Stores</div>
            <div className="admin-stat-value">{stores.length}</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">Total Reviews</div>
            <div className="admin-stat-value">{totalReviews}</div>
          </div>
        </div>

        {/* Add / Edit Store Form */}
        <div className="admin-card">
          <h2>{editingId ? `Edit Store #${editingId}` : "Add New Store"}</h2>

          {error && <div className="admin-msg-error">{error}</div>}
          {success && <div className="admin-msg-success">{success}</div>}

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-row">
              <div className="admin-field">
                <label htmlFor="store-name">Store Name *</label>
                <input
                  id="store-name"
                  name="name"
                  type="text"
                  placeholder="e.g., Fresh Mart Grocery"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="store-category">Category</label>
                <input
                  id="store-category"
                  name="category"
                  type="text"
                  placeholder="e.g., Grocery, Electronics, Cafe"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="store-address">Address</label>
              <input
                id="store-address"
                name="address"
                type="text"
                placeholder="e.g., 42 MG Road, Sector 10"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="store-description">Description</label>
              <textarea
                id="store-description"
                name="description"
                placeholder="Short description of the store..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="admin-submit-btn"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : editingId
                  ? "Update Store"
                  : "Add Store"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Stores Management Table */}
        <div className="admin-card">
          <h2>Manage Stores ({stores.length})</h2>

          {loading ? (
            <p>Loading stores...</p>
          ) : stores.length === 0 ? (
            <p>No stores yet. Add your first store above!</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Rating</th>
                    <th>Reviews</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id}>
                      <td>#{store.id}</td>
                      <td>{store.name}</td>
                      <td>{store.category || "—"}</td>
                      <td>★ {Number(store.average_rating || 0).toFixed(1)}</td>
                      <td>{store.total_ratings || 0}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className="admin-edit-btn"
                            onClick={() => handleEdit(store)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-delete-btn"
                            onClick={() => handleDelete(store.id, store.name)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;