import {
  Building2,
  CalendarDays,
  GraduationCap,
  School,
  Users,
  Utensils,
} from "lucide-react";

const categories = [
  {
    icon: Utensils,
    name: "Hostel Mess Food",
    description: "Breakfast, lunch, dinner, and bulk meal surplus",
    source: "Hostel blocks",
    color: "from-primary to-primary/80",
  },
  {
    icon: School,
    name: "College Cafeteria",
    description: "Canteen meals, snacks, and beverages near closing time",
    source: "Campus canteens",
    color: "from-secondary to-secondary/80",
  },
  {
    icon: CalendarDays,
    name: "College Events",
    description: "Surplus from seminars, fests, workshops, and sports days",
    source: "Event teams",
    color: "from-primary to-secondary",
  },
  {
    icon: Building2,
    name: "Department Programs",
    description: "Food left after department meets and guest lectures",
    source: "Departments",
    color: "from-leaf to-primary",
  },
  {
    icon: Users,
    name: "Student Clubs",
    description: "Club drives, NSS units, and campus volunteer groups",
    source: "Student teams",
    color: "from-carrot to-secondary",
  },
  {
    icon: GraduationCap,
    name: "Campus Kitchens",
    description: "Prepared batches from college kitchens and food labs",
    source: "Kitchen teams",
    color: "from-primary to-secondary/70",
  },
];

const FoodCategories = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-secondary font-semibold text-sm uppercase tracking-wider mb-4 block">
            Campus Food Sources
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            College Food Donation Only
          </h2>
          <p className="text-muted-foreground text-lg">
            Food listings focus on hostel messes, college cafeterias, and campus events so surplus can be collected fast and managed inside the college network.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative z-10">
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-foreground/20 transition-colors duration-300">
                  <category.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>

                <h3 className="text-lg font-bold text-foreground group-hover:text-primary-foreground mb-1 transition-colors duration-300">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/80 mb-3 transition-colors duration-300">
                  {category.description}
                </p>

                <div className="text-sm font-semibold text-secondary group-hover:text-primary-foreground transition-colors duration-300">
                  {category.source}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FoodCategories;
