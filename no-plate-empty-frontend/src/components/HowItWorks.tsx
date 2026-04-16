import { Package, Truck, Heart, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Package,
    title: "List Surplus Food",
    description: "Hostel messes, cafeterias, and event teams list extra food with quantity, pickup point, and expiry time.",
    color: "bg-leaf-light text-primary",
  },
  {
    icon: Truck,
    title: "Smart Matching",
    description: "Approved NGOs and campus volunteers see nearby college food sources based on pickup location and need.",
    color: "bg-carrot-light text-secondary",
  },
  {
    icon: Heart,
    title: "Serve Campus Needs",
    description: "Surplus reaches students, NGO partners, and campus welfare teams fresh and on time.",
    color: "bg-accent text-primary",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-fresh">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-secondary font-semibold text-sm uppercase tracking-wider mb-4 block">
            Simple & Effective
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            How NoPlateEmpty Works
          </h2>
          <p className="text-muted-foreground text-lg">
            Our smart platform keeps college food donation simple from listing to campus pickup.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection Lines - Desktop Only */}
          <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/30 via-secondary/50 to-primary/30" />

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="bg-card rounded-3xl p-8 shadow-card hover:shadow-elevated transition-all duration-500 hover:-translate-y-2 h-full">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg shadow-soft">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>

                {/* Arrow indicator for next step */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-24 -right-4 w-8 h-8 bg-background rounded-full items-center justify-center shadow-soft z-10">
                    <ArrowRight className="w-4 h-4 text-secondary" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
