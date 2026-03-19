import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Home, Eye } from "lucide-react";

const Confirmation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-medium">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-accent" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            {t('confirmation.title')}
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            {t('confirmation.subtitle')}
          </p>

          <div className="bg-secondary/50 rounded-lg p-6 mb-8">
            {/* <h3 className="font-semibold text-foreground mb-3">{t('confirmation.whatsNext')}</h3> */}
            <ul className="text-left space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>{t('confirmation.step1')}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>{t('confirmation.step2')}</span>
              </li>
              {/* <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>{t('confirmation.step3')}</span>
              </li> */}
              <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>{t('confirmation.step4')}</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="lg"
              onClick={() => navigate("/dashboard")}
            >
              <Eye className="mr-2" />
              {t('confirmation.viewDashboard')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/")}
            >
              <Home className="mr-2" />
              {t('confirmation.backToHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Confirmation;
