import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const token = localStorage.getItem("token");

  // =========================================================
  // WAIT FOR AUTHENTICATION STATE
  // =========================================================

  if (loading) {
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

  // =========================================================
  // USER NOT LOGGED IN
  // =========================================================

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // =========================================================
  // DETERMINE USER ROLE
  // =========================================================
  //
  // Admin:
  //   user.identity = "admin"
  //
  // Teacher:
  //   user.identity = "staff"
  //   user.staff.role = "teacher"
  //
  // Student:
  //   user.identity = "student"
  //
  // Parent:
  //   user.identity = "parent"
  //
  // =========================================================

  let userRole = user?.identity;

  // Teacher is a Staff identity with Staff role = teacher
  if (
    user?.identity === "staff" &&
    user?.staff?.role === "teacher"
  ) {
    userRole = "teacher";
  }

  // =========================================================
  // ROLE AUTHORIZATION
  // =========================================================

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(userRole)
  ) {
    /*
      The user is authenticated but does not have permission
      to access this route.

      Send them to the correct dashboard based on their role.
    */

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

  // =========================================================
  // AUTHORIZED
  // =========================================================

  return children;
}