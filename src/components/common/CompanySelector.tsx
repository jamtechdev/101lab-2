import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Loader2 } from 'lucide-react';
import { useGetUserCompaniesQuery, apiSlice } from '@/rtk/slices/apiSlice';
import { toast } from 'react-hot-toast';

interface Company {
  id: number;
  company_name: string;
  company_tax_id?: string;
  company_seller_id: number;
  role: string;
  permissions: string[];
}

const CompanySelector: React.FC = () => {
  const [searchParams] = useSearchParams();
  const userId = localStorage.getItem("userId");
  const currentCompanyName = localStorage.getItem("companyName");
  const currentCompanySellerId = localStorage.getItem("companySellerId");
  const urlCompany = searchParams.get('assigned-by') || searchParams.get('company');

  // Initialize selected company from localStorage or URL
  const savedSelectedCompany = localStorage.getItem("selectedCompany");
  const [selectedCompany, setSelectedCompany] = useState<string>(urlCompany || savedSelectedCompany || 'normal-seller');

  // Save selected company to localStorage whenever it changes
  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem("selectedCompany", selectedCompany);
    }
  }, [selectedCompany]);
  const [isSwitching, setIsSwitching] = useState(false);

  const { data: companiesData, isLoading, isError } = useGetUserCompaniesQuery();

  console.log("companiesData", companiesData);

  // Get companies list from API response
  const companies: Company[] = companiesData?.success ? companiesData?.data || [] : [];




  // Only show selector if user is assigned to multiple companies
  const shouldShowSelector = companies.length >= 1;


  useEffect(() => {

    if (companiesData && !isLoading && urlCompany) {
      const companyFromUrl = companies.find(company => company.company_name === urlCompany);
      if (companyFromUrl && companyFromUrl.company_name !== selectedCompany) {
        // Only switch if URL company exists and is different from current selection
        handleCompanySwitch(companyFromUrl);
        setSelectedCompany(companyFromUrl.company_name);
      }
    }
  }, [companies, companiesData, isLoading, urlCompany, selectedCompany]);

  const handleCompanySwitch = async (company: Company | null) => {
    setIsSwitching(true);

    try {
      if (company === null) {
        // Switch back to normal seller mode - keep company name but clear company mode
        // This allows permission system to access company name but applies admin permissions

        // Keep companyName in localStorage for permission system reference
        localStorage.removeItem("companySellerId");
        localStorage.removeItem("currentCompanyTaxId");
        localStorage.removeItem("companyTaxIdNumber");
        localStorage.removeItem("adminRole");
        localStorage.removeItem("isCompanyAdmin");
        localStorage.removeItem("isAssignedUser");
        localStorage.removeItem("userType"); 
        localStorage.removeItem("isCompanyMode"); 

        // Update URL - remove assigned-by parameter
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('company');
        currentUrl.searchParams.delete('assigned-by');
        window.history.replaceState({}, '', currentUrl.toString());

        // Dispatch custom event to notify components of switch back to normal seller
        window.dispatchEvent(new CustomEvent('companySwitched', {
          detail: { company: null, companySellerId: null }
        }));

        setSelectedCompany('normal-seller');
        toast.success('Switched back to normal seller account');
      } else {
        // Switch to company mode
        localStorage.setItem("companyName", company.company_name);
        localStorage.setItem("companySellerId", company.company_seller_id.toString());

        // Update company tax ID if available
        if (company.company_tax_id) {
          localStorage.setItem("currentCompanyTaxId", company.company_tax_id);
          localStorage.setItem("companyTaxIdNumber", company.company_tax_id);
        }

        // Update role and permissions context
        localStorage.setItem("adminRole", company.role);

        // Update user type identification
        localStorage.setItem("isCompanyAdmin", company.role === 'admin' ? 'true' : 'false');
        localStorage.setItem("isAssignedUser", company.role !== 'admin' ? 'true' : 'false');
        localStorage.setItem("isCompanyMode", 'true'); // Set company mode flag

        // Update URL with assigned-by parameter
        const currentUrl = new URL(window.location.href);
        // Remove any existing company or assigned-by params
        currentUrl.searchParams.delete('company');
        currentUrl.searchParams.delete('assigned-by');
        // Add the new assigned-by parameter
        currentUrl.searchParams.set('assigned-by', encodeURIComponent(company.company_name));
        window.history.replaceState({}, '', currentUrl.toString());

        // Dispatch custom event to notify components of company switch
        window.dispatchEvent(new CustomEvent('companySwitched', {
          detail: { company: company.company_name, companySellerId: company.company_seller_id }
        }));

        setSelectedCompany(company.company_name);
        toast.success(`Switched to ${company.company_name}`);
      }
    } catch (error) {
      console.error('Error switching company:', error);
      toast.error('Failed to switch company');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSelectChange = (value: string) => {
    if (value === 'normal-seller') {
      handleCompanySwitch(null);
    } else {
      const company = companies.find(c => c.company_name === value);
      if (company) {
        handleCompanySwitch(company);
      }
    }
  };


  if (isLoading || !shouldShowSelector) {
    return null;
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span>Companies unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-muted-foreground" />
      <Select
        value={selectedCompany}
        onValueChange={handleSelectChange}
        disabled={isSwitching}
      >
        <SelectTrigger className="w-48 h-8 text-sm border-muted">
          <SelectValue placeholder="Select company">
            <div className="flex items-center gap-2">
              {isSwitching && <Loader2 className="w-3 h-3 animate-spin" />}
              <span className="truncate">
                {selectedCompany === 'normal-seller' ? 'Normal Seller (Main Account)' : selectedCompany}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="normal-seller" className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="truncate">Normal Seller</span>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Main Account
              </Badge>
            </div>
          </SelectItem>
          {companies.map((company) => (
            <SelectItem
              key={company.id}
              value={company.company_name}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="truncate">{company.company_name}</span>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    company.role === 'admin'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : company.role === 'product_manager'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {company.role === 'admin' ? 'Admin' :
                   company.role === 'product_manager' ? 'Manager' : 'Viewer'}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CompanySelector;

