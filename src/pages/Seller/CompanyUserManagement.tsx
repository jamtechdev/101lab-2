import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import axiosInstance from '@/rtk/api/axiosInstance';
import { useGetUsersQuery, useCreateUserByAdminMutation, useAssignUserToCompanyMutation, useUpdateUserStatusMutation } from '@/rtk/slices/apiSlice';
import { Search, UserPlus, Building2, Shield, User, ChevronLeft, ChevronRight, Edit, X } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useSellerPermissions } from '@/hooks/useSellerPermissions';

interface User {
    id: number;
    email: string;
    name: string;
    adminRole?: string;
    status?: string;
}

const CompanyUserManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [assignFormData, setAssignFormData] = useState({
        companyName: '',
        companyTaxIdNumber: '',
        adminRole: 'product_viewer' as 'product_manager' | 'product_viewer',
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        name: '',
        email: '',
        password: '',
        adminRole: 'product_viewer' as 'product_manager' | 'product_viewer',
        phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [showUnassignedUsersModal, setShowUnassignedUsersModal] = useState(false);
    const [unassignedUsersPage, setUnassignedUsersPage] = useState(1);
    const [unassignedSearchTerm, setUnassignedSearchTerm] = useState('');
    const [debouncedUnassignedSearch, setDebouncedUnassignedSearch] = useState('');
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editFormData, setEditFormData] = useState({
        adminRole: 'product_viewer' as 'product_manager' | 'product_viewer',
    });

    // Get current company info from localStorage
    const companyName = localStorage.getItem('companyName') || '';
    const companyTaxIdNumber = localStorage.getItem('companyTaxIdNumber') || '';
    
    // Get user role and permissions
    const { sellerRole, isAdmin, isProductManager, isProductViewer } = useSellerPermissions();
    const adminRole = localStorage.getItem('adminRole') as 'admin' | 'product_manager' | 'product_viewer' | null;
    
    // Determine access based on adminRole (from login) or sellerRole (from permissions hook)
    const canCreateUsers = adminRole === 'admin' || adminRole === 'product_manager' || isAdmin || isProductManager;
    const canAssignUsers = adminRole === 'admin' || adminRole === 'product_manager' || isAdmin || isProductManager;
    const canEditUsers = adminRole === 'admin' || adminRole === 'product_manager' || isAdmin || isProductManager;
    const canManageUsers = adminRole === 'admin' || adminRole === 'product_manager' || isAdmin || isProductManager;

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(1); // Reset to first page when searching
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Debounce unassigned users search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedUnassignedSearch(unassignedSearchTerm);
            setUnassignedUsersPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [unassignedSearchTerm]);

    // Fetch users from API with pagination and search - only assigned users and buyers/sellers with company association
    const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useGetUsersQuery({
        page,
        limit,
        search: debouncedSearchTerm || undefined,
        assignedOnly: true, // Only fetch assigned users (not company admins) and users with company association
        companyName: companyName || undefined, // Filter by company name
        companyTaxIdNumber: companyTaxIdNumber || undefined, // Filter by company tax ID
    });

    // Fetch unassigned users for the modal (without assignedOnly filter)
    // Using a separate query with skip option to only fetch when modal is open
    const unassignedQueryParams = {
        page: unassignedUsersPage,
        limit: 10,
        search: debouncedUnassignedSearch || undefined,
        assignedOnly: false, // Get all users
    };
    
    const { data: unassignedUsersData, isLoading: isLoadingUnassigned } = useGetUsersQuery(
        unassignedQueryParams,
        { skip: !showUnassignedUsersModal } // Only fetch when modal is open
    );
    const [createUserMutation, { isLoading: isCreating }] = useCreateUserByAdminMutation();
    const [assignUserMutation, { isLoading: isAssigning }] = useAssignUserToCompanyMutation();
    const [updateUserStatusMutation, { isLoading: isUpdatingStatus }] = useUpdateUserStatusMutation();

    // Pre-fill company info
    React.useEffect(() => {
        if (companyName && companyTaxIdNumber) {
            setAssignFormData(prev => ({
                ...prev,
                companyName,
                companyTaxIdNumber,
            }));
            setCreateFormData(prev => ({
                ...prev,
                companyName,
                companyTaxIdNumber,
            }));
        }
    }, [companyName, companyTaxIdNumber]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleStatusToggle = async (userId: number, currentStatus: string) => {
        try {
            // Map status: approved -> pending, pending/anything else -> approved (same as admin)
            const newStatus = currentStatus === "approved" ? "pending" : "approved";

            await updateUserStatusMutation({
                userId,
                status: newStatus,
            }).unwrap();

            toast.success(`User status updated to ${newStatus}`);
            refetchUsers();
        } catch (error: any) {
            console.error('Error updating user status:', error);
            toast.error(error?.data?.message || error?.message || 'Failed to update user status');
        }
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSelectUser = (user: any) => {
        setSelectedUser({
            id: user.user_id,
            email: user.email,
            name: user.name,
            adminRole: user.meta?.adminRole,
        });
        setShowAssignForm(true);
        setAssignFormData({
            companyName: companyName,
            companyTaxIdNumber: companyTaxIdNumber,
            adminRole: (user.meta?.adminRole === 'product_manager' ? 'product_manager' : 'product_viewer') as 'product_manager' | 'product_viewer',
        });
    };

    const handleQuickAssign = async (user: any, role: 'product_manager' | 'product_viewer' = 'product_viewer') => {
        try {
            const result = await assignUserMutation({
                userId: user.user_id,
                data: {
                    companyName: companyName,
                    companyTaxIdNumber: companyTaxIdNumber,
                    adminRole: role,
                },
            }).unwrap();

            if (result?.success) {
                toast.success(`${user.name} assigned to your company successfully!`);
                refetchUsers();
                // The unassigned list will update automatically when modal reopens
            } else {
                toast.error(result?.message || 'Failed to assign user');
            }
        } catch (error: any) {
            console.error('Error assigning user:', error);
            toast.error(error?.data?.message || error?.message || 'Failed to assign user to company');
        }
    };

    const handleEditUser = (user: any) => {
        setEditingUser(user);
        setEditFormData({
            adminRole: (user.meta?.adminRole === 'product_manager' ? 'product_manager' : 'product_viewer') as 'product_manager' | 'product_viewer',
        });
    };

    const handleUpdateUserRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const result = await assignUserMutation({
                userId: editingUser.user_id,
                data: {
                    companyName: companyName,
                    companyTaxIdNumber: companyTaxIdNumber,
                    adminRole: editFormData.adminRole,
                },
            }).unwrap();

            if (result?.success) {
                toast.success('User role updated successfully!');
                setEditingUser(null);
                refetchUsers();
            } else {
                toast.error(result?.message || 'Failed to update user role');
            }
        } catch (error: any) {
            console.error('Error updating user role:', error);
            toast.error(error?.data?.message || error?.message || 'Failed to update user role');
        }
    };

    const handleAssignUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            const result = await assignUserMutation({
                userId: selectedUser.id,
                data: assignFormData,
            }).unwrap();

            if (result?.success) {
                toast.success('User assigned to your company successfully!');
                setShowAssignForm(false);
                setSelectedUser(null);
                refetchUsers();
                // Refresh unassigned users list if modal is open
                if (showUnassignedUsersModal) {
                    // The query will automatically refetch when modal is reopened
                }
            } else {
                toast.error(result?.message || 'Failed to assign user');
            }
        } catch (error: any) {
            console.error('Error assigning user:', error);
            toast.error(error?.data?.message || error?.message || 'Failed to assign user to company');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const result = await createUserMutation({
                ...createFormData,
                companyName: companyName,
                companyTaxIdNumber: companyTaxIdNumber,
            }).unwrap();

            if (result?.success) {
                toast.success('User created successfully!');
                setShowCreateForm(false);
                setCreateFormData({
                    name: '',
                    email: '',
                    password: '',
                    adminRole: 'product_viewer',
                    phone: '',
                });
                refetchUsers();
            } else {
                toast.error(result?.message || 'Failed to create user');
            }
        } catch (error: any) {
            console.error('Error creating user:', error);
            toast.error(error?.data?.message || error?.message || 'Failed to create user');
        }
    };

    const getRoleBadgeColor = (role?: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'product_manager':
                return 'bg-blue-100 text-blue-800';
            case 'product_viewer':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Parse users from API response
    const usersList = useMemo(() => {
        if (!usersData) return [];
        // API returns { success: true, data: [...], pagination: {...}, stats: {...} }
        if (Array.isArray(usersData)) return usersData;
        // Handle both direct data array and wrapped response
        return (usersData as any)?.data || [];
    }, [usersData]);

    // Get pagination info
    const pagination = useMemo(() => {
        if (!usersData || Array.isArray(usersData)) return null;
        return (usersData as any)?.pagination || null;
    }, [usersData]);

    // Get stats info
    const stats = useMemo(() => {
        if (!usersData || Array.isArray(usersData)) return null;
        return (usersData as any)?.stats || null;
    }, [usersData]);

    // Filter users to show only those assigned to the current company
    // EXCLUDE company admins (main sellers) who have greenbidz_company but no assigned_company_name
    const filteredUsers = useMemo(() => {
        if (!usersList.length || !companyName) return usersList || [];
        
        return usersList.filter((user: any) => {
            // Get company identifiers from user data
            const assignedCompanyName = user.meta?.assigned_company_name || '';
            const assignedCompanyTaxId = user.meta?.assigned_company_tax_id || '';
            const greenbidzCompany = user.meta?.greenbidz_company || '';
            
            // EXCLUDE: Company admins/main sellers - users with greenbidz_company but NO assigned_company_name
            // These are the company owners, not assigned users
            const isCompanyAdmin = greenbidzCompany && !assignedCompanyName;
            if (isCompanyAdmin) {
                return false; // Exclude company admins from assigned users list
            }
            
            // Check if user is assigned to current company by:
            // 1. assigned_company_name matches companyName (primary check for assigned users)
            // 2. assigned_company_tax_id matches companyTaxIdNumber
            
            const matchesCompanyName = 
                assignedCompanyName && 
                assignedCompanyName.toLowerCase().trim() === companyName.toLowerCase().trim();
            
            const matchesTaxId = 
                companyTaxIdNumber && 
                assignedCompanyTaxId && 
                assignedCompanyTaxId.trim() === companyTaxIdNumber.trim();
            
            // User must match either company name or tax ID AND must be an assigned user (not company admin)
            return matchesCompanyName || matchesTaxId;
        });
    }, [usersList, companyName, companyTaxIdNumber]);

    // Parse unassigned users from API response
    const unassignedUsersList = useMemo(() => {
        if (!unassignedUsersData || !showUnassignedUsersModal) return [];
        if (Array.isArray(unassignedUsersData)) return unassignedUsersData;
        return (unassignedUsersData as any)?.data || [];
    }, [unassignedUsersData, showUnassignedUsersModal]);

    // Filter available users - show ALL users except those already assigned to CURRENT company
    // Users assigned to OTHER companies can still be selected (they can be reassigned)
    const availableUsers = useMemo(() => {
        if (!unassignedUsersList.length) return [];
        
        return unassignedUsersList.filter((user: any) => {
            const assignedCompanyName = user.meta?.assigned_company_name || '';
            const assignedCompanyTaxId = user.meta?.assigned_company_tax_id || '';
            const greenbidzCompany = user.meta?.greenbidz_company || '';
            
            // Exclude users already assigned to CURRENT company
            const isAssignedToCurrentCompany = 
                (assignedCompanyName && assignedCompanyName.toLowerCase().trim() === companyName.toLowerCase().trim()) ||
                (assignedCompanyTaxId && assignedCompanyTaxId.trim() === companyTaxIdNumber.trim());
            
            // Exclude the current company admin (main seller) - they own the company, can't be assigned
            const isCurrentCompanyAdmin = 
                greenbidzCompany && 
                greenbidzCompany.toLowerCase().trim() === companyName.toLowerCase().trim() &&
                !assignedCompanyName; // Only if they're the admin, not assigned
            
            // Show all users EXCEPT those assigned to current company or current company admin
            return !isAssignedToCurrentCompany && !isCurrentCompanyAdmin;
        });
    }, [unassignedUsersList, companyName, companyTaxIdNumber]);

    // Get unassigned users pagination
    const unassignedPagination = useMemo(() => {
        if (!unassignedUsersData || Array.isArray(unassignedUsersData) || !showUnassignedUsersModal) return null;
        return (unassignedUsersData as any)?.pagination || null;
    }, [unassignedUsersData, showUnassignedUsersModal]);

    return (
        <DashboardLayout>


            <div className="container mx-auto p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">Company User Management</h1>
                            {adminRole && (
                                <Badge className={
                                    adminRole === 'admin' 
                                        ? 'bg-red-100 text-red-800' 
                                        : adminRole === 'product_manager'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                }>
                                    {adminRole === 'admin' ? 'Admin' : adminRole === 'product_manager' ? 'Product Manager' : 'Product Viewer'}
                                </Badge>
                            )}
                        </div>
                        <p className="text-gray-500 mt-1">
                            Manage users for: <strong>{companyName}</strong> ({companyTaxIdNumber})
                        </p>
                        {isProductViewer && (
                            <p className="text-sm text-yellow-600 mt-1">
                                ⚠️ You have view-only access. You cannot create or edit users.
                            </p>
                        )}
                    </div>
                    {canManageUsers && (
                        <div className="flex gap-2">
                            {canAssignUsers && (
                                <Button onClick={() => setShowUnassignedUsersModal(true)} variant="outline">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Assign Existing User
                                </Button>
                            )}
                            {canCreateUsers && (
                                <Button onClick={() => setShowCreateForm(true)}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Create New User
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Dashboard Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{filteredUsers.length}</p>
                                    {stats && stats.total_users !== filteredUsers.length && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Filtered from {stats.total_users} total
                                        </p>
                                    )}
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Approved Users</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        {filteredUsers.filter((u: any) => (u.status || u.meta?.pw_user_status) === 'approved').length}
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <Shield className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pending Users</p>
                                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                                        {filteredUsers.filter((u: any) => (u.status || u.meta?.pw_user_status) === 'pending').length}
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <User className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Bar */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input
                                placeholder="Search users by email..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-10"
                            />
                        </div>
                        {pagination && (
                            <p className="text-sm text-gray-500 mt-2">
                                Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} assigned to <strong>{companyName}</strong>
                                {pagination.total !== filteredUsers.length && (
                                    <span className="text-gray-400"> (filtered from {pagination.total} total)</span>
                                )}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Create User Form - Only visible if user has permission */}
                {showCreateForm && canCreateUsers && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New User to Company</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="create-name">Name *</Label>
                                        <Input
                                            id="create-name"
                                            required
                                            value={createFormData.name}
                                            onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="create-email">Email *</Label>
                                        <Input
                                            id="create-email"
                                            type="email"
                                            required
                                            value={createFormData.email}
                                            onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="create-password">Password *</Label>
                                        <Input
                                            id="create-password"
                                            type="password"
                                            required
                                            value={createFormData.password}
                                            onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="create-role">Role *</Label>
                                        <Select
                                            value={createFormData.adminRole}
                                            onValueChange={(value: any) => setCreateFormData({ ...createFormData, adminRole: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="product_manager">Product Manager</SelectItem>
                                                <SelectItem value="product_viewer">Product Viewer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="create-phone">Phone</Label>
                                        <Input
                                            id="create-phone"
                                            value={createFormData.phone}
                                            onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded">
                                    <p className="text-sm text-blue-700">
                                        <strong>Company:</strong> {companyName} ({companyTaxIdNumber})
                                    </p>
                                </div>
                                
                                <div className="flex gap-4">
                                    <Button type="submit" disabled={isCreating}>
                                        {isCreating ? 'Creating...' : 'Create User'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Assign User Form */}
                {showAssignForm && selectedUser && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Assign User to Company</CardTitle>
                            <p className="text-sm text-gray-500">
                                User: {selectedUser.name} ({selectedUser.email})
                            </p>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAssignUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="assign-company-name">Company Name *</Label>
                                        <Input
                                            id="assign-company-name"
                                            required
                                            value={assignFormData.companyName}
                                            onChange={(e) => setAssignFormData({ ...assignFormData, companyName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="assign-tax-id">Company Tax ID *</Label>
                                        <Input
                                            id="assign-tax-id"
                                            required
                                            value={assignFormData.companyTaxIdNumber}
                                            onChange={(e) => setAssignFormData({ ...assignFormData, companyTaxIdNumber: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="assign-role">Role *</Label>
                                        <Select
                                            value={assignFormData.adminRole}
                                            onValueChange={(value: any) => setAssignFormData({ ...assignFormData, adminRole: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="product_manager">Product Manager</SelectItem>
                                                <SelectItem value="product_viewer">Product Viewer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button type="submit" disabled={isAssigning}>
                                        {isAssigning ? 'Assigning...' : 'Assign to Company'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => {
                                        setShowAssignForm(false);
                                        setSelectedUser(null);
                                    }}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Company Users List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Company Users</CardTitle>
                                <p className="text-sm text-gray-500">
                                    {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} assigned to your company
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingUsers ? (
                            <div className="text-center py-8 text-gray-500">Loading users...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No users found. Use "Add New User" to add users to your company.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredUsers.map((user: any) => {
                                    const userStatus = user.status || user.meta?.pw_user_status || 'active';
                                    const isApproved = userStatus === 'approved';
                                    
                                    return (
                                        <div
                                            key={user.user_id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-semibold text-lg">{user.name || 'N/A'}</div>
                                                        {user.user_type && (
                                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                                                {user.user_type === 'seller' ? 'Seller' : 'Buyer'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">{user.email}</div>
                                                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                                        {user.company && (
                                                            <div className="flex items-center gap-1">
                                                                <Building2 className="h-3 w-3" />
                                                                <span>{user.company}</span>
                                                            </div>
                                                        )}
                                                        {user.phone && (
                                                            <div className="flex items-center gap-1">
                                                                <span>📞</span>
                                                                <span>{user.phone}</span>
                                                            </div>
                                                        )}
                                                        {user.address && (
                                                            <div className="flex items-center gap-1">
                                                                <span>📍</span>
                                                                <span>{user.address}</span>
                                                            </div>
                                                        )}
                                                        {user.member_id && (
                                                            <div className="flex items-center gap-1">
                                                                <span>ID:</span>
                                                                <span>{user.member_id}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {user.meta?.adminRole && (
                                                            <Badge className={getRoleBadgeColor(user.meta.adminRole)}>
                                                                {user.meta.adminRole === 'product_manager' ? 'Product Manager' : 'Product Viewer'}
                                                            </Badge>
                                                        )}
                                                        <Badge 
                                                            variant="outline" 
                                                            className={
                                                                isApproved
                                                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                                                    : userStatus === 'pending'
                                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                                            }
                                                        >
                                                            {userStatus === 'approved' ? 'Approved' : userStatus === 'pending' ? 'Pending' : 'Active'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {canEditUsers && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleEditUser(user)}
                                                                className="h-8"
                                                            >
                                                                <Edit className="h-3 w-3 mr-1" />
                                                                Edit Role
                                                            </Button>
                                                        )}
                                                        {canManageUsers && (
                                                            <div className="flex items-center gap-2">
                                                                <Label htmlFor={`status-${user.user_id}`} className="text-sm text-gray-600">
                                                                    {isApproved ? 'Approved' : 'Pending'}
                                                                </Label>
                                                                <Switch
                                                                    id={`status-${user.user_id}`}
                                                                    checked={isApproved}
                                                                    onCheckedChange={() => {
                                                                        handleStatusToggle(user.user_id, userStatus);
                                                                    }}
                                                                    disabled={isUpdatingStatus}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Unassigned Users Modal - Only accessible if user has permission */}
                {canAssignUsers && (
                    <Dialog open={showUnassignedUsersModal} onOpenChange={setShowUnassignedUsersModal}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Assign Users to Company</DialogTitle>
                            <DialogDescription>
                                Select users from the list to assign to <strong>{companyName}</strong>. 
                                Users already assigned to this company are automatically filtered out. 
                                Only Product Manager and Product Viewer roles are available.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <Input
                                    placeholder="Search users by name or email..."
                                    value={unassignedSearchTerm}
                                    onChange={(e) => setUnassignedSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Users List */}
                            {isLoadingUnassigned ? (
                                <div className="text-center py-8 text-gray-500">Loading users...</div>
                            ) : availableUsers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    {unassignedUsersList.length > 0 
                                        ? "All users are already assigned to this company."
                                        : "No users found. Try adjusting your search."
                                    }
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {availableUsers.map((user: any) => {
                                        const assignedCompanyName = user.meta?.assigned_company_name || '';
                                        const greenbidzCompany = user.meta?.greenbidz_company || '';
                                        const isAssignedToOtherCompany = assignedCompanyName && assignedCompanyName.toLowerCase().trim() !== companyName.toLowerCase().trim();
                                        const isCompanyAdmin = greenbidzCompany && !assignedCompanyName;
                                        
                                        return (
                                            <div
                                                key={user.user_id}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold">{user.name || 'N/A'}</span>
                                                            {isCompanyAdmin && (
                                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                                                    Company Admin
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                        {isAssignedToOtherCompany && (
                                                            <div className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                                                                <span>ℹ</span>
                                                                <span>Currently assigned to: {assignedCompanyName} (can be reassigned)</span>
                                                            </div>
                                                        )}
                                                        {isCompanyAdmin && greenbidzCompany && (
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                Company Admin: {greenbidzCompany}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        handleSelectUser(user);
                                                        setShowUnassignedUsersModal(false);
                                                    }}
                                                >
                                                    <Shield className="h-4 w-4 mr-2" />
                                                    Assign
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            {unassignedPagination && unassignedPagination.totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="text-sm text-gray-500">
                                        Page {unassignedPagination.page} of {unassignedPagination.totalPages}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setUnassignedUsersPage(p => Math.max(1, p - 1))}
                                            disabled={unassignedUsersPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setUnassignedUsersPage(p => Math.min(unassignedPagination.totalPages, p + 1))}
                                            disabled={unassignedUsersPage === unassignedPagination.totalPages}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowUnassignedUsersModal(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                )}

                {/* Edit User Role Dialog */}
                <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit User Role</DialogTitle>
                            <DialogDescription>
                                Update role for {editingUser?.name} ({editingUser?.email})
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateUserRole} className="space-y-4">
                            <div>
                                <Label htmlFor="edit-role">Role *</Label>
                                <Select
                                    value={editFormData.adminRole}
                                    onValueChange={(value: any) => setEditFormData({ adminRole: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="product_manager">Product Manager</SelectItem>
                                        <SelectItem value="product_viewer">Product Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isAssigning}>
                                    {isAssigning ? 'Updating...' : 'Update Role'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total users)
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1 || isLoadingUsers}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            let pageNum: number;
                                            if (pagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (page <= 3) {
                                                pageNum = i + 1;
                                            } else if (page >= pagination.totalPages - 2) {
                                                pageNum = pagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = page - 2 + i;
                                            }
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={page === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    disabled={isLoadingUsers}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === pagination.totalPages || isLoadingUsers}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CompanyUserManagement;

