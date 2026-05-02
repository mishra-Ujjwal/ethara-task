import { useAuth } from "./useAuth";

export const useRole = () => {
  const { user } = useAuth();
  return {
    role:       user?.role,
    isAdmin:    user?.role === "admin",
    isManager:  user?.role === "manager",
    isEmployee: user?.role === "employee",
  };
};