import React, { useState, useEffect } from 'react';
import { useGetRolesQuery } from '@/rtk/slices/roleApiSlice';
import {
  useGetCompanyUserRolesQuery,
  useAssignUserRoleMutation,
  useRemoveUserRoleMutation,
} from '@/rtk/slices/permissionApiSlice';
import { useCreateUserByAdminMutation, useGetUserProfileQuery } from '@/rtk/slices/apiSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { UserPlus, Edit, X, Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UserRoleManagementProps {
  userId?: number;
}

const UserRoleManagement: React.FC<UserRoleManagementProps> = ({ userId }) => {
  const { t } = useTranslation();
  const currentUserId = localStorage.getItem('userId') || '';

  // Determine company context for user management
  const isCompanyAdmin = localStorage.getItem('isCompanyAdmin') === 'true';
  const isAssignedUser = localStorage.getItem('isAssignedUser') === 'true';

  // Get user profile to fetch company information for company admins
  const { data: profileData } = useGetUserProfileQuery(currentUserId, {
    skip: !isCompanyAdmin || !currentUserId // Only fetch for company admins
  });

  // For company admins: use their own company (from profile/company details)
  // For assigned users: use the selected company
  const [companyName, setCompanyName] = useState('');
  const [companySellerId, setCompanySellerId] = useState(0);

  useEffect(() => {
    if (isCompanyAdmin) {
      // Company admin managing their own company
      // Priority: profile API -> localStorage -> userData fallback
      let finalCompanyName = profileData?.personalInfo?.company || localStorage.getItem('companyName') || '';

      // Fallback: Try to get from userData (login response) for company admins
      if (!finalCompanyName && (isCompanyAdmin || localStorage.getItem('userType') === 'company_admin')) {
        try {
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          finalCompanyName = userData?.data?.userDetail?.company || '';
          if (finalCompanyName) {
            // Update localStorage for future use
            localStorage.setItem('companyName', finalCompanyName);
          }
        } catch (e) {
          console.warn('Error parsing userData for company name:', e);
        }
      }

      setCompanyName(finalCompanyName);
      setCompanySellerId(Number(localStorage.getItem('userId'))); // Admin's own ID
    } else if (isAssignedUser) {
      // Assigned user managing the company they're assigned to
      setCompanyName(localStorage.getItem('companyName') || '');
      setCompanySellerId(Number(localStorage.getItem('companySellerId') || localStorage.getItem('userId')));
    } else {
      // Fallback for regular users
      setCompanyName(localStorage.getItem('companyName') || '');
      setCompanySellerId(Number(localStorage.getItem('userId')));
    }
  }, [isCompanyAdmin, isAssignedUser, profileData]);

  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [editingUserRole, setEditingUserRole] = useState<any>(null);

  const [createUserFormData, setCreateUserFormData] = useState({
    email: '',
    roleId: null as number | null,
  });

  const [editRoleFormData, setEditRoleFormData] = useState({
    roleId: null as number | null,
  });

  /* ===================== API ===================== */

  const { data: rolesResponse } = useGetRolesQuery();
  const { data: userRolesResponse, refetch } =
    useGetCompanyUserRolesQuery(companyName);

  const [assignRole, { isLoading: isAssigning }] =
    useAssignUserRoleMutation();

  const [removeRole] = useRemoveUserRoleMutation();

  const [createUser, { isLoading: isCreatingUser }] =
    useCreateUserByAdminMutation();

  /* ===================== Handlers ===================== */

  const handleCreateUserWithRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !createUserFormData.email ||
      !createUserFormData.roleId
    ) {
      toast.error(t('admin.permissionDashboard.userRoleManagement.fillAllFields', 'Please fill all fields'));
      return;
    }

    try {
      await createUser({
        ...createUserFormData,
        companyName,
      }).unwrap();

      toast.success(t('admin.permissionDashboard.userRoleManagement.userCreated', 'User created successfully'));
      setShowCreateUserForm(false);
      setCreateUserFormData({
        email: '',
        roleId: null,
      });
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || t('admin.permissionDashboard.userRoleManagement.createFailed', 'Failed to create user'));
    }
  };

  const handleEditUserRole = (userRole: any) => {
    setEditingUserRole(userRole);
    setEditRoleFormData({ roleId: userRole.role_id });
  };

  const handleUpdateUserRole = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await assignRole({
        userId: editingUserRole.user_id,
        roleId: editRoleFormData.roleId,
        companyName,
        companySellerId,
        assignedBy: companySellerId,
      }).unwrap();

      toast.success(t('admin.permissionDashboard.userRoleManagement.roleUpdated', 'Role updated successfully'));
      setEditingUserRole(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || t('admin.permissionDashboard.userRoleManagement.updateFailed', 'Failed to update role'));
    }
  };

  const handleRemoveRole = async (id: number) => {
    try {
      await removeRole(id).unwrap();
      toast.success(t('admin.permissionDashboard.userRoleManagement.roleRemoved', 'Role removed successfully'));
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || t('admin.permissionDashboard.userRoleManagement.removeFailed', 'Failed to remove role'));
    }
  };

  /* ===================== UI ===================== */



  console.log(userRolesResponse);

  return (
    <div className="container mx-auto p-6 space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.permissionDashboard.userRoleManagement.title', 'User Role Management')}</h1>
          <p className="text-sm text-gray-600">
            {t('admin.permissionDashboard.userRoleManagement.manageUsersAndRoles', 'Manage users and roles for')}: {companyName || t('admin.permissionDashboard.overview.notSelected', 'Not Selected')}
            {isCompanyAdmin && companyName && <span className="text-blue-600 font-medium"> (Your Company)</span>}
          </p>
        </div>

        {companyName && (
          <Button onClick={() => setShowCreateUserForm(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('admin.permissionDashboard.userRoleManagement.createUser', 'Create User')}
          </Button>
        )}
      </div>

      {/* CREATE USER */}
      {showCreateUserForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.permissionDashboard.userRoleManagement.createUserWithRole', 'Create User with Role')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUserWithRole} className="space-y-4">
              <Input
                placeholder={t('admin.permissionDashboard.userRoleManagement.email', 'Email')}
                value={createUserFormData.email}
                onChange={e =>
                  setCreateUserFormData({ ...createUserFormData, email: e.target.value })
                }
              />
              <Select
                onValueChange={v =>
                  setCreateUserFormData({ ...createUserFormData, roleId: Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.permissionDashboard.userRoleManagement.selectRole', 'Select Role')} />
                </SelectTrigger>
                <SelectContent>
                  {rolesResponse?.data?.map(role => (
                    <SelectItem key={role.role_id} value={role.role_id.toString()}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button type="submit" disabled={isCreatingUser}>
                  {isCreatingUser ? t('admin.permissionDashboard.userRoleManagement.creating', 'Creating...') : t('admin.permissionDashboard.userRoleManagement.create', 'Create')}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateUserForm(false)}>
                  {t('admin.permissionDashboard.userRoleManagement.cancel', 'Cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* EMPTY STATE */}
      {!companyName && isCompanyAdmin && (
        <Card>
          <CardContent className="p-6 text-center">
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Company Information
            </h3>
            <p className="text-gray-600">
              Please wait while we load your company details...
            </p>
          </CardContent>
        </Card>
      )}

      {!companyName && !isCompanyAdmin && (
        <Card>
          <CardContent className="p-6 text-center">
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('admin.permissionDashboard.userRoleManagement.selectCompany', 'Select Company')}
            </h3>
            <p className="text-gray-600">
              {t('admin.permissionDashboard.userRoleManagement.selectCompanyToManage', 'Please select a company to manage users')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* USERS LIST */}
      {userRolesResponse?.data?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.permissionDashboard.userRoleManagement.assignedUsers', 'Assigned Users')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userRolesResponse.data.map((ur: any) => (
              <div key={ur.id} className="flex justify-between border p-4 rounded">
                <div>
                  <div className="font-semibold">{t('admin.permissionDashboard.userRoleManagement.userId', 'User ID')}: {ur.user_id}</div>
                  <div className="text-sm text-gray-500">
                    {ur.role?.role_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t('admin.permissionDashboard.userRoleManagement.email', 'Email')}:
                    {ur?.user?.user_email}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditUserRole(ur)}
                    title={t('admin.permissionDashboard.userRoleManagement.editRole', 'Edit Role')}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveRole(ur.id)}
                    title={t('admin.permissionDashboard.userRoleManagement.removeRole', 'Remove Role')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* EDIT ROLE DIALOG */}
      <Dialog open={!!editingUserRole} onOpenChange={() => setEditingUserRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.permissionDashboard.userRoleManagement.editUserRole', 'Edit User Role')}</DialogTitle>
            <DialogDescription>
              {t('admin.permissionDashboard.userRoleManagement.updateRoleForUser', 'Update role for user')}: {editingUserRole?.user_id}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateUserRole} className="space-y-4">
            <Select
              value={editRoleFormData.roleId?.toString()}
              onValueChange={v => setEditRoleFormData({ roleId: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('admin.permissionDashboard.userRoleManagement.selectRole', 'Select Role')} />
              </SelectTrigger>
              <SelectContent>
                {rolesResponse?.data?.map(role => (
                  <SelectItem key={role.role_id} value={role.role_id.toString()}>
                    {role.role_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUserRole(null)}>
                {t('admin.permissionDashboard.userRoleManagement.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isAssigning}>
                {isAssigning ? t('admin.permissionDashboard.userRoleManagement.updating', 'Updating...') : t('admin.permissionDashboard.userRoleManagement.update', 'Update')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {!companyName && (
        <Card>
          <CardContent className="text-center text-red-600">
            {t('admin.permissionDashboard.userRoleManagement.selectCompanyFirst', 'Please select a company first')}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserRoleManagement;

