import { useGetRolesQuery } from '@/rtk/slices/roleApiSlice';
import {
  useGetCompanyPermissionsQuery,
  useSetCompanyRolePermissionMutation
} from '@/rtk/slices/permissionApiSlice';
import { getEnabledFeatures, getPermissionKey } from '@/config/roleConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CompanyPermissionManagement: React.FC = () => {
  const { t } = useTranslation();
  const { data: rolesResponse } = useGetRolesQuery();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const companyName = localStorage.getItem('companyName') || '';

  const { data: permissionsResponse, refetch } = useGetCompanyPermissionsQuery(
    { companyIdentifier: companyName, roleId: selectedRoleId || undefined },
    { skip: !selectedRoleId || !companyName }
  );

  const [setPermission] = useSetCompanyRolePermissionMutation();

  const handlePermissionChange = async (permissionKey: string, isAllowed: boolean) => {
    if (!selectedRoleId) {
      toast.error(t('admin.permissionDashboard.companyPermissions.selectRoleFirst', 'Please select a role first'));
      return;
    }

    if (!companyName || companyName.trim() === '') {
      toast.error(t('admin.permissionDashboard.companyPermissions.noCompanySelected', 'No company selected'));
      return;
    }

    try {
      await setPermission({
        companyIdentifier: companyName,
        roleId: selectedRoleId,
        permissionKey,
        isAllowed,
      }).unwrap();
      toast.success(t('admin.permissionDashboard.companyPermissions.permissionUpdated', 'Permission updated'));
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || t('admin.permissionDashboard.companyPermissions.updateFailed', 'Failed to update permission'));
    }
  };

  const getCurrentPermissionValue = (permissionKey: string) => {
    const existingPermission = permissionsResponse?.data?.find(
      p => p.permission_key === permissionKey
    );
    return existingPermission ? existingPermission.is_allowed === 1 : null;
  };

  const getDefaultPermissionsForFeature = (featureKey: string) => {
    const defaults: any = {};

    switch (featureKey) {
      case 'product':
        defaults.view = false;
        defaults.add = false;
        defaults.edit = false;
        defaults.delete = false;
        break;
      case 'bidding':
        defaults.view = false;
        defaults.add = false;
        defaults.edit = false;
        defaults.delete = false;
        break;
      case 'chat':
        defaults.view = false;
        defaults.send = false;
        break;
      case 'reports':
        defaults.view = false;
        defaults.generate = false;
        defaults.export = false;
        break;
      case 'admin':
        defaults.dashboard = false;
        defaults.settings = false;
        defaults.roles = false;
        defaults.permissions = false;
        break;
      case 'userManagement':
        defaults.view = false;
        defaults.add = false;
        defaults.edit = false;
        defaults.delete = false;
        break;
      case 'payment':
        defaults.view = false;
        defaults.process = false;
        break;
      case 'inspection':
        defaults.view = false;
        defaults.add = false;
        defaults.edit = false;
        defaults.approve = false;
        break;
      default:
        break;
    }

    return defaults;
  };

  const renderPermissionSection = (category: string, permissions: any, featureInfo?: any) => {
    return (
      <div key={category} className="space-y-3">
        <div className="flex items-center gap-2">
          {featureInfo?.icon && <span className="text-lg">{featureInfo.icon}</span>}
          <h4 className="text-lg font-semibold capitalize">
            {featureInfo?.name || category.replace(/([A-Z])/g, ' $1').trim()} Permissions
          </h4>
        </div>

        {featureInfo?.description && (
          <p className="text-sm text-gray-600">{featureInfo.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(permissions).map(([key, value]: [string, any]) => {
            const permissionKey = getPermissionKey(category, key);
            const currentValue = getCurrentPermissionValue(permissionKey);
            const isOverridden = currentValue !== null;

            return (
              <div key={permissionKey} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium capitalize">
                    {key.replace('_', ' ')}
                  </span>
                  <div className="text-sm text-gray-500">
                    {t('admin.permissionDashboard.companyPermissions.default', 'Default')}: {value ? t('admin.permissionDashboard.companyPermissions.allowed', 'Allowed') : t('admin.permissionDashboard.companyPermissions.denied', 'Denied')}
                    {isOverridden && (
                      <span className="ml-2 text-blue-600">({t('admin.permissionDashboard.companyPermissions.overridden', 'Overridden')})</span>
                    )}
                  </div>
                </div>

                <Switch
                  checked={currentValue !== null ? currentValue : value}
                  onCheckedChange={(checked) =>
                    handlePermissionChange(permissionKey, checked)
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('admin.permissionDashboard.companyPermissions.title', 'Company Permission Management')}</h1>
        <div className="text-sm text-gray-600">
          {t('admin.permissionDashboard.companyPermissions.currentCompany', 'Current Company')}: {companyName || t('admin.permissionDashboard.overview.notSelected', 'Not Selected')}
        </div>
      </div>

      {/* Role Selector */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.permissionDashboard.companyPermissions.selectRole', 'Select Role')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedRoleId?.toString() || ''}
            onValueChange={(value) => setSelectedRoleId(Number(value))}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder={t('admin.permissionDashboard.companyPermissions.selectRolePlaceholder', 'Select a role')} />
            </SelectTrigger>
            <SelectContent>
              {rolesResponse?.data?.filter(role => role.is_active).map((role) => (
                <SelectItem key={role.role_id} value={role.role_id.toString()}>
                  {role.role_name} ({role.role_key})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Permissions */}
      {selectedRoleId && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.permissionDashboard.companyPermissions.permissions', 'Permissions')}</CardTitle>
            <p className="text-sm text-gray-600">
              {t('admin.permissionDashboard.companyPermissions.managePermissionsDesc', 'Manage permissions for this role in your company')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(getEnabledFeatures()).map(([featureKey, featureInfo]) => {
              const defaultPermissions = getDefaultPermissionsForFeature(featureKey);
              return renderPermissionSection(featureKey, defaultPermissions, featureInfo);
            })}
          </CardContent>
        </Card>
      )}

      {(!companyName || companyName.trim() === '') && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <div className="text-red-600 font-medium mb-2">⚠️ {t('admin.permissionDashboard.companyPermissions.noCompanyWarning', 'No Company Selected')}</div>
            <p>{t('admin.permissionDashboard.companyPermissions.selectCompanyFirst', 'Please select a company first')}</p>
            <p className="text-sm mt-2">
              {t('admin.permissionDashboard.companyPermissions.goToProfile', 'Go to your profile to set up your company')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanyPermissionManagement;

