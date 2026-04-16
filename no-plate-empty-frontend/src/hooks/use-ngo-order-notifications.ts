import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/sonner";
import { getNgoOrders, type OrderItem } from "@/lib/feature-api";

type OrderStatus = OrderItem["status"];
type OrderStatusMap = Record<string, OrderStatus>;

interface UseNgoOrderNotificationsOptions {
  enabled: boolean;
  token: string | null;
  userId?: string;
  syncSignal?: number;
  onAcceptedOrder?: () => void;
}

const POLL_INTERVAL_MS = 10000;
const STORAGE_KEY_PREFIX = "ngo_order_statuses";
const VALID_ORDER_STATUSES = new Set<OrderStatus>([
  "pending",
  "accepted",
  "rejected",
  "completed",
]);

const getStorage = () =>
  typeof window !== "undefined" ? window.localStorage : null;

const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === "string" && VALID_ORDER_STATUSES.has(value as OrderStatus);

const loadStoredStatuses = (storageKey: string): OrderStatusMap => {
  const storage = getStorage();
  const rawValue = storage?.getItem(storageKey);

  if (!rawValue) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return {};
    }

    return Object.entries(parsedValue).reduce<OrderStatusMap>(
      (statusMap, [orderId, status]) => {
        if (isOrderStatus(status)) {
          statusMap[orderId] = status;
        }

        return statusMap;
      },
      {},
    );
  } catch {
    storage?.removeItem(storageKey);
    return {};
  }
};

const saveStoredStatuses = (storageKey: string, statuses: OrderStatusMap) => {
  getStorage()?.setItem(storageKey, JSON.stringify(statuses));
};

const getDonorTitle = (order: OrderItem) => {
  if (typeof order.donorProfile === "object" && order.donorProfile?.title) {
    return order.donorProfile.title;
  }

  return "A donor";
};

const showAcceptedToast = (order: OrderItem) => {
  toast.success("Order accepted", {
    description: `${getDonorTitle(
      order,
    )} accepted your food request. Pickup details are ready in My Orders.`,
  });
};

export const useNgoOrderNotifications = ({
  enabled,
  token,
  userId,
  syncSignal,
  onAcceptedOrder,
}: UseNgoOrderNotificationsOptions) => {
  const previousStatusesRef = useRef<OrderStatusMap>({});
  const checkOrdersRef = useRef<(() => void) | null>(null);
  const onAcceptedOrderRef = useRef(onAcceptedOrder);

  useEffect(() => {
    onAcceptedOrderRef.current = onAcceptedOrder;
  }, [onAcceptedOrder]);

  useEffect(() => {
    if (!enabled || !token || !userId) {
      previousStatusesRef.current = {};
      checkOrdersRef.current = null;
      return;
    }

    let isActive = true;
    const storageKey = `${STORAGE_KEY_PREFIX}:${userId}`;
    previousStatusesRef.current = loadStoredStatuses(storageKey);

    const checkOrders = async () => {
      try {
        const response = await getNgoOrders(token);

        if (!isActive) {
          return;
        }

        const orders = Array.isArray(response.orders) ? response.orders : [];
        const previousStatuses = previousStatusesRef.current;
        const nextStatuses = orders.reduce<OrderStatusMap>((statusMap, order) => {
          statusMap[order._id] = order.status;
          return statusMap;
        }, {});
        const newlyAcceptedOrders = orders.filter((order) => {
          const previousStatus = previousStatuses[order._id];
          return (
            previousStatus &&
            previousStatus !== "accepted" &&
            order.status === "accepted"
          );
        });

        previousStatusesRef.current = nextStatuses;
        saveStoredStatuses(storageKey, nextStatuses);

        if (newlyAcceptedOrders.length > 0) {
          newlyAcceptedOrders.forEach(showAcceptedToast);
          onAcceptedOrderRef.current?.();
        }
      } catch (error) {
        console.warn("Unable to check NGO order notifications.", error);
      }
    };

    checkOrdersRef.current = () => {
      void checkOrders();
    };

    void checkOrders();

    const intervalId = window.setInterval(() => {
      void checkOrders();
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkOrders();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      checkOrdersRef.current = null;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, token, userId]);

  useEffect(() => {
    if (!enabled || !token || syncSignal === undefined) {
      return;
    }

    checkOrdersRef.current?.();
  }, [enabled, token, syncSignal]);
};
