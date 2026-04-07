import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getErrorMessage } from "@/lib/auth";
import { DonorEntry, FoodItem, getFoodsByDonor, getSingleDonorEntry } from "@/lib/feature-api";

const DonorDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<DonorEntry | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Donor id is missing.");
      setIsLoading(false);
      return;
    }

    const loadEntry = async () => {
      setIsLoading(true);
      try {
        const [entryResponse, foodsResponse] = await Promise.all([
          getSingleDonorEntry(id),
          getFoodsByDonor(id).catch(() => ({ foods: [] })),
        ]);
        setEntry(entryResponse.Doner);
        setFoods(Array.isArray(foodsResponse.foods) ? foodsResponse.foods : []);
        setError("");
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Unable to load donor details."));
      } finally {
        setIsLoading(false);
      }
    };

    void loadEntry();
  }, [id]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.14),_transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.3))]">
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

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <Card className="border-border/60 bg-background/92 shadow-lg">
            <CardContent className="py-10 text-sm text-muted-foreground">
              Loading donor details...
            </CardContent>
          </Card>
        ) : error || !entry ? (
          <Card className="border-border/60 bg-background/92 shadow-lg">
            <CardContent className="py-10 text-center text-sm text-red-700">
              {error || "Donor details could not be loaded."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[2rem] border border-border/60 bg-background/92 p-8 shadow-xl">
              <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
                Donor Outlet Details
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight font-display text-foreground sm:text-5xl">
                {entry.title}
              </h1>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant={entry.isOpen ? "secondary" : "outline"}>
                  {entry.isOpen ? "Open" : "Closed"}
                </Badge>
                {entry.pickup && <Badge variant="outline">Pickup</Badge>}
                {entry.delivery && <Badge variant="outline">Delivery</Badge>}
              </div>

              {entry.imageUrl && (
                <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-border/60">
                  <img
                    src={entry.imageUrl}
                    alt={entry.title}
                    className="h-72 w-full object-cover"
                  />
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-border/60 bg-muted/25 p-5">
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{entry.location?.address || "No address shared"}</span>
                </p>
              </div>
            </section>

            <Card className="border-border/60 bg-background/92 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Outlet Summary
                </CardTitle>
                <CardDescription>
                  Review this outlet's operating details, location information,
                  and published food labels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Operating Time
                  </p>
                  <p className="mt-2 font-medium text-foreground">
                    {entry.time || "Not shared"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Location Title
                  </p>
                  <p className="mt-2 font-medium text-foreground">
                    {entry.location?.title || "Not shared"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Food Labels
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(entry.food || []).length > 0 ? (
                      entry.food?.map((foodItem) => (
                        <Badge key={foodItem} variant="outline">
                          {foodItem}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No food labels saved</span>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Rating
                    </p>
                    <p className="mt-2 font-semibold text-foreground">
                      {entry.rating ?? "Not rated"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Rating Count
                    </p>
                    <p className="mt-2 font-semibold text-foreground">
                      {entry.ratingCount ?? 0}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Foods In This Outlet
                  </p>
                  <div className="mt-3 space-y-2">
                    {foods.length > 0 ? (
                      foods.map((food) => (
                        <div
                          key={food._id}
                          className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                        >
                          <p className="font-medium text-foreground">{food.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {food.decription || "No description"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">
                        No foods are linked to this outlet yet.
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default DonorDetailsPage;
