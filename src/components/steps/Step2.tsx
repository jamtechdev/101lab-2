import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import StepIndicator from "@/components/common/StepIndicator";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import logo from "@/assets/greenbidz_logo.png";
import { Badge } from "@/components/ui/badge";
import ChatBox from "@/pages/chat/ChatBox";

const InspectionPrice = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "surplus";
  
  const [inspectionDates, setInspectionDates] = useState<Date[]>([]);
  const [customTimeSlots, setCustomTimeSlots] = useState<string[]>([
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "1:00 PM - 2:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
  ]);
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

  const handleAddTimeSlot = () => {
    if (newTimeSlot.trim() && !customTimeSlots.includes(newTimeSlot.trim())) {
      setCustomTimeSlots([...customTimeSlots, newTimeSlot.trim()]);
      setNewTimeSlot("");
    }
  };

  const handleRemoveTimeSlot = (slot: string) => {
    setCustomTimeSlots(customTimeSlots.filter(s => s !== slot));
    setSelectedTimeSlots(selectedTimeSlots.filter(s => s !== slot));
  };

  const toggleTimeSlot = (slot: string) => {
    if (selectedTimeSlots.includes(slot)) {
      setSelectedTimeSlots(selectedTimeSlots.filter(s => s !== slot));
    } else {
      setSelectedTimeSlots([...selectedTimeSlots, slot]);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateExists = inspectionDates.some(
      d => d.toDateString() === date.toDateString()
    );
    
    if (dateExists) {
      setInspectionDates(inspectionDates.filter(
        d => d.toDateString() !== date.toDateString()
      ));
    } else {
      setInspectionDates([...inspectionDates, date]);
    }
  };

  const handleSubmit = () => {
    if (inspectionDates.length === 0 || selectedTimeSlots.length === 0) {
      toast.error("Please select at least one date and time slot");
      return;
    }

    toast.success("Inspection schedule set successfully!");
    navigate(`/inspection-report?type=${type}`);
  };

  const handleSkipInspection = () => {
    toast.info("Skipping inspection phase...");
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
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

        <Card className="shadow-medium">
          <CardContent className="pt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Inspection Schedule
              </h2>
              <p className="text-muted-foreground">
                Set the date and time available for equipment inspection
              </p>
            </div>

            <div className="space-y-6">
              {/* Inspection Dates - Multiple Selection */}
              <div className="space-y-2">
                <Label>Dates Available for Inspection * (可選擇多個日期)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        inspectionDates.length === 0 && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {inspectionDates.length > 0 
                        ? `${inspectionDates.length} date(s) selected`
                        : "Select multiple dates"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="multiple"
                      selected={inspectionDates}
                      onSelect={(dates) => setInspectionDates(dates || [])}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {inspectionDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {inspectionDates.map((date, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {format(date, "MMM d, yyyy")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Time Slots */}
              <div className="space-y-2">
                <Label>Time Slots Available * (可自訂時段)</Label>
                
                {/* Add New Time Slot */}
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., 4:00 PM - 5:00 PM"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTimeSlot()}
                  />
                  <Button onClick={handleAddTimeSlot} variant="outline">
                    Add
                  </Button>
                </div>

                {/* Time Slot Selection */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                  {customTimeSlots.map((slot) => (
                    <div key={slot} className="relative group">
                      <Button
                        variant={selectedTimeSlots.includes(slot) ? "default" : "outline"}
                        onClick={() => toggleTimeSlot(slot)}
                        className="w-full"
                      >
                        {slot}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTimeSlot(slot)}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Chat Box */}
        <ChatBox 
          listingId="LISTING-001" 
          userType="seller" 
          userName="Seller Demo"
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
          <Button 
            onClick={handleSkipInspection} 
            size="lg" 
            variant="outline"
            className="order-2 sm:order-1"
          >
            Skip Inspection
          </Button>
          <Button 
            onClick={handleSubmit} 
            size="lg" 
            className="bg-accent hover:bg-accent/90 order-1 sm:order-2"
          >
            Schedule Inspection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InspectionPrice;
