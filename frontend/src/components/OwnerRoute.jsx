import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function OwnerRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem" }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "STORE_OWNER") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default OwnerRoute;