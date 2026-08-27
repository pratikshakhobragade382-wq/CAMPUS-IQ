import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const {
    user,
    isLoading,
    isAuthenticated,
  } = useAuth();

  const location = useLocation();

  // Wait until authentication is loaded
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // =====================================================
  // DETERMINE ROLE
  // =====================================================

  let userRole = user?.identity;

  // Teacher
  if (
    user?.identity === "staff" &&
    (
      user?.role === "teacher" ||
      user?.staff?.role === "teacher" ||
      user?.staffRole === "teacher"
    )
  ) {
    userRole = "teacher";
  }

  console.log("ProtectedRoute user:", user);
  console.log("ProtectedRoute resolved role:", userRole);
  console.log("Allowed roles:", allowedRoles);

  // =====================================================
  // AUTHORIZATION
  // =====================================================

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(userRole)
  ) {
    if (userRole === "teacher") {
      return (
        <Navigate
          to="/teacher/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}