import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, LogOut, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import SectionErrorBoundary from "@/components/SectionErrorBoundary";
import DonorProfileSection from "@/components/donor/DonorProfileSection";
import CategoryManagerSection from "@/components/donor/CategoryManagerSection";
import FoodManagerSection from "@/components/donor/FoodManagerSection";
import IncomingOrdersSection from "@/components/donor/IncomingOrdersSection";
import PerformanceAnalyticsSection from "@/components/donor/PerformanceAnalyticsSection";

const DonorDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_hsl(var(--secondary)/0.18),_transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.35))]">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Heart className="h-5 w-5 fill-current text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">
              NoPlate<span className="text-secondary">Empty</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">Donor Workspace</Badge>
            <Button variant="outline" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/account/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
            <Button onClick={() => void handleSignOut()} disabled={isSigningOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="rounded-[2rem] border border-border/60 bg-background/92 p-8 shadow-xl">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
            Donor Home
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight font-display text-foreground sm:text-5xl">
            Welcome, {user.name}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Manage outlets, publish available food, respond to incoming requests,
            and review planning insights from one dashboard.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Badge variant="outline">{user.email}</Badge>
            <Badge variant={user.isApproved ? "secondary" : "outline"}>
              {user.isApproved ? "Approved" : "Pending Approval"}
            </Badge>
            <Badge variant={user.isBlocked ? "destructive" : "outline"}>
              {user.isBlocked ? "Blocked" : "Active"}
            </Badge>
          </div>
        </section>

        <Tabs defaultValue="profile" className="mt-8 space-y-6">
          <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="profile">Outlets</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="foods">Foods</TabsTrigger>
            <TabsTrigger value="orders">Incoming Orders</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <SectionErrorBoundary
              title="Outlets Unavailable"
              description="The donor outlets section had a runtime problem."
            >
              <DonorProfileSection />
            </SectionErrorBoundary>
          </TabsContent>
          <TabsContent value="categories">
            <SectionErrorBoundary
              title="Categories Unavailable"
              description="The categories section had a runtime problem."
            >
              <CategoryManagerSection />
            </SectionErrorBoundary>
          </TabsContent>
          <TabsContent value="foods">
            <SectionErrorBoundary
              title="Foods Unavailable"
              description="The foods section had a runtime problem."
            >
              <FoodManagerSection />
            </SectionErrorBoundary>
          </TabsContent>
          <TabsContent value="orders">
            <SectionErrorBoundary
              title="Orders Unavailable"
              description="The incoming orders section had a runtime problem."
            >
              <IncomingOrdersSection />
            </SectionErrorBoundary>
          </TabsContent>
          <TabsContent value="analytics">
            <SectionErrorBoundary
              title="Analytics Unavailable"
              description="The donor analytics section had a runtime problem."
            >
              <PerformanceAnalyticsSection />
            </SectionErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DonorDashboard;
