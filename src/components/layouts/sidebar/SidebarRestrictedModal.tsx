import { useEffect, useId, useRef } from "react";
import { Lock, Clock, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  status?: string;
  onClose: () => void;
}

export function SidebarRestrictedModal({ status, onClose }: Props) {
  const { t } = useTranslation();
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const isIncomplete = status === "profile_incomplete";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card text-card-foreground rounded-xl shadow-large border border-border w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 grid place-items-center">
              {isIncomplete ? (
                <Lock className="w-4 h-4 text-amber-600" aria-hidden="true" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600" aria-hidden="true" />
              )}
            </div>
            <h2 id={titleId} className="text-sm font-semibold">
              {isIncomplete
                ? t("account.restricted.incompleteTitle", "Complete Your Profile")
                : t("account.restricted.pendingTitle", "Account Pending Approval")}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label={t("common.close", "Close")}
            className="text-muted-foreground hover:text-foreground p-1 rounded
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                       focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-5 text-center">
          <p className="text-sm text-muted-foreground mb-5">
            {isIncomplete
              ? t(
                  "account.restricted.incompleteBody",
                  "Please complete your profile to unlock all dashboard features."
                )
              : t(
                  "account.restricted.pendingBody",
                  "Your account is under review. You'll be notified once approved."
                )}
          </p>

          {isIncomplete && (
            <button
              onClick={() => {
                onClose();
                window.location.href = "/complete-google-profile";
              }}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium
                         hover:bg-primary/90 transition-colors mb-2"
            >
              {t("account.restricted.completeCta", "Complete Profile")}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg border border-border text-sm
                       text-muted-foreground hover:bg-muted transition-colors"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
