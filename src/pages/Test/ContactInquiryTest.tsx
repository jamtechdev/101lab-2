import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const guestOptions = ["1-50", "51-100", "101-200", "200+"];
const attendingOptions = ["Wedding Ceremony", "Reception", "Both"];
const mealOptions = ["Vegetarian", "Non-Vegetarian", "Vegan", "No Preference"];

const ContactInquiryTest = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    guests: "",
    attending: "",
    meal: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Inquiry sent successfully!");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white flex items-center justify-center">
      {/* Floral decorations - left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-72 pointer-events-none opacity-60"
        style={{
          background:
            "linear-gradient(135deg, hsl(220 40% 85%) 0%, hsl(220 30% 92%) 50%, transparent 100%)",
        }}
      />

      {/* Floral decorations - right */}
      <div
        className="absolute right-0 top-0 h-[500px] w-80 pointer-events-none opacity-50"
        style={{
          background:
            "linear-gradient(225deg, hsl(220 40% 85%) 0%, hsl(220 30% 92%) 40%, transparent 100%)",
        }}
      />

      {/* Vertical accent lines */}
      <div className="absolute left-[18%] top-0 bottom-0 w-px bg-[hsl(210_40%_80%/0.5)]" />
      <div className="absolute right-[18%] top-0 bottom-0 w-px bg-[hsl(210_40%_80%/0.5)]" />

      {/* Main form card */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm tracking-[0.3em] uppercase text-[hsl(220_20%_60%)] mb-2">
            Let's Meet
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-wide text-[hsl(220_15%_20%)] uppercase">
            Make An Inquiry
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm text-[hsl(220_15%_40%)]">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border-0 border-b border-[hsl(220_20%_80%)] bg-transparent py-2 text-sm text-[hsl(220_15%_20%)] placeholder:text-[hsl(220_15%_70%)] focus:outline-none focus:border-[hsl(220_40%_60%)] transition-colors"
              placeholder=""
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm text-[hsl(220_15%_40%)]">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border-0 border-b border-[hsl(220_20%_80%)] bg-transparent py-2 text-sm text-[hsl(220_15%_20%)] placeholder:text-[hsl(220_15%_70%)] focus:outline-none focus:border-[hsl(220_40%_60%)] transition-colors"
              placeholder=""
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-sm text-[hsl(220_15%_40%)]">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border-0 border-b border-[hsl(220_20%_80%)] bg-transparent py-2 text-sm text-[hsl(220_15%_20%)] placeholder:text-[hsl(220_15%_70%)] focus:outline-none focus:border-[hsl(220_40%_60%)] transition-colors"
              placeholder=""
            />
          </div>

          {/* Number of Guests */}
          <div className="space-y-1">
            <Select
              value={form.guests}
              onValueChange={(v) => setForm({ ...form, guests: v })}
            >
              <SelectTrigger className="w-full border-0 border-b border-[hsl(220_20%_80%)] rounded-none bg-transparent px-0 py-2 text-sm text-[hsl(220_15%_40%)] shadow-none focus:ring-0 focus:border-[hsl(220_40%_60%)] h-auto">
                <SelectValue placeholder="Number Of Guests" />
              </SelectTrigger>
              <SelectContent>
                {guestOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* What Will Be You Attending */}
          <div className="space-y-1">
            <Select
              value={form.attending}
              onValueChange={(v) => setForm({ ...form, attending: v })}
            >
              <SelectTrigger className="w-full border-0 border-b border-[hsl(220_20%_80%)] rounded-none bg-transparent px-0 py-2 text-sm text-[hsl(220_15%_40%)] shadow-none focus:ring-0 focus:border-[hsl(220_40%_60%)] h-auto">
                <SelectValue placeholder="What Will Be You Attending" />
              </SelectTrigger>
              <SelectContent>
                {attendingOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meal Preferences */}
          <div className="space-y-1">
            <Select
              value={form.meal}
              onValueChange={(v) => setForm({ ...form, meal: v })}
            >
              <SelectTrigger className="w-full border-0 border-b border-[hsl(220_20%_80%)] rounded-none bg-transparent px-0 py-2 text-sm text-[hsl(220_15%_40%)] shadow-none focus:ring-0 focus:border-[hsl(220_40%_60%)] h-auto">
                <SelectValue placeholder="Meal Preferences" />
              </SelectTrigger>
              <SelectContent>
                {mealOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <div className="pt-6 flex justify-center">
            <button
              type="submit"
              className="px-12 py-3 bg-[hsl(210_30%_85%)] text-[hsl(220_15%_30%)] text-sm tracking-widest uppercase hover:bg-[hsl(210_30%_78%)] transition-colors border border-[hsl(210_30%_78%)]"
            >
              Send An Inquiry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactInquiryTest;
