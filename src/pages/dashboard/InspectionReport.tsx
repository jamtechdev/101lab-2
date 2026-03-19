// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast"
import { ArrowLeft, Users, Calendar, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetCompanyRegistrationByBatchQuery, useMarkSelectedCompaniesMutation } from "@/rtk/slices/productSlice";
import { useSkipInspectionForCompanyMutation } from "@/rtk/slices/batchApiSlice";
import WaitingForBuyerAction from "@/components/common/WaitingForBuyerAction";
import { subscribeSellerEvents } from "@/socket/sellerEvents"
import { useSocketConnected } from "@/services/socket";

const InspectionReport = ({ batchId, onNext, onBack }: { batchId?: any; onNext?: any; onBack?: any }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "surplus";
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);

  const socketConnected = useSocketConnected();
  const urlFinalStep = searchParams.get("finalStep");

  const { data, isLoading, refetch, error } = useGetCompanyRegistrationByBatchQuery(batchId, {
    pollingInterval: socketConnected ? 0 : 5000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });


  const [companies, setCompanies] = useState([]);
  const [skipInspection] = useSkipInspectionForCompanyMutation();

  const [markSelectedCompanies] = useMarkSelectedCompaniesMutation();
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const unsub = subscribeSellerEvents(() => {
      refetch();
    });

    return unsub;
  }, []);


  // Map API response to UI-friendly format
  useEffect(() => {
    if (data?.success && data.data?.companies) {
      const mappedCompanies = data.data.companies.map((c) => ({
        id: c.registration_id,
        company_name: c.company_name,
        country: "N/A", // API doesn't provide country
        contactPerson: c?.buyer?.display_name, // fallback
        email: c?.buyer?.user_email,
        registeredDate: c?.date,
        attended: c?.selected,
        slot: c?.slot,
      }));
      setCompanies(mappedCompanies);

    }
  }, [data]);

  const toggleAttendance = (id: number) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, attended: !c.attended } : c))
    );
  };



  const handleInspectionComplete = () => {
    const attendedCount = companies.filter((c) => c.attended).length;
    if (attendedCount === 0) {
      toast.error(t('inspectionReport.markAtLeastOne'));
      return;
    }
    toast.success(t('inspectionReport.inspectionComplete', { count: attendedCount }));
    if (onNext) onNext(batchId);
  };



  const handleSkip = async () => {
    try {
      const res = await skipInspection(batchId).unwrap();
      toast.success(res.message || t('inspectionReport.inspectionSkipped'));

      if (onNext) onNext();
    } catch (err: any) {
      toast.error(err?.message || t('inspectionReport.failedToSkip'));
    }
  };


  const handleMarkSelected = async () => {
    const inspectionId = data?.data?.inspection_id;


    if (!inspectionId || selectedCompanies.length === 0) {
      return toast.error(t('inspectionReport.selectAtLeastOne'));
    }

    try {
      const payload = {
        inspection_id: inspectionId,
        company_ids: selectedCompanies,
      };
      setLoading(true); // start spinner
      await markSelectedCompanies({
        inspection_id: inspectionId,
        company_ids: selectedCompanies,
      }).unwrap();

      toast.success(t('inspectionReport.markedSuccessfully'));

      if (onNext) onNext();


    } catch (error) {
      toast.error(t('inspectionReport.networkError'));
    } finally {
      setLoading(false); // stop spinner

    }
  };

  const companies1 = data?.data?.companies?.map((c) => ({
    id: c.registration_id,
    company_name: c.company_name,
    country: "N/A",
    contactPerson: c?.buyer?.display_name,
    email: c?.buyer?.user_email,
    registeredDate: c?.date,
    attended: c?.selected,
    slot: c?.slot,
  })) ?? [];


  const inspectionSchedule = data?.data?.schedule ?? [];


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('inspectionReport.back')}
        </Button>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Users className="w-8 h-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">{t('inspectionReport.registeredCompanies')}</p>
                <p className="text-2xl font-bold text-foreground">{companies.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">{t('inspectionReport.inspectionPeriod')}</p>
                {inspectionSchedule.length > 0 ? (
                  <div className="text-foreground space-y-4">
                    {inspectionSchedule.map((s, index) => (
                      <div key={index} className="border-b pb-2">
                        {/* Date */}
                        <p className="text-lg font-semibold">{s.date}</p>

                        {/* Numbered slots */}
                        <div className="mt-1 space-y-1">
                          {s.slots?.map((slot, idx) => (
                            <p key={idx} className="text-sm text-gray-600">
                              {idx + 1}. {slot.display_time}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No schedule found</p>
                )}


              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('inspectionReport.attendedInspection')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {companies && urlFinalStep > 4 ? companies.length : selectedCompanies.length}
                  {/* {selectedCompanies.length} */}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {urlFinalStep <= 4 &&
          <WaitingForBuyerAction data={inspectionSchedule} registrationData={companies1} />
        }

        {/* Companies Table */}
        <Card className="shadow-medium mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {t('inspectionReport.registeredTitle')}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      {t('inspectionReport.table.attended')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">{t('inspectionReport.table.companyName')}</th>
                    {/* <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">{t('inspectionReport.table.country')}</th> */}
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">{t('inspectionReport.table.contactPerson')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">{t('inspectionReport.table.email')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">{t('inspectionReport.table.registeredDate')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">{t('inspectionReport.table.slot')}</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedCompanies.includes(company.id)}
                          onCheckedChange={(checked) => {
                            setSelectedCompanies((prev) => {
                              if (checked) {
                                return [...prev, company.id]; // add to selection
                              } else {
                                return prev.filter((id) => id !== company.id); // remove from selection
                              }
                            });
                          }}
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{company.company_name}</td>
                      {/* <td className="py-3 px-4 text-muted-foreground">{company.country}</td> */}
                      <td className="py-3 px-4 text-muted-foreground">{company.contactPerson}</td>
                      <td className="py-3 px-4 text-muted-foreground">{company?.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">{company.registeredDate}</td>
                      <td className="py-3 px-4 text-muted-foreground">{company.slot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {urlFinalStep <= 4 &&
          <div className="flex justify-end gap-4 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isLoading}
            >
              {isLoading ? t('inspectionReport.skipping') : t('inspectionReport.skipInspection')}
            </Button>
            <Button
              onClick={handleMarkSelected}
              size="lg"
              className="bg-accent hover:bg-accent/90 flex items-center justify-center gap-2"
              disabled={loading} // optional: disable while loading
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('inspectionReport.inspectionComplete')}
            </Button>
          </div>
        }
      </div>
    </div>
  );
};

export default InspectionReport;
