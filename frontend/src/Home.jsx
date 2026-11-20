import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./Home.css";

const API_BASE_URL = "http://localhost:5000";

function Home() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [stores, setStores] = useState([]);
  const [userRatingsMap, setUserRatingsMap] = useState({});
  const [draftRatings, setDraftRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState({ storeId: null, type: "", text: "" });
  const [savingStoreId, setSavingStoreId] = useState(null);

  // Search & Sort state
  const [nameSearch, setNameSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "ASC" });

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const storesRes = await fetch(`${API_BASE_URL}/api/stores`);
      if (!storesRes.ok) {
        throw new Error("Failed to load stores.");
      }
      const storesData = await storesRes.json();
      const storeList = Array.isArray(storesData) ? storesData : storesData.stores || [];
      setStores(storeList);

      if (token) {
        const myRatingsRes = await fetch(`${API_BASE_URL}/api/ratings/my-ratings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (myRatingsRes.ok) {
          const myRatingsData = await myRatingsRes.json();
          const ratingsList = myRatingsData.ratings || [];
          const map = {};
          const drafts = {};
          ratingsList.forEach((r) => {
            map[r.store_id] = { id: r.id, rating: r.rating, review: r.review || "" };
            drafts[r.store_id] = r.rating;
          });
          setUserRatingsMap(map);
          setDraftRatings(drafts);
        }
      } else {
        setUserRatingsMap({});
        setDraftRatings({});
      }
    } catch (err) {
      setError("Unable to load stores. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "ASC" ? "DESC" : "ASC"
    }));
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return " ↕";
    return sortConfig.direction === "ASC" ? " ↑" : " ↓";
  };

  const handleRatingSubmit = async (storeId) => {
    if (!token) {
      navigate("/login");
      return;
    }

    const selectedRating = Number(draftRatings[storeId]);
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      setStatusMsg({
        storeId,
        type: "error",
        text: "Select a rating (1–5) first."
      });
      return;
    }

    setSavingStoreId(storeId);
    setStatusMsg({ storeId: null, type: "", text: "" });

    try {
      const existing = userRatingsMap[storeId];
      const res = await fetch(`${API_BASE_URL}/api/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          store_id: storeId,
          rating: selectedRating,
          review: existing?.review || ""
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMsg({
          storeId,
          type: "error",
          text: data.message || "Failed to save rating."
        });
        return;
      }

      setStatusMsg({
        storeId,
        type: "success",
        text: existing ? "Rating updated!" : "Rating submitted!"
      });
      await fetchData();
    } catch (err) {
      setStatusMsg({
        storeId,
        type: "error",
        text: "Server error while saving rating."
      });
    } finally {
      setSavingStoreId(null);
    }
  };

  const filteredAndSortedStores = useMemo(() => {
    const filtered = stores.filter((store) => {
      const matchesName = (store.name || "")
        .toLowerCase()
        .includes(nameSearch.trim().toLowerCase());
      const matchesAddress = (store.address || "")
        .toLowerCase()
        .includes(addressSearch.trim().toLowerCase());
      return matchesName && matchesAddress;
    });

    return [...filtered].sort((a, b) => {
      const dir = sortConfig.direction === "ASC" ? 1 : -1;
      if (sortConfig.key === "rating") {
        return (Number(a.average_rating || 0) - Number(b.average_rating || 0)) * dir;
      }
      const valA = String(a[sortConfig.key] || "").toLowerCase();
      const valB = String(b[sortConfig.key] || "").toLowerCase();
      return valA.localeCompare(valB) * dir;
    });
  }, [stores, nameSearch, addressSearch, sortConfig]);

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1>Discover & Rate Local Stores</h1>
        <p>
          Browse registered stores, check overall ratings, and submit or update your
          1–5 star rating.
        </p>
        {user?.role === "ADMIN" && (
          <Link to="/admin" className="home-role-shortcut">
            Go to Admin Dashboard →
          </Link>
        )}
        {user?.role === "STORE_OWNER" && (
          <Link to="/owner" className="home-role-shortcut">
            Go to Store Owner Dashboard →
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="home-search-card">
        <input
          type="text"
          placeholder="Search by Store Name..."
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search by Address..."
          value={addressSearch}
          onChange={(e) => setAddressSearch(e.target.value)}
        />
        <button
          type="button"
          className="home-reset-btn"
          onClick={() => {
            setNameSearch("");
            setAddressSearch("");
          }}
        >
          Reset
        </button>
      </div>

      {error && <div className="home-error">{error}</div>}

      {/* Stores Table */}
      <div className="home-table-card">
        {loading ? (
          <p className="home-empty">Loading stores...</p>
        ) : (
          <div className="home-table-wrapper">
            <table className="home-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("name")}>
                    Store Name{renderSortIcon("name")}
                  </th>
                  <th onClick={() => handleSort("address")}>
                    Address{renderSortIcon("address")}
                  </th>
                  <th onClick={() => handleSort("rating")}>
                    Overall Rating{renderSortIcon("rating")}
                  </th>
                  <th>Your Submitted Rating</th>
                  <th>Submit / Modify Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedStores.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="home-empty">
                      No matching stores found.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedStores.map((store) => {
                    const userRating = userRatingsMap[store.id]?.rating || null;
                    const draft = draftRatings[store.id] || "";
                    const isSaving = savingStoreId === store.id;

                    return (
                      <tr key={store.id}>
                        <td>
                          <Link to={`/stores/${store.id}`} className="store-name-link">
                            {store.name}
                          </Link>
                          {store.category && (
                            <span className="store-cat-tag">{store.category}</span>
                          )}
                        </td>
                        <td>{store.address || "—"}</td>
                        <td>
                          <span className="overall-rating-pill">
                            ★ {Number(store.average_rating || 0).toFixed(1)}
                          </span>
                          <span className="rating-count">
                            {" "}
                            ({store.total_ratings || 0})
                          </span>
                        </td>
                        <td>
                          {userRating ? (
                            <span className="user-rating-stars">
                              {"★".repeat(userRating)}
                              {"☆".repeat(5 - userRating)} ({userRating}/5)
                            </span>
                          ) : (
                            <span className="not-rated-text">Not rated yet</span>
                          )}
                        </td>
                        <td>
                          {token ? (
                            <div className="rate-control-wrap">
                              <select
                                className="rate-select"
                                value={draft}
                                onChange={(e) =>
                                  setDraftRatings((prev) => ({
                                    ...prev,
                                    [store.id]: Number(e.target.value)
                                  }))
                                }
                              >
                                <option value="">Rate (1–5)</option>
                                <option value="1">1 ★</option>
                                <option value="2">2 ★★</option>
                                <option value="3">3 ★★★</option>
                                <option value="4">4 ★★★★</option>
                                <option value="5">5 ★★★★★</option>
                              </select>
                              <button
                                type="button"
                                className="rate-submit-btn"
                                disabled={isSaving}
                                onClick={() => handleRatingSubmit(store.id)}
                              >
                                {isSaving
                                  ? "Saving..."
                                  : userRating
                                  ? "Modify Rating"
                                  : "Submit Rating"}
                              </button>
                              {statusMsg.storeId === store.id && (
                                <span className={`rate-feedback ${statusMsg.type}`}>
                                  {statusMsg.text}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Link to="/login" className="login-to-rate-link">
                              Login to Rate
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
