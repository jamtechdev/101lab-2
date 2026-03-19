import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Building2, Briefcase, MapPin, Globe, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BuyerDetailsModal({ open, onClose, buyer }) {
  const { t } = useTranslation();
  
  if (!buyer) return null;



  const registrationDate = new Date(buyer.user_registered).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold shadow-lg">
              {buyer.display_name?.charAt(0).toUpperCase() || 'B'}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-foreground">
                {buyer.display_name}
              </DialogTitle>
              {/* <p className="text-sm text-muted-foreground mt-1">{t("auth.buyerProfile")}</p> */}
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {buyer.ID}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("auth.contactInformation")}
            </h3>
            <div className="grid gap-3">
              <InfoCard icon={<Mail className="h-4 w-4" />} label={t("auth.email")} value={buyer.user_email} />
              <InfoCard icon={<Phone className="h-4 w-4" />} label={t("auth.phone")} value={buyer.phone} />
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("auth.companyDetail")}
            </h3>
            <div className="grid gap-3">
              <InfoCard icon={<Building2 className="h-4 w-4" />} label={t("auth.companyName")} value={buyer.company} />
              {buyer.companyDetail && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-muted-foreground mb-1">{t("auth.companyDetail")}</p>
                  <p className="text-sm text-foreground">{buyer.companyDetail}</p>
                </div>
              )}
              <InfoCard 
                icon={<Briefcase className="h-4 w-4" />} 
                label={t("auth.experience")} 
                value={buyer.experience ? `${buyer.experience} ${t("auth.years")}` : t("auth.notSpecified")} 
              />
            </div>
          </div>

          {/* Location Information */}
          {/* <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("=auth.location")}
            </h3>
            <div className="grid gap-3">
              <InfoCard 
                icon={<Globe className="h-4 w-4" />} 
                label={t("buyerDetails.country")} 
                value={buyer.country || t("buyerDetails.notSpecified")} 
              />
              <InfoCard 
                icon={<MapPin className="h-4 w-4" />} 
                label={t("buyerDetails.address")} 
                value={buyer.address || t("buyerDetails.notSpecified")} 
              />
            </div>
          </div> */}

          {/* Registration Date */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span> {registrationDate}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const InfoCard = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  </div>
);