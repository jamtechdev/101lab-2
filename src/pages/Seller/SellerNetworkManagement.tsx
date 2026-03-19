// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';       
import { useTranslation } from 'react-i18next';
import {
  useGetMySellerNetworkQuery,
  useAddSellersToNetworkMutation,
  useUpdateNetworkStatusMutation,
  useRemoveSellerFromNetworkMutation,
} from '@/rtk/slices/sellerNetworkSlice';

import { useGetUsersQuery } from '@/rtk/slices/apiSlice'; 
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { subscribeSellerEvents } from '@/socket/sellerEvents';
import { Search, UserPlus, Users, Building2, MoreHorizontal, Trash2, Edit, X, CheckCircle2, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";  
 

interface Seller {
  user_id: number;
  name: string;
  email: string;
  company?: string;
}

interface NetworkSeller {
  network_id: number;
  main_seller_id: number;
  network_seller_id: number;
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  added_at: string;
  networkSeller: {
    ID: number;
    user_email: string;
    display_name: string;
    user_login: string;
  };
}

const SellerNetworkManagement: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSellers, setSelectedSellers] = useState<number[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'pending'>('all');
  const [sellerToRemove, setSellerToRemove] = useState<NetworkSeller | null>(null);
  const [sellerToUpdate, setSellerToUpdate] = useState<NetworkSeller | null>(null);
  const [newStatus, setNewStatus] = useState<'pending' | 'active' | 'inactive' | 'suspended'>('active');
  const [showNewUserConfirmDialog, setShowNewUserConfirmDialog] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  // Get all seller's network data (always fetch all for both display and stats)
  const { data: allNetworkData, isLoading: isLoadingNetwork, refetch: refetchNetwork } = useGetMySellerNetworkQuery({});

  useEffect(() => {
    const unsub = subscribeSellerEvents(() => {
      refetchNetwork();
    });

    return unsub;
  }, [refetchNetwork]);

  // Get all users (for adding to network)
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery({
    page: 1,
    limit: 1000, // Get more users for selection
    search: searchTerm || undefined,
    assignedOnly: false
  });

  // Mutations
  const [addSellersMutation, { isLoading: isAdding }] = useAddSellersToNetworkMutation();
  const [updateStatusMutation, { isLoading: isUpdating }] = useUpdateNetworkStatusMutation();
  const [removeSellerMutation, { isLoading: isRemoving }] = useRemoveSellerFromNetworkMutation();

  // Get all network members
  const allNetworkMembers = useMemo(() => {
    if (!allNetworkData?.data) return [];
    return allNetworkData.data as NetworkSeller[];
  }, [allNetworkData]);

  // Filter network members based on status filter (client-side filtering)
  const networkMembers = useMemo(() => {
    if (statusFilter === 'all') return allNetworkMembers;
    return allNetworkMembers.filter(member => member.status === statusFilter);
  }, [allNetworkMembers, statusFilter]);

  // Get available sellers (filter out those already in network and current seller)
  const availableSellers = useMemo(() => {
    if (!usersData?.data) return [];

    const currentSellerId = parseInt(localStorage.getItem('userId') || '0');
    const networkSellerIds = new Set(allNetworkMembers.map(member => member.network_seller_id));

    return (usersData.data as Seller[]).filter(seller =>
      seller.user_id !== currentSellerId && // Not current seller
      !networkSellerIds.has(seller.user_id) // Not already in network (any status)
    );
  }, [usersData, allNetworkMembers]);

  // Handle adding sellers to network
  const handleAddSellers = async () => {
    const emails = emailInput.trim() ? [emailInput.trim()] : [];
    
    if (selectedSellers.length === 0 && emails.length === 0) {
      toast.error(t('sellerNetwork.selectSellersToAdd'));
      return;
    }

    // Check if email exists in our system
    if (emails.length > 0) {
      const emailExists = usersData?.data?.some((user: Seller) => 
        user.email.toLowerCase() === emails[0].toLowerCase()
      );
      
      if (!emailExists) {
        setPendingEmail(emails[0]);
        setShowNewUserConfirmDialog(true);
        return;
      }
    }

    await proceedWithInvitation();
  };

  // Proceed with invitation after confirmation
  const proceedWithInvitation = async () => {
    const emails = pendingEmail || emailInput.trim() ? [pendingEmail || emailInput.trim()] : [];
    
    try {
      const result = await addSellersMutation({ 
        sellerIds: selectedSellers,
        emails 
      }).unwrap();

      if (result.success) {
        // Check for failures
        if (result.data?.failed?.length > 0) {
          const failedEmail = result.data.failed[0];
          toast.error(`Failed: ${failedEmail.reason}`);
          setShowNewUserConfirmDialog(false);
          setPendingEmail('');
          return;
        }
        
        const msg = result.data?.newUsersCreated?.length > 0
          ? `${result.data.successful.length} invited (${result.data.newUsersCreated.length} new users created)`
          : `${selectedSellers.length + emails.length} ${t('sellerNetwork.sellersAdded')}`;
        toast.success(msg);
        setShowAddDialog(false);
        setSelectedSellers([]);
        setEmailInput('');
        setPendingEmail('');
        setShowNewUserConfirmDialog(false);
        refetchNetwork();
      } else {
        toast.error(result.message || t('common.error'));
        setShowNewUserConfirmDialog(false);
        setPendingEmail('');
      }
    } catch (error: any) {
      console.error('Error adding sellers:', error);
      toast.error(error?.data?.message || error?.message || t('common.error'));
      setShowNewUserConfirmDialog(false);
      setPendingEmail('');
    }
  };

  // Handle updating network status
  const handleUpdateStatus = async () => {
    if (!sellerToUpdate) return;

    try {
      const result = await updateStatusMutation({
        networkId: sellerToUpdate.network_id,
        status: newStatus
      }).unwrap();

      if (result.success) {
        toast.success(t('sellerNetwork.statusUpdated'));
        setSellerToUpdate(null);
        refetchNetwork();
      } else {
        toast.error(result.message || t('common.error'));
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error?.data?.message || error?.message || t('common.error'));
    }
  };

  // Handle direct status update (toggle buttons)
  const handleUpdateStatusDirect = async (networkId: number, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      const result = await updateStatusMutation({
        networkId,
        status: newStatus
      }).unwrap();

      if (result.success) {
        toast.success(t('sellerNetwork.statusUpdated'));
        refetchNetwork();
      } else {
        toast.error(result.message || t('common.error'));
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error?.data?.message || error?.message || t('common.error'));
    }
  };

  // Handle removing seller from network
  const handleRemoveSeller = async () => {
    if (!sellerToRemove) return;

    try {
      const result = await removeSellerMutation(sellerToRemove.network_id).unwrap();

      if (result.success) {
        toast.success(t('sellerNetwork.sellerRemoved'));
        setSellerToRemove(null);
        refetchNetwork();
      } else {
        toast.error(result.message || t('common.error'));
      }
    } catch (error: any) {
      console.error('Error removing seller:', error);
      toast.error(error?.data?.message || error?.message || t('common.error'));
    }
  };

  // Handle seller selection
  const handleSellerSelect = (sellerId: number) => {
    setSelectedSellers(prev =>
      prev.includes(sellerId)
        ? prev.filter(id => id !== sellerId)
        : [...prev, sellerId]
    );
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('sellerNetwork.title')}</h1>
            <p className="text-gray-500 mt-1">{t('sellerNetwork.subtitle')}</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('sellerNetwork.addSellers')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('sellerNetwork.networkMembers')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{allNetworkMembers.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('sellerNetwork.networkStatus.pending')}</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {allNetworkMembers.filter(m => m.status === 'pending').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('sellerNetwork.networkStatus.active')}</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {allNetworkMembers.filter(m => m.status === 'active').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder={t('sellerNetwork.searchSellers')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="pending">{t('sellerNetwork.networkStatus.pending')}</SelectItem>
                  <SelectItem value="active">{t('sellerNetwork.networkStatus.active')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Network Members List */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sellerNetwork.networkMembers')}</CardTitle>
            <p className="text-sm text-gray-500">
              {networkMembers.length} {t('sellerNetwork.networkMembers').toLowerCase()}
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingNetwork ? (
              <div className="text-center py-8 text-gray-500">{t('sellerNetwork.loading')}</div>
            ) : networkMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">{t('sellerNetwork.noNetworkMembers')}</p>
                <p className="text-sm mt-1">{t('sellerNetwork.startAdding')}</p>
                <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('sellerNetwork.addSellers')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {networkMembers.map((member) => (
                  <div
                    key={member.network_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {member.networkSeller.display_name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className="font-semibold">{member.networkSeller.display_name}</div>
                        <div className="text-sm text-gray-500">{member.networkSeller.user_email}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {t('sellerNetwork.addedOn')}: {new Date(member.added_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadgeColor(member.status)}>
                        {t(`sellerNetwork.networkStatus.${member.status}`)}
                      </Badge>
                      {/* Quick Toggle Buttons */}
                      <div className="flex items-center gap-1">
                        {member.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatusDirect(member.network_id, 'inactive')}
                            disabled={isUpdating}
                            className="text-red-600 border-red-200 hover:bg-red-50 px-2"
                            title={t('sellerNetwork.makeInactive', 'Make Inactive')}
                          >
                            <ToggleRight className="h-4 w-4" />
                          </Button>
                        ) : member.status === 'inactive' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatusDirect(member.network_id, 'active')}
                            disabled={isUpdating}
                            className="text-green-600 border-green-200 hover:bg-green-50 px-2"
                            title={t('sellerNetwork.makeActive', 'Make Active')}
                          >
                            <ToggleLeft className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatusDirect(member.network_id, 'active')}
                            disabled={isUpdating}
                            className="text-green-600 border-green-200 hover:bg-green-50 px-2"
                            title={t('sellerNetwork.activate', 'Activate')}
                          >
                            <ToggleLeft className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {/* <DropdownMenuItem
                            onClick={() => {
                              setSellerToUpdate(member);
                              setNewStatus(member.status);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t('common.edit')}
                          </DropdownMenuItem> */}
                          <DropdownMenuItem
                            onClick={() => setSellerToRemove(member)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('sellerNetwork.removeFromNetwork')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Sellers Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('sellerNetwork.addSellers')}</DialogTitle>
              <DialogDescription>{t('sellerNetwork.selectSellersToAdd')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Invite by Email</label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  New users will be created automatically and sent login credentials
                </p>
              </div>
              <div className="text-center text-sm text-gray-500">OR</div>
              {/* Selected Sellers Display */}
              {selectedSellers.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-muted-foreground mb-2">
                    Selected ({selectedSellers.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSellers.map((sellerId) => {
                      const seller = availableSellers.find(s => s.user_id === sellerId);
                      return seller ? (
                        <div
                          key={sellerId}
                          className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs"
                        >
                          <span>{seller.name} ({seller.email})</span>
                          <button
                            onClick={() => handleSellerSelect(sellerId)}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Search Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by company name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchTerm && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Available Users Count */}
              <div className="text-xs text-muted-foreground">
                {availableSellers.length} users available
                {selectedSellers.length > 0 && ` (${selectedSellers.length} selected)`}
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {isLoadingUsers ? (
                  <div className="text-center py-4">{t('sellerNetwork.loading')}</div>
                ) : availableSellers.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">{t('sellerNetwork.noSellersFound')}</div>
                ) : (
                  availableSellers
                    .filter((seller) => {
                      // If no search term, show all users
                      if (!searchTerm.trim()) return true;

                      // Search in name and email
                      const searchLower = searchTerm.toLowerCase().trim();
                      const nameMatch = seller.name?.toLowerCase().includes(searchLower);
                      const emailMatch = seller.email?.toLowerCase().includes(searchLower);
                      const companyMatch = seller.company?.toLowerCase().includes(searchLower);

                      return nameMatch || emailMatch || companyMatch;
                    })
                    .map((seller) => {
                      const isSelected = selectedSellers.includes(seller.user_id);
                      return (
                        <div
                          key={seller.user_id}
                          className={`p-3 cursor-pointer border rounded-lg transition-all ${
                            isSelected
                              ? 'bg-blue-50 border-blue-200 opacity-75'
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => handleSellerSelect(seller.user_id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleSellerSelect(seller.user_id);
                                }}
                                className="rounded"
                              />
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                {seller.name?.charAt(0)?.toUpperCase() || 'S'}
                              </div>
                              <div>
                                <div className="font-medium">{seller.name}</div>
                                <div className="text-sm text-gray-500">{seller.email}</div>
                                {seller.company && (
                                  <div className="text-xs text-gray-400">{seller.company}</div>
                                )}
                              </div>
                            </div>

                            {isSelected && (
                              <div className="text-blue-600">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddDialog(false); setEmailInput(''); }}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleAddSellers} disabled={isAdding || (selectedSellers.length === 0 && !emailInput.trim())}>
                {isAdding ? t('common.loading') : `${t('sellerNetwork.addSellers')} (${selectedSellers.length + (emailInput.trim() ? 1 : 0)})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={!!sellerToUpdate} onOpenChange={() => setSellerToUpdate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('common.edit')} {t('sellerNetwork.networkStatus.active')}</DialogTitle>
              <DialogDescription>
                {t('sellerNetwork.chooseSeller')} {sellerToUpdate?.networkSeller.display_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('common.status')}</label>
                <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('sellerNetwork.networkStatus.pending')}</SelectItem>
                    <SelectItem value="active">{t('sellerNetwork.networkStatus.active')}</SelectItem>
                    <SelectItem value="inactive">{t('sellerNetwork.networkStatus.inactive')}</SelectItem>
                    <SelectItem value="suspended">{t('sellerNetwork.networkStatus.suspended')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSellerToUpdate(null)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                {isUpdating ? t('common.loading') : t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Seller Confirmation */}
        <AlertDialog open={!!sellerToRemove} onOpenChange={() => setSellerToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('sellerNetwork.removeFromNetwork')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('sellerNetwork.confirmRemove')}
                {sellerToRemove && (
                  <span className="font-medium"> {sellerToRemove.networkSeller.display_name}</span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveSeller}
                disabled={isRemoving}
                className="bg-red-600 hover:bg-red-700"
              >
                {isRemoving ? t('common.loading') : t('sellerNetwork.removeFromNetwork')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* New User Confirmation Dialog */}
        <AlertDialog open={showNewUserConfirmDialog} onOpenChange={setShowNewUserConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New User Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This email is not registered in our system. Do you want to continue by creating a new user account?
                <br /><br />
                <strong>Email:</strong> {pendingEmail}
                <br /><br />
                A system-generated password will be created and sent to the user via email. After successful user creation, the seller network invitation will be sent automatically.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setPendingEmail(''); setShowNewUserConfirmDialog(false); }}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={proceedWithInvitation} disabled={isAdding}>
                {isAdding ? t('common.loading') : 'Create & Invite'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default SellerNetworkManagement;
