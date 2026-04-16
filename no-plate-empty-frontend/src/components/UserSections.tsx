import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import donationImage from "@/assets/donation-hands.jpg";
import foodBankImage from "@/assets/food-bank.jpg";

// Donor Section with Props
export const DonorSection = ({ onOpenRegister }: { onOpenRegister: () => void }) => {
  const benefits = [
    "Hostel, cafeteria, and event food listing",
    "Pickup point and expiry-time tracking",
    "Real-time request and acceptance updates",
    "Campus waste reduction records",
  ];

  return (
    <section id="donors" className="py-24 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider mb-4 block">For Campus Donors</span>
            <h2 className="text-4xl font-display font-bold text-foreground mb-6">Turn College Surplus Into Impact</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Hostel messes, cafeterias, canteens, and event teams can share extra food before it is wasted.
            </p>
            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
            <Button variant="default" size="lg" className="group" onClick={onOpenRegister}>
              Register Campus Donor
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
          <div className="relative">
            <img src={donationImage} alt="Donation" className="relative z-10 rounded-3xl overflow-hidden shadow-xl w-full h-[400px] object-cover" />
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-secondary/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

// Recipient Section with Props
export const RecipientSection = ({ onOpenRegister }: { onOpenRegister: () => void }) => {
  const benefits = [
    "Access to hostel, cafeteria, and event surplus",
    "Popup alerts when donors accept requests",
    "Campus pickup coordination",
    "Built for approved NGOs and college welfare teams",
  ];

  return (
    <section id="recipients" className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <img src={foodBankImage} alt="Recipient" className="relative z-10 rounded-3xl overflow-hidden shadow-xl w-full h-[400px] object-cover" />
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-secondary font-semibold text-sm uppercase tracking-wider mb-4 block">For Campus Recipients</span>
            <h2 className="text-4xl font-display font-bold text-foreground mb-6">Collect College Food Before It Goes to Waste</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Find available food from campus donors and coordinate pickup with approved NGO or welfare teams.
            </p>
            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
            <Button variant="secondary" size="lg" className="group" onClick={onOpenRegister}>
              Register Recipient Team
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
