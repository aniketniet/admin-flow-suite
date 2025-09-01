// src/components/AuthRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import Cookies from "js-cookie";

export const AuthRoute = () => {
  const token = Cookies.get("admin_token") || Cookies.get("vendor_token");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

// src/components/AdminRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import Cookies from "js-cookie";

export const AdminRoute = () => {
  const token = Cookies.get("admin_token");
  const role = (Cookies.get("user_role") || "").toLowerCase();
  return token && role === "admin" ? <Outlet /> : <Navigate to="/login" replace />;
};

// src/components/VendorRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import Cookies from "js-cookie";

export const VendorRoute = () => {
  const token = Cookies.get("vendor_token");
  const role = (Cookies.get("user_role") || "").toLowerCase();
  return token && role === "vendor" ? <Outlet /> : <Navigate to="/login" replace />;
};

