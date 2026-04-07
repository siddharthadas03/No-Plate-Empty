import { useEffect, useState } from "react";
import { Filter, RefreshCw, ShoppingBasket } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/auth";
import {
  Category,
  FoodItem,
  getAllFoods,
  getCategories,
  placeOrder,
} from "@/lib/feature-api";

interface FoodBrowseSectionProps {
  onOrderPlaced?: () => void;
}

const formatDisplayDate = (value?: string) => {
  if (!value) {
    return "No expiry set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const getOutletId = (food: FoodItem) => {
  if (!food.Doner) {
    return undefined;
  }

  return typeof food.Doner === "string" ? food.Doner : food.Doner._id;
};

const getOutletTitle = (food: FoodItem) => {
  if (!food.Doner) {
    return "Unknown outlet";
  }

  if (typeof food.Doner === "string") {
    return food.Doner;
  }

  return food.Doner.title || food.Doner.location?.title || "Unnamed outlet";
};

const getOutletAddress = (food: FoodItem) => {
  if (!food.Doner || typeof food.Doner === "string") {
    return "No outlet address shared";
  }

  return food.Doner.location?.address || "No outlet address shared";
};

const FoodBrowseSection = ({ onOrderPlaced }: FoodBrowseSectionProps) => {
  const { token } = useAuth();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadCatalog = async (showRefreshState = false) => {
    if (!token) {
      return;
    }

    if (showRefreshState) {
      setIsRefreshing(true);
      setMessage(null);
    } else {
      setIsLoading(true);
    }

    try {
      const [foodsResponse, categoriesResponse] = await Promise.all([
        getAllFoods(),
        getCategories(),
      ]);

      setFoods(
        (foodsResponse.foods || []).filter((food) => food.isAvailable !== false),
      );
      setCategories(categoriesResponse.categories || []);

      if (showRefreshState) {
        setMessage({ type: "success", text: "Food catalog refreshed." });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to load available foods."),
      });
    } finally {
      if (showRefreshState) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadCatalog();
  }, [token]);

  if (!token) {
    return null;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const visibleFoods = foods.filter((food) => {
    const matchesCategory =
      selectedCategory === "all" || food.catagory === selectedCategory;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [
        food.title,
        food.decription,
        food.catagory,
        food.code,
        food.foodTags,
        getOutletTitle(food),
        getOutletAddress(food),
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch));

    return matchesCategory && matchesSearch;
  });

  const selectedFoods = foods.filter((food) => selectedFoodIds.includes(food._id));
  const selectedOutletId =
    selectedFoods.length > 0 ? getOutletId(selectedFoods[0]) : undefined;

  const toggleFoodSelection = (food: FoodItem) => {
    setMessage(null);

    if (selectedFoodIds.includes(food._id)) {
      setSelectedFoodIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== food._id),
      );
      return;
    }

    const outletId = getOutletId(food);
    if (!outletId) {
      setMessage({
        type: "error",
        text: "This food item does not have a valid outlet reference.",
      });
      return;
    }

    if (selectedOutletId && outletId !== selectedOutletId) {
      setMessage({
        type: "error",
        text: "Please select items from a single outlet for each order. Clear your current selection to switch outlets.",
      });
      return;
    }

    setSelectedFoodIds((currentIds) => [...currentIds, food._id]);
  };

  const submitOrder = async () => {
    if (selectedFoodIds.length === 0) {
      setMessage({
        type: "error",
        text: "Select at least one food item before placing an order.",
      });
      return;
    }

    setIsPlacingOrder(true);
    setMessage(null);

    try {
      await placeOrder(token, selectedFoodIds);
      setSelectedFoodIds([]);
      setMessage({
        type: "success",
        text: "Order placed successfully. You can track it in My Orders.",
      });
      onOrderPlaced?.();
      await loadCatalog();
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to place your order."),
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-background/92 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBasket className="h-5 w-5 text-primary" />
                Browse Available Food
              </CardTitle>
              <CardDescription>
                Search live listings, compare outlet pickup details, and build one
                order from a single outlet at a time.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => void loadCatalog(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isRefreshing ? "Refreshing..." : "Refresh Catalog"}
            </Button>
          </div>

          {message && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Filter className="h-4 w-4 text-primary" />
                Find food by keyword, category, or outlet
              </div>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search food title, outlet, address, category, or code"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "all" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                >
                  All Categories
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category._id}
                    variant={
                      selectedCategory === category.title ? "secondary" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category.title)}
                  >
                    {category.title}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium text-foreground">Current selection</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {selectedFoodIds.length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Complete each request with items from the same outlet.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">
                  Outlet:{" "}
                  {selectedFoods.length > 0
                    ? getOutletTitle(selectedFoods[0])
                    : "Not selected"}
                </Badge>
                <Badge variant="outline">Visible Foods: {visibleFoods.length}</Badge>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => void submitOrder()}
                disabled={isPlacingOrder || selectedFoodIds.length === 0}
              >
                {isPlacingOrder ? "Placing Order..." : "Place Selected Order"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <Card className="border-border/60 bg-background/92 shadow-lg">
          <CardContent className="py-10 text-sm text-muted-foreground">
            Loading available food...
          </CardContent>
        </Card>
      ) : visibleFoods.length === 0 ? (
        <Card className="border-border/60 bg-background/92 shadow-lg">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No available food matches the current filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleFoods.map((food) => {
            const outletId = getOutletId(food);
            const isSelected = selectedFoodIds.includes(food._id);
            const lockedByAnotherOutlet =
              selectedFoodIds.length > 0 &&
              Boolean(outletId && selectedOutletId && outletId !== selectedOutletId);

            return (
              <Card
                key={food._id}
                className="border-border/60 bg-background/92 shadow-lg"
              >
                <CardContent className="space-y-4 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-foreground">
                          {food.title}
                        </p>
                        <Badge variant="secondary">Available</Badge>
                        <Badge variant="outline">{getOutletTitle(food)}</Badge>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {food.decription}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/foods/${food._id}`}>View Details</Link>
                      </Button>
                      <Button
                        variant={isSelected ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleFoodSelection(food)}
                        disabled={!outletId || lockedByAnotherOutlet}
                      >
                        {isSelected ? "Selected" : "Add to Order"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {food.catagory && <Badge variant="outline">{food.catagory}</Badge>}
                    {food.code && <Badge variant="outline">Code: {food.code}</Badge>}
                    {food.foodTags && (
                      <Badge variant="outline">Tags: {food.foodTags}</Badge>
                    )}
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p>Outlet: {getOutletTitle(food)}</p>
                    <p>{getOutletAddress(food)}</p>
                    <p>Expires: {formatDisplayDate(food.expireTime)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FoodBrowseSection;
