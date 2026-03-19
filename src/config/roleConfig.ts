
// 0. System Features Configuration
export interface SystemFeature {
  enabled: boolean;
  name: string;
  description: string;
  icon?: string;
}

// Features that can be enabled/disabled in your system
export const SYSTEM_FEATURES: Record<string, SystemFeature> = {
  product: {
    enabled: true,
    name: "Product Management",
    description: "Core product listing and management",
    icon: "📦"
  },
  bidding: {
    enabled: true,
    name: "Bidding System",
    description: "Bid placement, acceptance, and management",
    icon: "💰"
  },
  chat: {
    enabled: true,
    name: "Chat System",
    description: "Real-time messaging between buyers and sellers",
    icon: "💬"
  },
  reports: {
    enabled: true,
    name: "Reports & Analytics",
    description: "Generate and export business reports",
    icon: "📊"
  },
  settings: {
    enabled: true,
    name: "System Settings",
    description: "Application configuration and preferences",
    icon: "⚙️"
  },
  userManagement: {
    enabled: true,
    name: "User Management",
    description: "Manage team members and permissions",
    icon: "👥"
  },
  payment: {
    enabled: false, // Disabled by default
    name: "Payment Processing",
    description: "Handle payments and transactions",
    icon: "💳"
  },
  inspection: {
    enabled: false, // Disabled by default
    name: "Inspection Workflow",
    description: "Product inspection and verification steps",
    icon: "🔍"
  },
  steps: {
    enabled: true,
    name: "Workflow Steps",
    description: "Step-by-step product submission workflow",
    icon: "📋"
  }
};

// 1. Define all available roles (TypeScript type)
export type SellerRole =
  | 'admin'
  | 'product_manager'
  | 'product_viewer'
  | 'bid_manager'        // Future role
  | 'payment_manager'    // Future role
  | 'reports_viewer';    // Future role

// 2. Feature-based permission structure
export interface FeaturePermissions {
  // Product Management Feature
  product: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };

  // Bidding System Feature
  bidding: {
    view: boolean;
    accept: boolean;
    reject: boolean;
    edit: boolean;
  };

  // Chat System Feature
  chat: {
    view: boolean;
    send: boolean;
  };

  // Reports Feature
  reports: {
    view: boolean;
    export: boolean;
  };

  // Settings Feature
  settings: {
    view: boolean;
    edit: boolean;
  };

  // User Management Feature
  userManagement: {
    view: boolean;
    edit: boolean;
  };

  // Payment Processing Feature (disabled by default)
  payment: {
    view: boolean;
    process: boolean;
  };

  // Inspection Workflow Feature (disabled by default)
  inspection: {
    step1: boolean; // Upload Method
    step2: boolean; // Bidding Config
    step3: boolean; // Inspection Price
    step4: boolean; // Inspection Report
    step5: boolean; // Bidding Step
    step6: boolean; // Payment Step
    step7: boolean; // Report Step
    step8: boolean; // Confirmation
  };

  // Workflow Steps Feature (enabled by default)
  steps: {
    step1: boolean; // Upload Method
    step2: boolean; // Bidding Config
    step3: boolean; // Inspection Price
    step4: boolean; // Inspection Report
    step5: boolean; // Bidding Step
    step6: boolean; // Payment Step
    step7: boolean; // Report Step
    step8: boolean; // Confirmation
  };
}

export interface RolePermissions extends FeaturePermissions {}

// 3. FEATURE-BASED ROLE CONFIGURATION
// This dynamically includes only enabled features
export const ROLE_CONFIG: Record<SellerRole, RolePermissions> = {
  // Super Admin - Full Access to all enabled features
  admin: {
    // Core enabled features
    product: { view: true, add: true, edit: true, delete: true },
    bidding: { view: true, accept: true, reject: true, edit: true },
    chat: { view: true, send: true },
    reports: { view: true, export: true },
    settings: { view: true, edit: true },
    userManagement: { view: true, edit: true },

    // Disabled features (won't be shown in UI)
    payment: { view: true, process: true },
    inspection: {
      step1: true, step2: true, step3: true, step4: true,
      step5: true, step6: true, step7: true, step8: true
    },
    steps: {
      step1: true, step2: true, step3: true, step4: true,
      step5: true, step6: true, step7: true, step8: true
    }
  },

  // Product Manager - Product add, all routes, chat, but NOT users permission settings
  product_manager: {
    product: { view: true, add: true, edit: true, delete: true },
    bidding: { view: true, accept: true, reject: true, edit: true },
    chat: { view: true, send: true },
    reports: { view: true, export: true },
    settings: { view: false, edit: false },
    userManagement: { view: false, edit: false }, // NOT users permission settings

    // Disabled features
    payment: { view: false, process: false },
    inspection: {
      step1: true, step2: true, step3: true, step4: true,
      step5: true, step6: true, step7: true, step8: true
    },
    steps: {
      step1: true, step2: true, step3: true, step4: true,
      step5: true, step6: true, step7: true, step8: true
    }
  },

  // Product Viewer - only see products, not add/edit, not users, not permissions, not settings
  product_viewer: {
    product: { view: true, add: false, edit: false, delete: false },
    bidding: { view: false, accept: false, reject: false, edit: false },
    chat: { view: false, send: false },
    reports: { view: false, export: false },
    settings: { view: false, edit: false },
    userManagement: { view: false, edit: false }, // NOT users, permissions, settings

    // Disabled features
    payment: { view: false, process: false },
    inspection: {
      step1: false, step2: false, step3: false, step4: false,
      step5: false, step6: false, step7: false, step8: false
    },
    steps: {
      step1: false, step2: false, step3: false, step4: false,
      step5: false, step6: false, step7: false, step8: false
    }
  },

  // Bid Manager - Bidding-focused role
  bid_manager: {
    product: { view: true, add: false, edit: false, delete: false },
    bidding: { view: true, accept: true, reject: true, edit: false },
    chat: { view: true, send: true },
    reports: { view: true, export: false },
    settings: { view: false, edit: false },
    userManagement: { view: true, edit: true },

    // Disabled features
    payment: { view: true, process: true },
    inspection: {
      step1: false, step2: false, step3: false, step4: false,
      step5: true, step6: true, step7: false, step8: false
    },
    steps: {
      step1: false, step2: false, step3: false, step4: false,
      step5: true, step6: true, step7: false, step8: false
    }
  },

  // Payment Manager - Payment-focused role
  payment_manager: {
    product: { view: true, add: false, edit: false, delete: false },
    bidding: { view: true, accept: false, reject: false, edit: false },
    chat: { view: true, send: true },
    reports: { view: false, export: false },
    settings: { view: false, edit: false },
    userManagement: { view: true, edit: false },

    // Payment feature enabled for this role
    payment: { view: true, process: true },
    inspection: {
      step1: false, step2: false, step3: false, step4: false,
      step5: false, step6: true, step7: false, step8: false
    },
    steps: {
      step1: false, step2: false, step3: false, step4: false,
      step5: false, step6: true, step7: false, step8: false
    }
  },

  // Reports Viewer - Analytics-focused role
  reports_viewer: {
    product: { view: true, add: false, edit: false, delete: false },
    bidding: { view: false, accept: false, reject: false, edit: false },
    chat: { view: true, send: false },
    reports: { view: true, export: false },
    settings: { view: false, edit: false },
    userManagement: { view: true, edit: true },

    // Disabled features
    payment: { view: false, process: false },
    inspection: {
      step1: false, step2: false, step3: false, step4: false,
      step5: false, step6: false, step7: true, step8: false
    },
    steps: {
      step1: false, step2: false, step3: false, step4: false,
      step5: false, step6: false, step7: true, step8: false
    }
  }
};

// 4. Display names for UI
export const ROLE_DISPLAY_NAMES: Record<SellerRole, string> = {
  admin: 'Super Admin',
  product_manager: 'Product Manager',
  product_viewer: 'Product Viewer',
  bid_manager: 'Bid Manager',
  payment_manager: 'Payment Manager',
  reports_viewer: 'Reports Viewer'
};

// 5. Helper functions
export function hasPermission(sellerRole: string, permission: string): boolean {
  const permissions = ROLE_CONFIG[sellerRole as SellerRole];
  if (!permissions) {
    console.warn(`Unknown role: ${sellerRole}, defaulting to product_viewer`);
    const defaultPerms = ROLE_CONFIG.product_viewer;
    const [category, action] = permission.split('.');
    return (defaultPerms[category as keyof RolePermissions] as any)?.[action] || false;
  }

  const [category, action] = permission.split('.');
  return (permissions[category as keyof RolePermissions] as any)?.[action] || false;
}

export function hasAnyPermission(sellerRole: string, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(sellerRole, permission));
}

export function hasAllPermissions(sellerRole: string, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(sellerRole, permission));
}

export function getAvailableRoles(): SellerRole[] {
  return Object.keys(ROLE_CONFIG) as SellerRole[];
}

export function getRolePermissions(sellerRole: string): RolePermissions {
  return ROLE_CONFIG[sellerRole as SellerRole] || ROLE_CONFIG.product_viewer;
}

// NEW: Get enabled features only
export function getEnabledFeatures(): Record<string, SystemFeature> {
  const enabledFeatures: Record<string, SystemFeature> = {};
  Object.entries(SYSTEM_FEATURES).forEach(([key, feature]) => {
    if (feature.enabled) {
      enabledFeatures[key] = feature;
    }
  });
  return enabledFeatures;
}

// NEW: Get permissions for enabled features only
export function getEnabledFeaturePermissions(role: SellerRole): Partial<RolePermissions> {
  const enabledFeatures = getEnabledFeatures();
  const rolePermissions = ROLE_CONFIG[role];

  const enabledPermissions: Partial<RolePermissions> = {};
  Object.keys(enabledFeatures).forEach(featureKey => {
    if (rolePermissions[featureKey as keyof RolePermissions]) {
      (enabledPermissions as any)[featureKey] = rolePermissions[featureKey as keyof RolePermissions];
    }
  });

  return enabledPermissions;
}

export function getPermissionKey(category: string, key: string): string {
  return `${category}.${key}`;
}

