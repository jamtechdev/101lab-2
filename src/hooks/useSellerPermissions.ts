import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGetUserProfileQuery, useGetUserTypeAndRoleQuery, apiSlice } from '@/rtk/slices/apiSlice';
import { useGetCompanyPermissionsQuery } from '@/rtk/slices/permissionApiSlice';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  ROLE_CONFIG,
  SellerRole,
  getRolePermissions
} from '@/config/roleConfig';
import { SITE_TYPE_PROFILE } from '@/config/site';


export const useSellerPermissions = (roleOverride?: SellerRole) => {
  const { user } = useAuth();
  const userId = localStorage.getItem("userId") || user?.id?.toString() || "";

  // NEW: Check if user has assigned roles from login (highest priority for assigned users)
  const userRoleFromLogin = useMemo(() => {
    const loginUserData = localStorage.getItem('userData');
    if (loginUserData) {
      try {
        const parsedData = JSON.parse(loginUserData);

        // Your actual structure: parsedData.data.user / parsedData.data.companyDetails
        const loginUser = parsedData?.data?.user;
        const companyDetails = parsedData?.data?.companyDetails;

        // 1) If user has userRoles, use first one
        if (loginUser?.userRoles && loginUser.userRoles.length > 0) {
          const primaryRole = loginUser.userRoles[0];
          if (
            primaryRole.role_key &&
            ['admin', 'product_manager', 'product_viewer'].includes(primaryRole.role_key)
          ) {
            return primaryRole.role_key as SellerRole;
          }
        }

        // 2) If user or companyDetails show company_admin / isCompanyAdmin, treat as admin
        if (
          loginUser?.userType === 'company_admin' ||
          loginUser?.isCompanyAdmin ||
          companyDetails?.userType === 'company_admin' ||
          companyDetails?.isCompanyAdmin
        ) {
          return 'admin' as SellerRole;
        }
      } catch (error) {
        console.warn('Error parsing userData for role detection:', error);
      }
    }

    // 3) Extra fallback: use plain localStorage flags set at login
    const isCompanyAdminLS = localStorage.getItem('isCompanyAdmin') === 'true';
    const userTypeLS = localStorage.getItem('userType');
    if (isCompanyAdminLS || userTypeLS === 'company_admin') {
      return 'admin' as SellerRole;
    }

    // 4) Fallback: check AuthContext user
    if (user?.userType === 'company_admin' || user?.isCompanyAdmin) {
      return 'admin' as SellerRole;
    }

    return null;
  }, [user]);

  // Get adminRole from localStorage (fallback for non-assigned users)
  const currentAdminRole = useMemo(() => {
    const storedRole = localStorage.getItem("adminRole");
    if (storedRole && ['admin', 'product_manager', 'product_viewer'].includes(storedRole)) {
      return storedRole as SellerRole;
    }
    return null;
  }, []);


  const [storedCurrentCompanyTaxId, setStoredCurrentCompanyTaxId] = useState<string | null>(localStorage.getItem("currentCompanyTaxId"));
  const [storedCompanyTaxIdNumber, setStoredCompanyTaxIdNumber] = useState<string | null>(localStorage.getItem("companyTaxIdNumber"));
  const [storedCompanyName, setStoredCompanyName] = useState<string | null>(localStorage.getItem("companyName"));

  // Listen for localStorage changes (for company switching)
  useEffect(() => {
    const handleStorageChange = () => {
      const newCompanyTaxId = localStorage.getItem("currentCompanyTaxId");
      const newCompanyTaxIdNumber = localStorage.getItem("companyTaxIdNumber");
      const newCompanyName = localStorage.getItem("companyName");

      // Only update if values actually changed
      if (newCompanyTaxId !== storedCurrentCompanyTaxId ||
          newCompanyTaxIdNumber !== storedCompanyTaxIdNumber ||
          newCompanyName !== storedCompanyName) {

        setStoredCurrentCompanyTaxId(newCompanyTaxId);
        setStoredCompanyTaxIdNumber(newCompanyTaxIdNumber);
        setStoredCompanyName(newCompanyName);

        // Invalidate permission queries when company context changes
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          // Dispatch custom event to trigger permission refetch
          window.dispatchEvent(new CustomEvent('invalidatePermissions'));
        }
      }
    };

    // Listen for custom company switch event
    window.addEventListener('companySwitched', handleStorageChange);

    // Also listen for storage events (in case of multi-tab scenarios)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('companySwitched', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [storedCurrentCompanyTaxId, storedCompanyTaxIdNumber, storedCompanyName]);

  // Try to read from userData if needed
  const loginUserDataRaw = localStorage.getItem("userData");
  let taxIdFromLogin: string | null = null;
  let companyNameFromLogin: string | null = null;

  if (loginUserDataRaw) {
    try {
      const parsed = JSON.parse(loginUserDataRaw);
      const loginUser = parsed?.data?.user;
      const companyDetails = parsed?.data?.companyDetails;
      taxIdFromLogin =
        companyDetails?.companyTaxIdNumber || loginUser?.companyTaxIdNumber || null;
      companyNameFromLogin =
        companyDetails?.companyName || loginUser?.companyName || null;
    } catch (e) {
      console.warn("Failed to parse userData for company info", e);
    }
  }

  const currentCompanyTaxId =
    storedCurrentCompanyTaxId ||
    storedCompanyTaxIdNumber ||
    taxIdFromLogin ||
    "";

  const currentCompanyName =
    storedCompanyName ||
    companyNameFromLogin ||
    "";

  // Build query string with company context if available (type from env)
  const baseQuery = `${userId}?type=${SITE_TYPE_PROFILE}`;
  const queryString = currentCompanyTaxId
    ? `${baseQuery}&companyTaxIdNumber=${currentCompanyTaxId}`
    : currentCompanyName
    ? `${baseQuery}&companyName=${encodeURIComponent(currentCompanyName)}`
    : baseQuery;

  // Fetch profile as fallback (only if no role found from login or localStorage)
  const { data: profileData, isLoading: isLoadingProfile } = useGetUserProfileQuery(queryString, {
    skip: !userId || !!userRoleFromLogin || !!currentAdminRole, // Skip if role already found
  });

  // Fetch user type and role for real-time permission checks
  const { data: userTypeRoleData, isLoading: isLoadingUserTypeRole, refetch: refetchUserTypeRole } = useGetUserTypeAndRoleQuery();



  // Refetch permissions when company mode changes
  useEffect(() => {
    const handleCompanySwitch = () => {
      console.log('Company switched - refetching permissions');
      refetchUserTypeRole();
    };

    window.addEventListener('companySwitched', handleCompanySwitch);
    return () => window.removeEventListener('companySwitched', handleCompanySwitch);
  }, [refetchUserTypeRole]);

  // Extract seller_role from profile API response (fallback)
  const sellerRoleFromProfile = useMemo(() => {
    if (profileData?.success && profileData?.data?.personalInfo?.adminRole) {
      return profileData.data.personalInfo.adminRole as SellerRole;
    }
    return null;
  }, [profileData]);

  // Enhanced role detection using getUserTypeAndRole API
  const enhancedRoleFromApi = useMemo(() => {
    if (userTypeRoleData?.success && userTypeRoleData?.data) {
      const { userType, role, companyRole, permissions } = userTypeRoleData.data;

      // Use company role if available (higher priority for company-specific permissions)
      if (companyRole) {
        if (['admin', 'product_manager', 'product_viewer'].includes(companyRole)) {
          return companyRole as SellerRole;
        }
      }

      // Fallback to general role
      if (role && ['admin', 'product_manager', 'product_viewer'].includes(role)) {
        return role as SellerRole;
      }

      // Check user type for additional context
      if (userType === 'company_admin') {
        return 'admin' as SellerRole;
      }
    }
    return null;
  }, [userTypeRoleData]);

  // Priority: roleOverride > UserRole from login > getUserTypeAndRole API > localStorage adminRole > Profile API > AuthContext > default
  const sellerRole = useMemo(() => {
    if (roleOverride) return roleOverride;


    const isNormalSellerMode = !storedCompanyName && !storedCurrentCompanyTaxId && !storedCompanyTaxIdNumber;
    if (isNormalSellerMode) {
      // Normal seller mode = full admin access (all permissions)
      console.log('Normal seller mode detected - granting full admin access');
      return 'admin' as SellerRole;
    }


    // Primary source: UserRole from login response (for assigned users)
    if (userRoleFromLogin) {
      console.log('Using login-based role:', userRoleFromLogin);
      return userRoleFromLogin;
    }
    // Enhanced API-based role detection
    if (enhancedRoleFromApi) {
      console.log('Using API-based role:', enhancedRoleFromApi);
      return enhancedRoleFromApi;
    }
    // Secondary source: adminRole from localStorage (for company admins and legacy users)
    if (currentAdminRole) {
      console.log('Using localStorage adminRole:', currentAdminRole);
      return currentAdminRole;
    }

    // In company mode, if no assigned roles found, default to product_manager instead of product_viewer
    // This gives reasonable permissions for users who have company access but no specific role assignment
    console.log('No assigned role found in company mode - defaulting to product_manager');
    return 'product_manager' as SellerRole;
    // Fallback: AuthContext
    if (user?.seller_role) return user.seller_role as SellerRole;
    // Fallback: localStorage sellerRole (for testing/RoleTestPage)
    const testRole = localStorage.getItem('sellerRole');
    if (testRole && ['admin', 'product_manager', 'product_viewer'].includes(testRole)) {
      return testRole as SellerRole;
    }
    // Default: product_viewer
    return 'product_viewer' as SellerRole;
  }, [roleOverride, userRoleFromLogin, enhancedRoleFromApi, currentAdminRole, sellerRoleFromProfile, user?.seller_role]);
  
  const permissions = useMemo(() => {
    const perms = getRolePermissions(sellerRole);
    console.log('useSellerPermissions: sellerRole:', sellerRole, 'permissions:', perms);
    return perms;
  }, [sellerRole]);

  // Determine role ID for company permissions query
  const roleIdForCompany = useMemo(() => {
    if (userTypeRoleData?.success && userTypeRoleData?.data?.rolePermissionOverrides?.role_id) {
      return userTypeRoleData.data.rolePermissionOverrides.role_id;
    }
    if (userTypeRoleData?.success && userTypeRoleData?.data?.userRoles?.[0]?.role_id) {
      return userTypeRoleData.data.userRoles[0].role_id;
    }
    return null;
  }, [userTypeRoleData]);

  // Fetch company-specific permission overrides (Tier 3 - highest priority)
  const companyIdentifier = currentCompanyName || currentCompanyTaxId;
  const { data: companyPermissionsData, isLoading: isLoadingCompanyPermissions } = useGetCompanyPermissionsQuery(
    { 
      companyIdentifier, 
      roleId: roleIdForCompany || undefined 
    },
    { 
      skip: !companyIdentifier || !roleIdForCompany || sellerRole === 'admin' // Skip for admin (has all permissions)
    }
  );

  // THREE-TIER PERMISSION MERGING
  const enhancedPermissions = useMemo(() => {
    // TIER 1: Start with static base permissions from ROLE_CONFIG
    const basePerms = getRolePermissions(sellerRole);
    
    // Special case: Admin always has all permissions from static config
    if (sellerRole === 'admin') {
      return basePerms;
    }

    // Deep clone to avoid mutating the original
    const merged = JSON.parse(JSON.stringify(basePerms));

    // Normalize backend permission keys to frontend permission keys
    // Backend uses: create/delete/edit/view
    // Frontend uses: add/delete/edit/view (for product + bidding + userManagement)
    const normalizePermissionKey = (permissionKey: string): string => {
      const [category, action] = permissionKey.split('.');
      if (!category || !action) return permissionKey;

      // Map common backend verbs to frontend verbs
      if (action === 'create') return `${category}.add`;
      return permissionKey;
    };

    if (userTypeRoleData?.success && userTypeRoleData?.data?.permissions && Array.isArray(userTypeRoleData.data.permissions)) {
      console.log('Applying direct permissions from API for role:', sellerRole, userTypeRoleData.data.permissions);

      // For assigned users, start with all permissions false, then enable only allowed ones
      if (userTypeRoleData.data.userType === 'assigned_user') {
        console.log('Assigned user detected - resetting all permissions to false first');
        // Reset all permissions to false for assigned users
        Object.keys(merged).forEach(category => {
          if (typeof merged[category as keyof typeof merged] === 'object') {
            Object.keys(merged[category as keyof typeof merged] as any).forEach(action => {
              (merged as any)[category][action] = false;
            });
          }
        });
      }

      // Now enable only the allowed permissions from API
      const directPermissions = userTypeRoleData.data.permissions;
      directPermissions.forEach((permissionKey: string) => {
        const normalizedKey = normalizePermissionKey(permissionKey);
        const parts = normalizedKey.split('.');

        if (parts.length === 2) {
          const [category, action] = parts;

          // Only apply if category exists in base permissions structure
          if (merged[category as keyof typeof merged]) {
            // Set permission to true for allowed permissions from API
            if ((merged[category as keyof typeof merged] as any)?.[action] !== undefined) {
              (merged as any)[category][action] = true;
              console.log(`Enabled permission: ${category}.${action}`);
            }
          }
        }
      });
    }


    if (userTypeRoleData?.success && userTypeRoleData?.data?.rolePermissionOverrides?.permissions) {
      const adminRoleOverrides = userTypeRoleData.data.rolePermissionOverrides.permissions;
      
      adminRoleOverrides.forEach((perm: any) => {
        const { permission_key, is_allowed } = perm;
        const normalizedKey = normalizePermissionKey(permission_key);
        const parts = normalizedKey.split('.');
        
        if (parts.length === 2) {
          const [category, action] = parts;
          const isAllowed = is_allowed === 1; // Convert 0/1 to boolean
          
          // Only apply if category exists in base permissions structure
          if (merged[category as keyof typeof merged]) {
            // Override static permission with admin-assigned permission
            if ((merged[category as keyof typeof merged] as any)?.[action] !== undefined) {
              (merged as any)[category][action] = isAllowed;
            }
          }
        }
      });
    }

    // TIER 3: Apply company-specific permission overrides (highest priority)
    // These are permissions customized by company admin for their company
    if (companyPermissionsData?.success && companyPermissionsData?.data) {
      const companyOverrides = companyPermissionsData.data;
      
      companyOverrides.forEach((override: any) => {
        const { permission_key, is_allowed } = override;
        const normalizedKey = normalizePermissionKey(permission_key);
        const parts = normalizedKey.split('.');
        
        if (parts.length === 2) {
          const [category, action] = parts;
          const isAllowed = is_allowed === 1; // Convert 0/1 to boolean
          
          // Company overrides take highest priority - override everything
          if (merged[category as keyof typeof merged]) {
            if ((merged[category as keyof typeof merged] as any)?.[action] !== undefined) {
              (merged as any)[category][action] = isAllowed;
            }
          }
        }
      });
    }

    return merged;
  }, [sellerRole, userTypeRoleData, companyPermissionsData]);

  // Loading state: include all API calls
  const isLoading = isLoadingUserTypeRole || isLoadingCompanyPermissions || (!currentAdminRole && isLoadingProfile);
  
  // Enhanced permission checkers that use both base permissions and API data
  const checkPermission = useMemo(() => {
    return (permission: string): boolean => {
      if (!permission || typeof permission !== 'string') return false;

      const [category, action] = permission.split('.');
      if (!category || !action) return false;

      // Check enhanced permissions first (includes API overrides)
      const categoryPerms = (enhancedPermissions as any)[category];
      if (categoryPerms && typeof categoryPerms[action] === 'boolean') {
        const hasPerm = categoryPerms[action];
        return hasPerm;
      }

      // Fallback to base permission system
      const basePerm = hasPermission(sellerRole, permission);
      return basePerm;
    };
  }, [enhancedPermissions, sellerRole]);

  const checkAnyPermission = useMemo(() => {
    return (permissionList: string[]): boolean => {
      if (!Array.isArray(permissionList) || permissionList.length === 0) return false;
      return permissionList.some(permission => checkPermission(permission));
    };
  }, [checkPermission]);

  const checkAllPermissions = useMemo(() => {
    return (permissionList: string[]): boolean => {
      if (!Array.isArray(permissionList) || permissionList.length === 0) return false;
      return permissionList.every(permission => checkPermission(permission));
    };
  }, [checkPermission]);

  return {
    sellerRole,
    permissions: enhancedPermissions, // Use enhanced permissions
    basePermissions: permissions, // Keep base permissions for backward compatibility
    isLoading,
    isLoadingProfile,
    isLoadingUserTypeRole,
    userTypeRoleData,
    hasPermission: checkPermission, // Enhanced permission checker
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    // Legacy permission checkers (base role system only)
    hasBasePermission: (permission: string) => hasPermission(sellerRole, permission),
    hasAnyBasePermission: (permissions: string[]) => hasAnyPermission(sellerRole, permissions),
    hasAllBasePermissions: (permissions: string[]) => hasAllPermissions(sellerRole, permissions),
    // Role checkers
    isAdmin: sellerRole === 'admin',
    isProductManager: sellerRole === 'product_manager',
    isProductViewer: sellerRole === 'product_viewer',
    isBidManager: sellerRole === 'bid_manager',
    isPaymentManager: sellerRole === 'payment_manager',
    isReportsViewer: sellerRole === 'reports_viewer',
  };
};

