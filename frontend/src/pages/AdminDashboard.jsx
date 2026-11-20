import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  validateName,
  validateEmail,
  validateAddress,
  validatePassword
} from "../utils/validators";
import "./AdminDashboard.css";

const API_BASE_URL = "http://localhost:5000";

function AdminDashboard() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("stores");

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalRatings: 0
  });

  // Store Owners dropdown list
  const [storeOwners, setStoreOwners] = useState([]);

  // Stores state
  const [stores, setStores] = useState([]);
  const [storeFilters, setStoreFilters] = useState({ name: "", email: "", address: "" });
  const [storeSort, setStoreSort] = useState({ sortBy: "created_at", sortOrder: "DESC" });
  const [storeForm, setStoreForm] = useState({
    name: "",
    email: "",
    category: "",
    address: "",
    description: "",
    owner_id: ""
  });
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [storeMsg, setStoreMsg] = useState({ type: "", text: "" });

  // Users state
  const [users, setUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({
    name: "",
    email: "",
    address: "",
    role: ""
  });
  const [userSort, setUserSort] = useState({ sortBy: "created_at", sortOrder: "DESC" });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
    role: "USER"
  });
  const [userMsg, setUserMsg] = useState({ type: "", text: "" });
  const [selectedUser, setSelectedUser] = useState(null);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [token]);

  // Fetch Store Owners for dropdown
  const fetchStoreOwners = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users?role=STORE_OWNER`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStoreOwners(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch store owners:", err);
    }
  }, [token]);

  // Fetch Stores
  const fetchStores = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        ...storeFilters,
        sortBy: storeSort.sortBy,
        sortOrder: storeSort.sortOrder
      });
      const res = await fetch(`${API_BASE_URL}/api/admin/stores?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
      }
    } catch (err) {
      console.error("Failed to fetch stores:", err);
    }
  }, [token, storeFilters, storeSort]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        ...userFilters,
        sortBy: userSort.sortBy,
        sortOrder: userSort.sortOrder
      });
      const res = await fetch(`${API_BASE_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, [token, userFilters, userSort]);

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchStoreOwners();
    }
  }, [token, fetchStats, fetchStoreOwners]);

  useEffect(() => {
    if (token) fetchStores();
  }, [token, fetchStores]);

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, fetchUsers]);

  // Sorting toggle helpers
  const toggleStoreSort = (field) => {
    setStoreSort((prev) => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "ASC" ? "DESC" : "ASC"
    }));
  };

  const toggleUserSort = (field) => {
    setUserSort((prev) => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "ASC" ? "DESC" : "ASC"
    }));
  };

  const renderSortIcon = (current, field) => {
    if (current.sortBy !== field) return " ↕";
    return current.sortOrder === "ASC" ? " ↑" : " ↓";
  };

  // Store CRUD handlers
  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    setStoreMsg({ type: "", text: "" });

    if (!storeForm.name.trim() || storeForm.name.trim().length > 60) {
      setStoreMsg({ type: "error", text: "Store name is required (max 60 characters)." });
      return;
    }
    const emailErr = validateEmail(storeForm.email);
    if (emailErr) {
      setStoreMsg({ type: "error", text: emailErr });
      return;
    }
    const addrErr = validateAddress(storeForm.address);
    if (addrErr) {
      setStoreMsg({ type: "error", text: addrErr });
      return;
    }

    const url = editingStoreId
      ? `${API_BASE_URL}/api/admin/stores/${editingStoreId}`
      : `${API_BASE_URL}/api/admin/stores`;
    const method = editingStoreId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify({
          ...storeForm,
          owner_id: storeForm.owner_id ? Number(storeForm.owner_id) : null
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setStoreMsg({ type: "error", text: data.message || "Failed to save store." });
        return;
      }

      setStoreMsg({ type: "success", text: data.message });
      setStoreForm({
        name: "",
        email: "",
        category: "",
        address: "",
        description: "",
        owner_id: ""
      });
      setEditingStoreId(null);
      fetchStores();
      fetchStats();
    } catch (err) {
      setStoreMsg({ type: "error", text: "Unable to connect to server." });
    }
  };

  const handleEditStore = (store) => {
    setEditingStoreId(store.id);
    setStoreForm({
      name: store.name || "",
      email: store.email || "",
      category: store.category || "",
      address: store.address || "",
      description: store.description || "",
      owner_id: store.owner_id ? String(store.owner_id) : ""
    });
    setStoreMsg({ type: "", text: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteStore = async (id) => {
    if (!window.confirm("Delete this store and all its ratings?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stores/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStores();
        fetchStats();
      }
    } catch (err) {
      console.error("Delete store failed:", err);
    }
  };

  // User creation handler
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setUserMsg({ type: "", text: "" });

    const nameErr = validateName(userForm.name);
    if (nameErr) return setUserMsg({ type: "error", text: nameErr });

    const emailErr = validateEmail(userForm.email);
    if (emailErr) return setUserMsg({ type: "error", text: emailErr });

    const addrErr = validateAddress(userForm.address);
    if (addrErr) return setUserMsg({ type: "error", text: addrErr });

    const pwErr = validatePassword(userForm.password);
    if (pwErr) return setUserMsg({ type: "error", text: pwErr });

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(userForm)
      });
      const data = await res.json();

      if (!res.ok) {
        setUserMsg({ type: "error", text: data.message || "Failed to create user." });
        return;
      }

      setUserMsg({ type: "success", text: data.message });
      setUserForm({ name: "", email: "", address: "", password: "", role: "USER" });
      fetchUsers();
      fetchStats();
      fetchStoreOwners();
    } catch (err) {
      setUserMsg({ type: "error", text: "Unable to connect to server." });
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>System Administrator Dashboard</h1>
        <p>Manage stores, users, roles, and monitor platform activity.</p>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">Total Users</span>
          <strong className="stat-value">{stats.totalUsers}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">Total Stores</span>
          <strong className="stat-value">{stats.totalStores}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">Submitted Ratings</span>
          <strong className="stat-value">{stats.totalRatings}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "stores" ? "active" : ""}`}
          onClick={() => setActiveTab("stores")}
        >
          Manage Stores ({stats.totalStores})
        </button>
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Manage Users ({stats.totalUsers})
        </button>
      </div>

      {/* STORES TAB */}
      {activeTab === "stores" && (
        <>
          <div className="admin-card">
            <h2>{editingStoreId ? "Edit Store" : "Add New Store"}</h2>
            {storeMsg.text && (
              <div className={`admin-alert ${storeMsg.type}`}>{storeMsg.text}</div>
            )}

            <form onSubmit={handleStoreSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Store Name *</label>
                  <input
                    type="text"
                    placeholder="E.g., Fresh Mart Grocery"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Store Email *</label>
                  <input
                    type="email"
                    placeholder="contact@store.com"
                    value={storeForm.email}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    placeholder="Grocery, Electronics, Clothing..."
                    value={storeForm.category}
                    onChange={(e) => setStoreForm({ ...storeForm, category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Assign Store Owner</label>
                  <select
                    value={storeForm.owner_id}
                    onChange={(e) => setStoreForm({ ...storeForm, owner_id: e.target.value })}
                  >
                    <option value="">— Unassigned —</option>
                    {storeOwners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} ({owner.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address * (max 400 chars)</label>
                <input
                  type="text"
                  placeholder="Full store address"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  placeholder="Short description..."
                  value={storeForm.description}
                  onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingStoreId ? "Update Store" : "Add Store"}
                </button>
                {editingStoreId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditingStoreId(null);
                      setStoreForm({
                        name: "",
                        email: "",
                        category: "",
                        address: "",
                        description: "",
                        owner_id: ""
                      });
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-card">
            <h2>Registered Stores</h2>
            <div className="filter-bar">
              <input
                type="text"
                placeholder="Filter by Name..."
                value={storeFilters.name}
                onChange={(e) => setStoreFilters({ ...storeFilters, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by Email..."
                value={storeFilters.email}
                onChange={(e) => setStoreFilters({ ...storeFilters, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by Address..."
                value={storeFilters.address}
                onChange={(e) => setStoreFilters({ ...storeFilters, address: e.target.value })}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStoreFilters({ name: "", email: "", address: "" })}
              >
                Reset
              </button>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleStoreSort("name")}>
                      Name{renderSortIcon(storeSort, "name")}
                    </th>
                    <th onClick={() => toggleStoreSort("email")}>
                      Email{renderSortIcon(storeSort, "email")}
                    </th>
                    <th onClick={() => toggleStoreSort("address")}>
                      Address{renderSortIcon(storeSort, "address")}
                    </th>
                    <th onClick={() => toggleStoreSort("rating")}>
                      Rating{renderSortIcon(storeSort, "rating")}
                    </th>
                    <th>Owner</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-cell">No stores found.</td>
                    </tr>
                  ) : (
                    stores.map((s) => (
                      <tr key={s.id}>
                        <td><strong>{s.name}</strong></td>
                        <td>{s.email || "—"}</td>
                        <td>{s.address}</td>
                        <td>★ {Number(s.average_rating).toFixed(1)} ({s.total_ratings})</td>
                        <td>{s.owner_name || "Unassigned"}</td>
                        <td className="action-cell">
                          <button className="btn-small" onClick={() => handleEditStore(s)}>
                            Edit
                          </button>
                          <button
                            className="btn-small danger"
                            onClick={() => handleDeleteStore(s.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <>
          <div className="admin-card">
            <h2>Add New User</h2>
            {userMsg.text && (
              <div className={`admin-alert ${userMsg.type}`}>{userMsg.text}</div>
            )}

            <form onSubmit={handleUserSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Full Name * ({userForm.name.trim().length}/60, min 20)
                  </label>
                  <input
                    type="text"
                    placeholder="20–60 characters"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    placeholder="8–16 chars, 1 uppercase, 1 special char"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="USER">Normal User (USER)</option>
                    <option value="ADMIN">System Administrator (ADMIN)</option>
                    <option value="STORE_OWNER">Store Owner (STORE_OWNER)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address * (max 400 chars)</label>
                <input
                  type="text"
                  placeholder="Full user address"
                  value={userForm.address}
                  onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary">
                Create User
              </button>
            </form>
          </div>

          <div className="admin-card">
            <h2>All Users</h2>
            <div className="filter-bar">
              <input
                type="text"
                placeholder="Filter by Name..."
                value={userFilters.name}
                onChange={(e) => setUserFilters({ ...userFilters, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by Email..."
                value={userFilters.email}
                onChange={(e) => setUserFilters({ ...userFilters, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by Address..."
                value={userFilters.address}
                onChange={(e) => setUserFilters({ ...userFilters, address: e.target.value })}
              />
              <select
                value={userFilters.role}
                onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
              >
                <option value="">All Roles</option>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="STORE_OWNER">STORE_OWNER</option>
              </select>
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setUserFilters({ name: "", email: "", address: "", role: "" })
                }
              >
                Reset
              </button>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleUserSort("name")}>
                      Name{renderSortIcon(userSort, "name")}
                    </th>
                    <th onClick={() => toggleUserSort("email")}>
                      Email{renderSortIcon(userSort, "email")}
                    </th>
                    <th onClick={() => toggleUserSort("address")}>
                      Address{renderSortIcon(userSort, "address")}
                    </th>
                    <th onClick={() => toggleUserSort("role")}>
                      Role{renderSortIcon(userSort, "role")}
                    </th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-cell">No users found.</td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td>{u.address || "—"}</td>
                        <td>
                          <span className={`role-pill ${u.role.toLowerCase()}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-small"
                            onClick={() => setSelectedUser(u)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>User Details</h3>
            <div className="modal-details">
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Address:</strong> {selectedUser.address || "Not provided"}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              {selectedUser.role === "STORE_OWNER" && (
                <p>
                  <strong>Store Rating:</strong>{" "}
                  {selectedUser.owner_rating !== null
                    ? `★ ${Number(selectedUser.owner_rating).toFixed(1)}`
                    : "No ratings yet"}
                </p>
              )}
            </div>
            <button className="btn-primary" onClick={() => setSelectedUser(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;