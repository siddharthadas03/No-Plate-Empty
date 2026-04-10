import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { API } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DonorOutlet = {
  _id: string;
  title: string;
};

type FoodRecord = {
  _id: string;
  title: string;
  unit?: string;
};

type OrderItem = {
  food?: FoodRecord | string | null;
  requestedQuantity?: number;
  unit?: string;
};

type FoodOrder = {
  _id: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  items?: OrderItem[];
  foods?: FoodRecord[];
  donorProfile?: DonorOutlet | null;
  donorLocation?: {
    title?: string;
    address?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  };
  createdAt?: string;
};

interface OrderHistorySectionProps {
  refreshSignal?: number;
}

const getAuthHeaders = (token: string | null) =>
  token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

const getStatusStyles = (status: FoodOrder["status"]) => {
  switch (status) {
    case "accepted":
      return "border-green-200 bg-green-50 text-green-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "completed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
};

const getOrderItems = (order: FoodOrder) => {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((item, index) => {
      const food =
        typeof item.food === "object" && item.food ? item.food : undefined;
      return {
        key: `${food?._id || "item"}-${index}`,
        title: food?.title || "Food item",
        requestedQuantity: item.requestedQuantity ?? 1,
        unit: item.unit || food?.unit || "items",
      };
    });
  }

  if (Array.isArray(order.foods) && order.foods.length > 0) {
    return order.foods.map((food) => ({
      key: food._id,
      title: food.title,
      requestedQuantity: 1,
      unit: food.unit || "items",
    }));
  }

  return [];
};

const getMapsUrl = (location?: FoodOrder["donorLocation"]) => {
  if (!location) {
    return null;
  }

  const hasCoordinates =
    typeof location.latitude === "number" &&
    !Number.isNaN(location.latitude) &&
    typeof location.longitude === "number" &&
    !Number.isNaN(location.longitude);

  if (hasCoordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }

  const query = [
    location.title,
    location.address,
    location.city,
    location.state,
  ]
    .filter(Boolean)
    .join(", ");

  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
};

const OrderHistorySection = ({ refreshSignal = 0 }: OrderHistorySectionProps) => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    if (!token) {
      setError("Sign in again to view order history.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/v1/food/my-orders`, {
        headers: getAuthHeaders(token),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to load order history.");
      }

      setOrders(Array.isArray(payload?.orders) ? payload.orders : []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load order history."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [token, refreshSignal]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border/60 bg-background/95 p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">My Orders</h2>
            <p className="text-sm text-muted-foreground">
              Track every request along with the quantity you asked from each donor
              outlet.
            </p>
          </div>
          <Badge variant="secondary">{orders.length} order(s)</Badge>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            Loading order history...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center">
            <p className="font-medium text-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground">
              Request food from the catalog and your orders will appear here.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const orderItems = getOrderItems(order);
            const locationText =
              order.donorLocation?.address ||
              [order.donorLocation?.city, order.donorLocation?.state]
                .filter(Boolean)
                .join(", ");
            const mapsUrl =
              order.status !== "rejected" ? getMapsUrl(order.donorLocation) : null;

            return (
              <article
                key={order._id}
                className="rounded-3xl border border-border/60 bg-background/95 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {order.donorProfile?.title || "Donor outlet"}
                      </h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${getStatusStyles(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requested on{" "}
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "recently"}
                    </p>
                    {locationText ? (
                      <p className="text-sm text-muted-foreground">
                        Pickup location: {locationText}
                      </p>
                    ) : null}
                    {mapsUrl ? (
                      <Button asChild type="button" variant="outline" className="mt-2 w-fit">
                        <a href={mapsUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in Maps
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-sm font-medium text-foreground">Requested items</p>
                  <div className="mt-3 space-y-2">
                    {orderItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Quantity details are unavailable for this older order.
                      </p>
                    ) : (
                      orderItems.map((item) => (
                        <div
                          key={item.key}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/50 bg-background/70 px-4 py-3"
                        >
                          <span className="font-medium text-foreground">{item.title}</span>
                          <Badge variant="outline">
                            {item.requestedQuantity} {item.unit}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};

export default OrderHistorySection;
