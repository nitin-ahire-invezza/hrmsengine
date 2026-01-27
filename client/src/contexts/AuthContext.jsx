// src/contexts/AuthContext.jsx
import React, { createContext, useState, useCallback, useEffect } from "react";
import secureLocalStorage from "react-secure-storage";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

export const AuthContext = createContext();

const decodeJwt = (token) => {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch (e) {
    console.error("decodeJwt error", e);
    return null;
  }
};

const isTokenExpired = (token, bufferSeconds = 5) => {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  const nowSecs = Date.now() / 1000;
  return decoded.exp <= nowSecs + bufferSeconds;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(() => {
    const raw = secureLocalStorage.getItem("userData");
    if (!raw) return null;
    try {
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  });

  const [tokenType, setTokenType] = useState(() => {
    // if you store tokenType inside userData, you can derive it here
    return null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("accessToken"));

  const logout = useCallback(() => {
    // clear client-side auth & navigate to login
    Cookies.remove("userData");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("@secure.s.userData");
    secureLocalStorage.removeItem("userData");
    setUserData(null);
    setTokenType(null);
    setIsLoggedIn(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  const login = useCallback((accessToken, userObj, tType) => {
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (userObj) secureLocalStorage.setItem("userData", JSON.stringify(userObj));
    if (tType) setTokenType(tType);
    setUserData(userObj || null);
    setIsLoggedIn(true);
  }, []);

  const checkAndLogoutIfExpired = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      if (isLoggedIn) {
        logout();
      }
      return;
    }
    if (isTokenExpired(token)) {
      logout();
    } else {
      if (!isLoggedIn) setIsLoggedIn(true);
    }
  }, [isLoggedIn, logout]);

  // On mount make sure context reflects saved state
  useEffect(() => {
    checkAndLogoutIfExpired();
  }, []); // run once

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userData,
        setUserData,
        login,
        logout,
        tokenType,
        setTokenType,
        checkAndLogoutIfExpired,
        isTokenExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
