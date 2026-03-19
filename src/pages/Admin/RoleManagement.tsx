import React, { useState } from 'react';
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeactivateRoleMutation
} from '@/rtk/slices/roleApiSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const RoleManagement: React.FC = () => {
  const { t } = useTranslation();
  const { data: rolesResponse, isLoading, refetch } = useGetRolesQuery();
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deactivateRole] = useDeactivateRoleMutation();

  const [newRole, setNewRole] = useState({ role_key: '', role_name: '' });
  const [editingRole, setEditingRole] = useState<{
    id: number;
    role_key: string;
    role_name: string;
  } | null>(null);

  const handleCreateRole = async () => {
    try {
      await createRole(newRole).unwrap();
      setNewRole({ role_key: '', role_name: '' });
      toast.success(t('admin.permissionDashboard.roleManagement.roleCreated', 'Role created successfully'));
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || t('admin.permissionDashboard.roleManagement.createFailed', 'Failed to create role'));
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    try {
      await updateRole({
        id: editingRole.id,
        roleData: {
          role_key: editingRole.role_key,
          role_name: editingRole.role_name
        }
      }).unwrap();
      setEditingRole(null);
      toast.success(t('admin.permissionDashboard.roleManagement.roleUpdated', 'Role updated successfully'));
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || t('admin.permissionDashboard.roleManagement.updateFailed', 'Failed to update role'));
    }
  };

  const handleDeactivateRole = async (roleId: number) => {
    try {
      await deactivateRole(roleId).unwrap();
      toast.success(t('admin.permissionDashboard.roleManagement.roleDeactivated', 'Role deactivated successfully'));
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || t('admin.permissionDashboard.roleManagement.deactivateFailed', 'Failed to deactivate role'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        {t('admin.permissionDashboard.roleManagement.loading', 'Loading...')}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('admin.permissionDashboard.roleManagement.title', 'Role Management')}</h1>
      </div>

      {/* Create / Edit Role */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingRole ? t('admin.permissionDashboard.roleManagement.editRole', 'Edit Role') : t('admin.permissionDashboard.roleManagement.createRole', 'Create Role')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.permissionDashboard.roleManagement.roleKey', 'Role Key')}
              </label>
              <Input
                placeholder={t('admin.permissionDashboard.roleManagement.roleKeyPlaceholder', 'e.g., product_manager')}
                value={editingRole ? editingRole.role_key : newRole.role_key}
                onChange={(e) => {
                  if (editingRole) {
                    setEditingRole({ ...editingRole, role_key: e.target.value });
                  } else {
                    setNewRole({ ...newRole, role_key: e.target.value });
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.permissionDashboard.roleManagement.roleName', 'Role Name')}
              </label>
              <Input
                placeholder={t('admin.permissionDashboard.roleManagement.roleNamePlaceholder', 'e.g., Product Manager')}
                value={editingRole ? editingRole.role_name : newRole.role_name}
                onChange={(e) => {
                  if (editingRole) {
                    setEditingRole({ ...editingRole, role_name: e.target.value });
                  } else {
                    setNewRole({ ...newRole, role_name: e.target.value });
                  }
                }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={editingRole ? handleUpdateRole : handleCreateRole}
              disabled={
                editingRole
                  ? !editingRole.role_key || !editingRole.role_name
                  : !newRole.role_key || !newRole.role_name
              }
            >
              {editingRole ? t('admin.permissionDashboard.roleManagement.save', 'Save') : t('admin.permissionDashboard.roleManagement.create', 'Create')}
            </Button>

            {editingRole && (
              <Button variant="outline" onClick={() => setEditingRole(null)}>
                {t('admin.permissionDashboard.roleManagement.cancel', 'Cancel')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.permissionDashboard.roleManagement.existingRoles', 'Existing Roles')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.permissionDashboard.roleManagement.roleKey', 'Role Key')}</TableHead>
                <TableHead>{t('admin.permissionDashboard.roleManagement.roleName', 'Role Name')}</TableHead>
                <TableHead>{t('admin.permissionDashboard.roleManagement.status', 'Status')}</TableHead>
                <TableHead>{t('admin.permissionDashboard.roleManagement.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rolesResponse?.data?.map((role) => (
                <TableRow key={role.role_id}>
                  <TableCell className="font-mono">
                    {role.role_key}
                  </TableCell>
                  <TableCell>{role.role_name}</TableCell>
                  <TableCell>
                    <Badge variant={role.is_active ? 'default' : 'secondary'}>
                      {role.is_active ? t('admin.permissionDashboard.roleManagement.active', 'Active') : t('admin.permissionDashboard.roleManagement.inactive', 'Inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEditingRole({
                            id: role.role_id,
                            role_key: role.role_key,
                            role_name: role.role_name
                          })
                        }
                      >
                        {t('admin.permissionDashboard.roleManagement.edit', 'Edit')}
                      </Button>

                      {role.is_active && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeactivateRole(role.role_id)}
                        >
                          {t('admin.permissionDashboard.roleManagement.deactivate', 'Deactivate')}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;

