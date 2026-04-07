import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, Heart, Tag } from "lucide-react";
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
import { FoodItem, getSingleFood } from "@/lib/feature-api";

const formatDisplayDate = (value?: string) => {
  if (!value) {
    return "No expiry time set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const FoodDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [food, setFood] = useState<FoodItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Food id is missing.");
      setIsLoading(false);
      return;
    }

    const loadFood = async () => {
      setIsLoading(true);
      try {
        const response = await getSingleFood(id);
        setFood(response.food);
        setError("");
      } catch (loadError) {
        setError(getErrorMessage(loadError, "Unable to load food details."));
      } finally {
        setIsLoading(false);
      }
    };

    void loadFood();
  }, [id]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_hsl(var(--secondary)/0.14),_transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.3))]">
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
              Loading food details...
            </CardContent>
          </Card>
        ) : error || !food ? (
          <Card className="border-border/60 bg-background/92 shadow-lg">
            <CardContent className="py-10 text-center text-sm text-red-700">
              {error || "Food details could not be loaded."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[2rem] border border-border/60 bg-background/92 p-8 shadow-xl">
              <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
                Food Details
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight font-display text-foreground sm:text-5xl">
                {food.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                {food.decription}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant={food.isAvailable ? "secondary" : "outline"}>
                  {food.isAvailable ? "Available" : "Unavailable"}
                </Badge>
                {food.catagory && <Badge variant="outline">{food.catagory}</Badge>}
                {food.code && <Badge variant="outline">Code: {food.code}</Badge>}
              </div>

              {food.imageUrl && (
                <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-border/60">
                  <img
                    src={food.imageUrl}
                    alt={food.title}
                    className="h-72 w-full object-cover"
                  />
                </div>
              )}
            </section>

            <Card className="border-border/60 bg-background/92 shadow-lg">
              <CardHeader>
                <CardTitle>Food Summary</CardTitle>
                <CardDescription>
                  Review availability, expiry timing, tags, and outlet details
                  for this item.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Donor Outlet
                  </p>
                  {food.Doner && typeof food.Doner !== "string" ? (
                    <div className="mt-2 space-y-2">
                      <p className="font-medium text-foreground">
                        {food.Doner.title || "Unnamed outlet"}
                      </p>
                      <p className="text-muted-foreground">
                        {food.Doner.location?.address || "No address shared"}
                      </p>
                      {food.Doner._id && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/donors/${food.Doner._id}`}>View Outlet</Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 break-all font-medium text-foreground">
                      {typeof food.Doner === "string"
                        ? food.Doner
                        : "No outlet available"}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <Clock3 className="h-4 w-4 text-primary" />
                    Expiry
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    {formatDisplayDate(food.expireTime)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <Tag className="h-4 w-4 text-primary" />
                    Tags
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    {food.foodTags || "No tags saved"}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Rating
                    </p>
                    <p className="mt-2 font-semibold text-foreground">
                      {food.rating ?? "Not rated"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Rating Count
                    </p>
                    <p className="mt-2 font-semibold text-foreground">
                      {food.ratingCount ?? 0}
                    </p>
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

export default FoodDetailsPage;
