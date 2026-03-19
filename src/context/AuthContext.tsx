import React, { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "@/rtk/api/axiosInstance";

interface AuthUser {
  id: number;
  role: string;
  email: string;
  name: string;
  seller_role?: string; // Seller sub-role from personalInfo.adminRole
  isAssignedUser?: boolean; // NEW: True if user is assigned by company admin
  isCompanyAdmin?: boolean; // NEW: True if user is the company admin
  userType?: string; // NEW: "assigned_user" | "company_admin" | null
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  refreshAuth: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  

  const refreshAuth = async () => {
    try {

      const res = await axiosInstance.get("/user/verify-user");


      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.warn("⚠️ Auth verify failed:", error);
      setUser(null);
    } finally {
      setLoading(false); // ✅ Ensures we exit loading always
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
