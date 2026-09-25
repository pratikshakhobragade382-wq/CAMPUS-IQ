import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function tokenRequiresPasswordChange() {
  try {
    const token = localStorage.getItem("token");

    if (!token) return false;

    const payload = JSON.parse(
      atob(
        token
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    return payload.mustChangePassword === true;
  } catch {
    return false;
  }
}

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
  // PASSWORD CHANGE REQUIRED
  // =====================================================

  if (tokenRequiresPasswordChange()) {
    return (
      <Navigate
        to="/change-password"
        replace
      />
    );
  }

  // =====================================================
  // DETERMINE USER ROLE
  // =====================================================

  let userRole = String(
    user?.identity ||
      user?.role ||
      user?.staff?.role ||
      user?.staffRole ||
      ""
  ).toLowerCase();

  // -----------------------------------------------------
  // TEACHER
  // Backend identity may be "staff"
  // Actual staff role may be "teacher"
  // -----------------------------------------------------

  if (
    String(user?.identity || "").toLowerCase() === "staff" &&
    (
      String(user?.role || "").toLowerCase() === "teacher" ||
      String(user?.staff?.role || "").toLowerCase() === "teacher" ||
      String(user?.staffRole || "").toLowerCase() === "teacher"
    )
  ) {
    userRole = "teacher";
  }

  // -----------------------------------------------------
  // ADMIN
  // Some backend responses may use:
  //
  // identity: "admin"
  // OR
  // identity: "staff", role: "admin"
  // OR
  // staffRole: "admin"
  // -----------------------------------------------------

  if (
    String(user?.identity || "").toLowerCase() === "admin" ||
    String(user?.role || "").toLowerCase() === "admin" ||
    String(user?.staff?.role || "").toLowerCase() === "admin" ||
    String(user?.staffRole || "").toLowerCase() === "admin"
  ) {
    userRole = "admin";
  }

  // =====================================================
  // DEBUG
  // =====================================================

  console.log(
    "ProtectedRoute user:",
    user
  );

  console.log(
    "ProtectedRoute resolved role:",
    userRole
  );

  console.log(
    "Allowed roles:",
    allowedRoles
  );

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
    // PRINCIPAL
    // ---------------------------------------------------

    if (userRole === "principal") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    // ---------------------------------------------------
    // MANAGEMENT
    // ---------------------------------------------------

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