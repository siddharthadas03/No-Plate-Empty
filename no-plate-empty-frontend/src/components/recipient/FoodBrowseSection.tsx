import { useEffect, useState } from "react";
import { Clock3, MapPin, PackageCheck } from "lucide-react";
import { API } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DonorOutlet = {
  _id: string;
  title: string;
  pickup?: boolean;
  delivery?: boolean;
  isOpen?: boolean;
  distanceKm?: number;
  matchMode?: string;
};

type FoodRecord = {
  _id: string;
  title: string;
  decription?: string;
  foodTags?: string;
  catagory?: string;
  quantity?: number;
  unit?: string;
  isAvailable?: boolean;
  expireTime?: string;
  Doner?: DonorOutlet | string | null;
};

interface FoodBrowseSectionProps {
  onOrderPlaced?: () => void;
}

const getAuthHeaders = (token: string | null, hasBody = false) => {
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const formatQuantity = (food: FoodRecord) => {
  if (typeof food.quantity !== "number") {
    return "Quantity unavailable";
  }

  return `${food.quantity} ${food.unit?.trim() || "items"} available`;
};

const FoodBrowseSection = ({ onOrderPlaced }: FoodBrowseSectionProps) => {
  const { token } = useAuth();
  const [foods, setFoods] = useState<FoodRecord[]>([]);
  const [requestedQuantities, setRequestedQuantities] = useState<Record<string, string>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pendingFoodId, setPendingFoodId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFoods = async () => {
    if (!token) {
      setError("Sign in again to browse food.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/v1/food/nearby`, {
        headers: getAuthHeaders(token),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to load nearby foods.");
      }

      const nextFoods = Array.isArray(payload?.foods) ? payload.foods : [];
      setFoods(nextFoods);
      setRequestedQuantities((currentMap) => {
        const nextMap = { ...currentMap };
        nextFoods.forEach((food) => {
          nextMap[food._id] = nextMap[food._id] || "1";
        });
        return nextMap;
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load nearby foods."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFoods();
  }, [token]);

  const placeOrder = async (food: FoodRecord) => {
    if (!token) {
      setError("Sign in again to place an order.");
      return;
    }

    const requestedQuantity = Number(requestedQuantities[food._id] || "1");
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      setError("Enter a valid requested quantity greater than zero.");
      return;
    }

    if (typeof food.quantity === "number" && requestedQuantity > food.quantity) {
      setError(`Only ${food.quantity} ${food.unit || "items"} are available.`);
      return;
    }

    setPendingFoodId(food._id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/api/v1/food/place-order`, {
        method: "POST",
        headers: getAuthHeaders(token, true),
        body: JSON.stringify({
          cartItems: [
            {
              _id: food._id,
              requestedQuantity,
            },
          ],
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to place the order.");
      }

      setSuccess(payload?.message || "Order placed successfully.");
      setRequestedQuantities((currentMap) => ({
        ...currentMap,
        [food._id]: "1",
      }));
      await loadFoods();
      onOrderPlaced?.();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to place the order."
      );
    } finally {
      setPendingFoodId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border/60 bg-background/95 p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Nearby Available Food
            </h2>
            <p className="text-sm text-muted-foreground">
              Quantities are shown on every listing so your team can request the
              exact amount you need.
            </p>
          </div>
          <Badge variant="secondary">{foods.length} match(es)</Badge>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground xl:col-span-2">
            Loading nearby foods...
          </div>
        ) : foods.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center xl:col-span-2">
            <p className="font-medium text-foreground">No nearby food available</p>
            <p className="text-sm text-muted-foreground">
              Save your NGO location and search radius, then donor matches will show
              up here with quantities.
            </p>
          </div>
        ) : (
          foods.map((food) => {
            const outlet =
              typeof food.Doner === "object" && food.Doner ? food.Doner : null;
            const remainingQuantity =
              typeof food.quantity === "number" ? food.quantity : undefined;

            return (
              <article
                key={food._id}
                className="rounded-3xl border border-border/60 bg-background/95 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {food.title}
                      </h3>
                      <Badge variant="secondary">{formatQuantity(food)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {food.decription || "No description added yet."}
                    </p>
                  </div>

                  <Badge variant={food.isAvailable === false ? "outline" : "secondary"}>
                    {food.isAvailable === false ? "Unavailable" : "Ready to request"}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {food.catagory ? <Badge variant="outline">{food.catagory}</Badge> : null}
                  {food.foodTags ? <Badge variant="outline">{food.foodTags}</Badge> : null}
                  {outlet?.matchMode ? (
                    <Badge variant="outline">{outlet.matchMode}</Badge>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-primary" />
                    <span>{formatQuantity(food)}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary" />
                    <span>
                      {food.expireTime
                        ? `Expires ${new Date(food.expireTime).toLocaleString()}`
                        : "No expiry time shared"}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>
                      {outlet?.title || "Donor outlet"}
                      {outlet?.distanceKm !== undefined
                        ? ` • ${outlet.distanceKm.toFixed(1)} km away`
                        : ""}
                    </span>
                  </p>
                  <p>
                    Pickup {outlet?.pickup === false ? "not available" : "available"} •
                    Delivery {outlet?.delivery === false ? " not available" : " available"}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">
                      Requested quantity
                    </span>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={requestedQuantities[food._id] || "1"}
                      onChange={(event) =>
                        setRequestedQuantities((currentMap) => ({
                          ...currentMap,
                          [food._id]: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <Button
                    type="button"
                    disabled={
                      pendingFoodId === food._id ||
                      food.isAvailable === false ||
                      remainingQuantity === 0
                    }
                    onClick={() => void placeOrder(food)}
                  >
                    {pendingFoodId === food._id ? "Placing order..." : "Request Food"}
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};

export default FoodBrowseSection;
