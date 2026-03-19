import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, Users, Clock } from "lucide-react";
import StepIndicator from "@/components/common/StepIndicator";
import logo from "@/assets/greenbidz_logo.png";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";

// Mock data for companies registered for inspection
const initialCompanies = [
  {
    id: 1,
    name: "Global Recycling Co.",
    country: "Singapore",
    contactPerson: "John Lee",
    email: "john@globalrecycling.com",
    registeredDate: "2025-01-15",
    attended: false
  },
  {
    id: 2,
    name: "EcoTech Solutions",
    country: "Malaysia",
    contactPerson: "Sarah Chen",
    email: "sarah@ecotech.com",
    registeredDate: "2025-01-16",
    attended: false
  },
  {
    id: 3,
    name: "Green Industries Ltd",
    country: "Thailand",
    contactPerson: "Michael Wong",
    email: "m.wong@greenind.com",
    registeredDate: "2025-01-16",
    attended: false
  },
  {
    id: 4,
    name: "AsiaWaste Management",
    country: "Hong Kong",
    contactPerson: "David Tan",
    email: "david@asiawaste.com",
    registeredDate: "2025-01-17",
    attended: false
  },
];

const InspectionReport = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "surplus";
  const [companies, setCompanies] = useState(initialCompanies);

  const toggleAttendance = (id: number) => {
    setCompanies(companies.map(company => 
      company.id === id ? { ...company, attended: !company.attended } : company
    ));
  };

  const handleInspectionComplete = () => {
    const attendedCount = companies.filter(c => c.attended).length;
    if (attendedCount === 0) {
      toast.error("請至少標記一家公司已完成查驗 (Please mark at least one company as attended)");
      return;
    }
    
    toast.success(`查驗完成！${attendedCount} 家公司已完成查驗 (Inspection complete! ${attendedCount} companies attended)`);
    navigate(`/bidding-step?type=${type}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <img 
            src={logo} 
            alt="GreenBidz" 
            className="h-8 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <StepIndicator
          currentStep={3}
          totalSteps={6}
          steps={["Upload", "Inventory", "Inspection", "Bidding", "Payment", "Report"]}
        />

        {/* Waiting Banner */}
        <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-6 mb-6 flex items-center gap-4">
          <Clock className="w-8 h-8 text-blue-500 flex-shrink-0 animate-pulse" />
          <div>
            <h3 className="text-lg font-bold text-foreground">等待查驗公司 (Waiting for Inspection Companies...)</h3>
            <p className="text-muted-foreground">
              {companies.length} 家公司已註冊查驗您的設備 ({companies.length} companies registered to inspect your equipment)
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Registered Companies</p>
                  <p className="text-2xl font-bold text-foreground">{companies.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Inspection Period</p>
                  <p className="text-lg font-semibold text-foreground">Jan 20-25, 2025</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Attended Inspection</p>
                  <p className="text-2xl font-bold text-foreground">{companies.filter(c => c.attended).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registered Companies Table with Checkboxes */}
        <Card className="shadow-medium mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              已註冊查驗的公司 (Companies Registered for Inspection)
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                      已到場 (Attended)
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Company Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Country</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Contact Person</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Registered Date</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={company.attended}
                          onCheckedChange={() => toggleAttendance(company.id)}
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{company.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{company.country}</td>
                      <td className="py-3 px-4 text-muted-foreground">{company.contactPerson}</td>
                      <td className="py-3 px-4 text-muted-foreground">{company.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">{company.registeredDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
          <Button 
            onClick={handleInspectionComplete} 
            size="lg" 
            className="bg-accent hover:bg-accent/90"
          >
            查驗完成 (Inspection Complete)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InspectionReport;
