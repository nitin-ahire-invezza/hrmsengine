// components/ProtectedRoute.js

import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const ProtectedRoute = ({ element: Component, ...rest }) => {
  // Subscribing to AuthContext and redirect if user is not logged in
  const { isLoggedIn } = useContext(AuthContext);

  if (!isLoggedIn) return <Navigate to="/login" />;

  return <Component {...rest} />;
};

export default ProtectedRoute;
