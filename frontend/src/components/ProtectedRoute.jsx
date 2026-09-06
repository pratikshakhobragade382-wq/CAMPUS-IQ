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

  // =====================================================
  // WAIT FOR AUTHENTICATION
  // =====================================================

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

  // =====================================================
  // NOT LOGGED IN
  // =====================================================

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/portal-login"
        state={{ from: location }}
        replace
      />
    );
  }

  // =====================================================
  // DETERMINE USER ROLE
  // =====================================================

  let userRole = String(user?.identity || "").toLowerCase();

  // -----------------------------------------------------
  // TEACHER
  // Backend identity = "staff"
  // Actual staff role = "teacher"
  // -----------------------------------------------------

  if (
    userRole === "staff" &&
    (
      user?.role === "teacher" ||
      user?.staff?.role === "teacher" ||
      user?.staffRole === "teacher"
    )
  ) {
    userRole = "teacher";
  }

  // =====================================================
  // DEBUG
  // =====================================================

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
    // ---------------------------------------------------
    // TEACHER
    // ---------------------------------------------------

    if (userRole === "teacher") {
      return (
        <Navigate
          to="/teacher/dashboard"
          replace
        />
      );
    }

    // ---------------------------------------------------
    // PARENT
    // ---------------------------------------------------

    if (userRole === "parent") {
      return (
        <Navigate
          to="/parent/dashboard"
          replace
        />
      );
    }

    // ---------------------------------------------------
    // ADMIN
    // ---------------------------------------------------

    if (userRole === "admin") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    // ---------------------------------------------------
    // OTHER VALID ROLES
    // ---------------------------------------------------

    if (userRole === "principal") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    if (userRole === "management") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    // ---------------------------------------------------
    // UNKNOWN ROLE
    // ---------------------------------------------------

    return (
      <Navigate
        to="/portal-login"
        replace
      />
    );
  }

  // =====================================================
  // ACCESS GRANTED
  // =====================================================

  return children;
}