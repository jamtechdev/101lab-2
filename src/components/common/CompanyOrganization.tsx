import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGetPendingInvitationsQuery, useAcceptNetworkInvitationMutation } from "@/rtk/slices/sellerNetworkSlice";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../layouts/DashboardLayout';
import BuyerHeader from '@/pages/buyer/BuyerHeader';
import { subscribeSellerEvents } from '@/socket/sellerEvents';

const CompanyOrganization = () => {
    const { t } = useTranslation();
    const location = useLocation(); 
    const showDashboardLayout = location.pathname.startsWith("/dashboard");

    const userId = Number(localStorage.getItem("userId"));
    const [activeTab, setActiveTab] = useState("incoming");

    // Get incoming invitations (people who invited me)
    const { data: incomingInvitationsData, isLoading: incomingLoading, refetch: refetchIncoming } = useGetPendingInvitationsQuery();

    // Accept incoming invitation
    const [acceptInvitation, { isLoading: accepting }] = useAcceptNetworkInvitationMutation();

    useEffect(() => {
        const unsub = subscribeSellerEvents(() => {
            refetchIncoming();
        });

        return unsub;
    }, [refetchIncoming]);

    const handleAcceptInvitation = async (networkId: number) => {
        try {
            await acceptInvitation({ networkId }).unwrap();
            toast.success(t('organization.invitationAccepted', 'Invitation accepted successfully'));
            refetchIncoming();
        } catch (error: any) {
            toast.error(error?.data?.message || t('organization.invitationAcceptError', 'Failed to accept invitation'));
        }
    };

    const incomingInvitations = incomingInvitationsData?.success ? incomingInvitationsData?.data || [] : [];


    const content = (
        <div>
            {!showDashboardLayout && <BuyerHeader/>}
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <Mail className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-3xl font-bold">{t('organization.title', 'Company Organization')}</h1>
                        <p className="text-gray-600">{t('organization.subtitle', 'Manage incoming organization invitations')}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-blue-600" />
                            {t('organization.incomingInvitations', 'Incoming Invitations')}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            {t('organization.incomingDescription', 'Invitations from other sellers to join their network')}
                        </p>
                    </CardHeader>
                    <CardContent>
                        {incomingLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-gray-600">{t('common.loading', 'Loading...')}</p>
                            </div>
                        ) : incomingInvitations.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                                <p className="text-gray-600">{t('organization.noIncomingInvitations', 'No incoming invitations')}</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {incomingInvitations.map((invitation: any) => (
                                    <div key={invitation.network_id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{invitation.mainSeller?.display_name || invitation.mainSeller?.user_email}</p>
                                                <p className="text-sm text-gray-600">{invitation.mainSeller?.user_email}</p>
                                                <p className="text-xs text-gray-500">
                                                    {t('organization.invitedOn', 'Invited on')}: {new Date(invitation.added_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                {t('organization.status.pending', 'Pending')}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleAcceptInvitation(invitation.network_id)}
                                                disabled={accepting}
                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                {t('organization.accept', 'Accept')}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );


    return showDashboardLayout ? <DashboardLayout>{content}</DashboardLayout> : content;
};

export default CompanyOrganization;
