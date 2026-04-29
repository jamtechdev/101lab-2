import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguageAwareCategories } from "@/hooks/useLanguageAwareCategories";
import { Phone, Loader2 } from "lucide-react";
import { CountrySelectItems } from "@/components/common/CountrySelect";

const quantityOptions = [
  { value: "single", label: "Single Machine" },
  { value: "multiple", label: "Multiple Machines" },
  { value: "full_plant", label: "Full Plant" },
];

interface SellLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SellLeadModal = ({ open, onOpenChange }: SellLeadModalProps) => {
  const { data: categoriesData } = useLanguageAwareCategories();
  const categories: any[] = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData as any)?.data ?? [];

  const [form, setForm] = useState({
    category: "",
    country: "",
    quantity: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const base = (import.meta.env.VITE_PRODUCTION_URL || "http://localhost:4000/api/v1/").replace(/\/api\/v1\/?$/, "");
      const endpoint = `${base}/api/v1/reseller/submit-application`;

      const formData = new FormData();
      formData.append("lead_type", "sell-with-greenbidz");
      formData.append("category", form.category);
      formData.append("country", form.country);
      formData.append("quantity", form.quantity);
      formData.append("phone", form.phone);

      const res = await fetch(endpoint, { method: "POST", body: formData });
      const result = await res.json() as { ok?: boolean; error?: string };

      if (result?.ok) {
        toast.success("Thank you! Our asset specialists will contact you within 24 hours.");
        onOpenChange(false);
        setForm({ category: "", country: "", quantity: "", phone: "" });
      } else {
        toast.error(result?.error || "Submission failed. Please try again.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Sell Your Assets
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Provide a few details and our asset specialists will call you within 24 hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Machine Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.term_id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
                <SelectItem key="other" value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Location (Country)</Label>
            <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <CountrySelectItems />
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Asset Quantity</Label>
            <Select value={form.quantity} onValueChange={(v) => setForm({ ...form, quantity: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select quantity" />
              </SelectTrigger>
              <SelectContent>
                {quantityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Phone Number / WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="+66 812 345 678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold"
            size="lg"
            disabled={submitting}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              "Request Callback"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SellLeadModal;
