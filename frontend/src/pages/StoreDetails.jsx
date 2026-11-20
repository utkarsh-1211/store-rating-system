import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./StoreDetails.css";

const API_BASE_URL = "http://localhost:5000";

function StoreDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [store, setStore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Rating form state
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [hasExistingRating, setHasExistingRating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchStoreData = useCallback(async () => {
    try {
      setPageError("");
      const [storeRes, ratingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/stores/${id}`),
        fetch(`${API_BASE_URL}/api/ratings/store/${id}`)
      ]);

      if (!storeRes.ok) {
        setPageError("Store not found.");
        setLoading(false);
        return;
      }

      const storeData = await storeRes.json();
      const ratingsData = await ratingsRes.json();

      setStore(storeData);
      setRatings(ratingsData.ratings || []);

      // If logged-in user already rated this store, pre-fill the form
      if (user) {
        const myReview = (ratingsData.ratings || []).find(
          (r) => r.user_id === user.id
        );
        if (myReview) {
          setSelectedRating(myReview.rating);
          setReviewText(myReview.review || "");
          setHasExistingRating(true);
        } else {
          setSelectedRating(0);
          setReviewText("");
          setHasExistingRating(false);
        }
      }
    } catch (err) {
      setPageError("Failed to load store details. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (selectedRating < 1 || selectedRating > 5) {
      setFormError("Please select a star rating between 1 and 5.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          store_id: Number(id),
          rating: selectedRating,
          review: reviewText.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || "Could not submit rating.");
        return;
      }

      setFormSuccess(data.message || "Rating saved!");
      await fetchStoreData();
    } catch (err) {
      setFormError("Unable to connect to server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRating = async (ratingId) => {
    setFormError("");
    setFormSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/ratings/${ratingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || "Could not delete rating.");
        return;
      }

      setFormSuccess("Your review was deleted.");
      await fetchStoreData();
    } catch (err) {
      setFormError("Unable to connect to server.");
    }
  };

  if (loading) {
    return (
      <div className="store-details-container">
        <div className="store-details-wrapper">Loading store details...</div>
      </div>
    );
  }

  if (pageError || !store) {
    return (
      <div className="store-details-container">
        <div className="store-details-wrapper">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back to Home
          </button>
          <div className="rating-msg-error">{pageError || "Store not found."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-details-container">
      <div className="store-details-wrapper">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Stores
        </button>

        {/* Store Header Card */}
        <div className="store-hero-card">
          <div className="store-hero-top">
            <div>
              {store.category && (
                <span className="store-category-tag">{store.category}</span>
              )}
              <h1>{store.name}</h1>
              {store.address && (
                <p className="store-address">📍 {store.address}</p>
              )}
            </div>

            <div className="store-avg-box">
              <div className="store-avg-score">★ {store.average_rating || 0}</div>
              <div className="store-avg-count">
                {store.total_ratings || 0}{" "}
                {store.total_ratings === 1 ? "review" : "reviews"}
              </div>
            </div>
          </div>

          {store.description && (
            <p className="store-description">{store.description}</p>
          )}
        </div>

        {/* Rate & Review Form Card */}
        <div className="rating-form-card">
          <h2>{hasExistingRating ? "Update Your Rating" : "Rate This Store"}</h2>

          {formError && <div className="rating-msg-error">{formError}</div>}
          {formSuccess && <div className="rating-msg-success">{formSuccess}</div>}

          {user ? (
            <form onSubmit={handleSubmitRating}>
              <div className="star-selector">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${
                      star <= (hoverRating || selectedRating) ? "active" : ""
                    }`}
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                className="review-textarea"
                placeholder="Write a short review about your experience (optional)..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />

              <button
                type="submit"
                className="submit-rating-btn"
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : hasExistingRating
                  ? "Update Rating"
                  : "Submit Rating"}
              </button>
            </form>
          ) : (
            <p className="login-prompt">
              Please <Link to="/login">log in</Link> to rate and review this store.
            </p>
          )}
        </div>

        {/* Customer Reviews List */}
        <div className="reviews-section-card">
          <h2>Customer Reviews ({ratings.length})</h2>

          {ratings.length === 0 ? (
            <p className="empty-reviews">
              No reviews yet. Be the first to rate this store!
            </p>
          ) : (
            <div className="reviews-list">
              {ratings.map((item) => (
                <div key={item.id} className="review-item">
                  <div className="review-header">
                    <span className="review-author">{item.user_name}</span>
                    <span className="review-stars">
                      {"★".repeat(item.rating)}
                      {"☆".repeat(5 - item.rating)}
                    </span>
                  </div>

                  {item.review && <p className="review-text">{item.review}</p>}

                  <div className="review-footer">
                    <span>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>

                    {user && user.id === item.user_id && (
                      <button
                        type="button"
                        className="delete-review-btn"
                        onClick={() => handleDeleteRating(item.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoreDetails;