import { createContext, useState, useEffect } from "react";
import { loginApi, registerApi } from "../api/authApi";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const login = async (credentials) => {
    setLoading(true); setError(null);
    try {
      const { data } = await loginApi(credentials);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg); throw new Error(msg);
    } finally { setLoading(false); }
  };

  const register = async (userData) => {
    setLoading(true); setError(null);
    try {
      const { data } = await registerApi(userData);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg); throw new Error(msg);
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}