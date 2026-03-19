import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/greenbidz_logo.png";

const SourceEquipment = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    equipmentType: "",
    specifications: "",
    budget: "",
    timeline: "",
    quantity: "",
    additionalInfo: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.equipmentType || !formData.budget || !formData.timeline) {
      toast.error(t('sourceEquipment.fillRequiredFields'));
      return;
    }

    toast.success(t('sourceEquipment.requestSubmitted'));
    navigate("/dashboard");
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img 
            src={logo} 
            alt="GreenBidz" 
            className="h-8 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2" />
            {t('sourceEquipment.backToDashboard')}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-medium">
          <CardContent className="pt-6">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {t('sourceEquipment.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('sourceEquipment.subtitle')}
              </p>
            </div>

            <Tabs defaultValue="request" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="request">{t('sourceEquipment.sendRequirements')}</TabsTrigger>
                <TabsTrigger value="marketplace">{t('sourceEquipment.browseMarketplace')}</TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="equipment-type">{t('sourceEquipment.equipmentType')}</Label>
                    <Input
                      id="equipment-type"
                      placeholder={t('sourceEquipment.equipmentTypePlaceholder')}
                      value={formData.equipmentType}
                      onChange={(e) => handleChange("equipmentType", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specifications">{t('sourceEquipment.specifications')}</Label>
                    <Textarea
                      id="specifications"
                      placeholder={t('sourceEquipment.specificationsPlaceholder')}
                      rows={4}
                      value={formData.specifications}
                      onChange={(e) => handleChange("specifications", e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">{t('sourceEquipment.budgetRange')}</Label>
                      <Input
                        id="budget"
                        placeholder={t('sourceEquipment.budgetPlaceholder')}
                        value={formData.budget}
                        onChange={(e) => handleChange("budget", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">{t('sourceEquipment.quantityNeeded')}</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="1"
                        value={formData.quantity}
                        onChange={(e) => handleChange("quantity", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeline">{t('sourceEquipment.timeline')}</Label>
                    <Input
                      id="timeline"
                      placeholder={t('sourceEquipment.timelinePlaceholder')}
                      value={formData.timeline}
                      onChange={(e) => handleChange("timeline", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additional-info">{t('sourceEquipment.additionalInfo')}</Label>
                    <Textarea
                      id="additional-info"
                      placeholder={t('sourceEquipment.additionalInfoPlaceholder')}
                      rows={4}
                      value={formData.additionalInfo}
                      onChange={(e) => handleChange("additionalInfo", e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" size="lg" variant="hero">
                      {t('sourceEquipment.submitRequest')}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="marketplace" className="mt-6">
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                    <ExternalLink className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    {t('sourceEquipment.visitMarketplace')}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    {t('sourceEquipment.marketplaceDesc')}
                  </p>
                  <Button 
                    size="lg" 
                    variant="hero"
                    onClick={() => window.open("https://greenbidz.com", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t('sourceEquipment.goToMarketplace')}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SourceEquipment;
