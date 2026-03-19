import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RoleManagement from './RoleManagement';
import CompanyPermissionManagement from './CompanyPermissionManagement';
import UserRoleManagement from './UserRoleManagement';
import { Shield, Users, Settings, Building } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const PermissionDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');


  return (
    <DashboardLayout>


    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('admin.productListing.permissionDashboard.title', 'Permission Management Dashboard')}</h1>
        <p className="text-gray-600">
          {t('admin.permissionDashboard.subtitle', 'Manage roles, permissions, and user assignments for your company')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('admin.permissionDashboard.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('admin.permissionDashboard.tabs.roles')}
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            {t('admin.permissionDashboard.tabs.permissions')}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('admin.permissionDashboard.tabs.users')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.permissionDashboard.overview.currentCompany')}</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const lsCompanyName = localStorage.getItem('companyName');
                    if (lsCompanyName) return lsCompanyName;

                    // Fallback: Try to get from userData for company admins
                    if (localStorage.getItem('isCompanyAdmin') === 'true' || localStorage.getItem('userType') === 'company_admin') {
                      try {
                        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                        const companyName = userData?.data?.userDetail?.company;
                        if (companyName) {
                          // Update localStorage for future use
                          localStorage.setItem('companyName', companyName);
                          return companyName;
                        }
                      } catch (e) {
                        console.warn('Error parsing userData for company name:', e);
                      }
                      return 'Your Company';
                    }

                    return t('admin.permissionDashboard.overview.notSelected');
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const lsTaxId = localStorage.getItem('currentCompanyTaxId');
                    if (lsTaxId) return lsTaxId;

                    // Fallback: Try to get from userData for company admins
                    if (localStorage.getItem('isCompanyAdmin') === 'true' || localStorage.getItem('userType') === 'company_admin') {
                      try {
                        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                        const taxId = userData?.data?.userDetail?.companyTaxIdNumber;
                        if (taxId) {
                          // Update localStorage for future use
                          localStorage.setItem('currentCompanyTaxId', taxId);
                          localStorage.setItem('companyTaxIdNumber', taxId);
                          return taxId;
                        }
                      } catch (e) {
                        console.warn('Error parsing userData for tax ID:', e);
                      }
                      return 'Company Admin';
                    }

                    return t('admin.permissionDashboard.overview.noCompanySelected');
                  })()}
                  {localStorage.getItem('isCompanyAdmin') === 'true' && <span className="text-blue-600"> (You own this company)</span>}
                </p>
              </CardContent>
            </Card>
{/* 
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.permissionDashboard.overview.yourRole')}</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {localStorage.getItem('adminRole') || t('admin.permissionDashboard.overview.notSet')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.permissionDashboard.overview.currentPermissionLevel')}
                </p>
              </CardContent>
            </Card> */}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.permissionDashboard.overview.userType')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {localStorage.getItem('isCompanyAdmin') === 'true' ? t('admin.permissionDashboard.overview.companyAdmin') :
                   localStorage.getItem('isAssignedUser') === 'true' ? t('admin.permissionDashboard.overview.assignedUser') : t('admin.permissionDashboard.overview.regularUser')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.permissionDashboard.overview.accountType')}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.permissionDashboard.overview.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('roles')}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="font-semibold">{t('admin.permissionDashboard.overview.manageRoles')}</div>
                  <div className="text-sm text-gray-600">{t('admin.permissionDashboard.overview.manageRolesDesc')}</div>
                </button>

                <button
                  onClick={() => setActiveTab('permissions')}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="font-semibold">{t('admin.permissionDashboard.overview.companyPermissions')}</div>
                  <div className="text-sm text-gray-600">{t('admin.permissionDashboard.overview.companyPermissionsDesc')}</div>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="font-semibold">{t('admin.permissionDashboard.overview.userRoleAssignments')}</div>
                  <div className="text-sm text-gray-600">{t('admin.permissionDashboard.overview.userRoleAssignmentsDesc')}</div>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="permissions">
          <CompanyPermissionManagement />
        </TabsContent>

        <TabsContent value="users">
          <UserRoleManagement />
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
};

export default PermissionDashboard;

