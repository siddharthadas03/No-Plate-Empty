import { useEffect, useState } from "react";
import { API } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NgoUser = {
  _id: string;
  name?: string;
  email?: string;
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
  NGO?: NgoUser | null;
  items?: OrderItem[];
  foods?: FoodRecord[];
  donorProfile?: {
    _id: string;
    title?: string;
    location?: {
      address?: string;
      city?: string;
      state?: string;
    };
  } | null;
  createdAt?: string;
};

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

const IncomingOrdersSection = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOrders = async () => {
    if (!token) {
      setError("Sign in again to view incoming orders.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/v1/food/donor-orders`, {
        headers: getAuthHeaders(token),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to load incoming orders.");
      }

      setOrders(Array.isArray(payload?.orders) ? payload.orders : []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load incoming orders."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [token]);

  const updateStatus = async (
    orderId: string,
    status: "accepted" | "rejected" | "completed"
  ) => {
    if (!token) {
      setError("Sign in again to update orders.");
      return;
    }

    setPendingAction(`${orderId}:${status}`);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/api/v1/food/order-status/${orderId}`, {
        method: "PATCH",
        headers: getAuthHeaders(token, true),
        body: JSON.stringify({ status }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to update order status.");
      }

      setSuccess(payload?.message || "Order updated successfully.");
      await loadOrders();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update order status."
      );
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border/60 bg-background/95 p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Incoming Orders
            </h2>
            <p className="text-sm text-muted-foreground">
              Review the exact quantities NGOs are requesting before you accept an
              order.
            </p>
          </div>
          <Badge variant="secondary">{orders.length} order(s)</Badge>
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

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            Loading incoming orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center">
            <p className="font-medium text-foreground">No incoming orders yet</p>
            <p className="text-sm text-muted-foreground">
              NGO requests will appear here with per-item quantity details.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const orderItems = getOrderItems(order);
            const locationText =
              order.donorProfile?.location?.address ||
              [order.donorProfile?.location?.city, order.donorProfile?.location?.state]
                .filter(Boolean)
                .join(", ");

            return (
              <article
                key={order._id}
                className="rounded-3xl border border-border/60 bg-background/95 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {order.NGO?.name || "NGO request"}
                      </h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${getStatusStyles(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.NGO?.email || "No NGO email available"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.createdAt
                        ? `Requested on ${new Date(order.createdAt).toLocaleString()}`
                        : "Requested recently"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Outlet: {order.donorProfile?.title || "Donor outlet"}
                      {locationText ? ` • ${locationText}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {order.status === "pending" ? (
                      <>
                        <Button
                          type="button"
                          disabled={pendingAction === `${order._id}:accepted`}
                          onClick={() => void updateStatus(order._id, "accepted")}
                        >
                          {pendingAction === `${order._id}:accepted`
                            ? "Accepting..."
                            : "Accept"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={pendingAction === `${order._id}:rejected`}
                          onClick={() => void updateStatus(order._id, "rejected")}
                        >
                          {pendingAction === `${order._id}:rejected`
                            ? "Rejecting..."
                            : "Reject"}
                        </Button>
                      </>
                    ) : null}

                    {order.status === "accepted" ? (
                      <Button
                        type="button"
                        disabled={pendingAction === `${order._id}:completed`}
                        onClick={() => void updateStatus(order._id, "completed")}
                      >
                        {pendingAction === `${order._id}:completed`
                          ? "Completing..."
                          : "Mark Completed"}
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

export default IncomingOrdersSection;
