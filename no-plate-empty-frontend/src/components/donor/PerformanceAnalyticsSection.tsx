import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/auth";
import {
  DonorEntry,
  DonorPerformanceAnalyticsInput,
  DonorPerformanceAnalyticsResponse,
  OrderItem,
  getDonorOrders,
  getDonorPerformanceAnalytics,
  getMyDonorEntries,
} from "@/lib/feature-api";

const weekdayOptions = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

const weekdayCodeToDay = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const mealTypeOptions = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "eveningSnacks", label: "Evening Snacks" },
  { value: "dinner", label: "Dinner" },
];

const mealSlotOptions = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "eveningSnacks", label: "Evening Snacks" },
  { value: "dinner", label: "Dinner" },
] as const;

type MealSlot = (typeof mealSlotOptions)[number]["value"];
type WeekdayCode = (typeof weekdayCodeToDay)[number];
type ModelHostel = "A" | "B";

interface WeeklyMenuMeal {
  label: string;
  type: string;
  popularity: number;
  waste: number;
}

type WeeklyMenuEntry = { day: WeekdayCode } & Record<MealSlot, WeeklyMenuMeal>;
type WeeklyMenuPlan = WeeklyMenuEntry[];
type OutletMenuPlans = Record<string, WeeklyMenuPlan>;

interface OutletOption {
  value: string;
  label: string;
  modelHostel: ModelHostel;
}

const DEFAULT_OUTLET_ID = "A";
const MENU_STORAGE_PREFIX = "noPlateEmpty.weeklyOutletMenus";

const menuOptions = [
  { value: "idli_sambar", label: "Idli Sambar" },
  { value: "poha", label: "Poha" },
  { value: "rice_dal", label: "Rice Dal" },
  { value: "roti_sabji", label: "Roti Sabji" },
  { value: "veg_pulao", label: "Veg Pulao" },
];

const orderStatusColors = ["#D97706", "#2563EB", "#059669", "#DC2626"];
const orderStatusColorMap: Record<string, string> = {
  Pending: "#D97706",
  Accepted: "#2563EB",
  Completed: "#059669",
  Rejected: "#DC2626",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const defaultMenuPlans: Record<ModelHostel, WeeklyMenuPlan> = {
  A: [
    {
      day: "Mon",
      breakfast: { label: "Suji Simiya, Upama, Guguni, Bread, Butter, Jam, Coffee", type: "Veg", popularity: 78, waste: 18 },
      lunch: { label: "Rice, Roti, Moong Dal, Kathal Sabji, Beans Aloo Bhaja, Dahi Curdi, Mixed Boiled Vegetable", type: "Veg", popularity: 72, waste: 16 },
      eveningSnacks: { label: "Corn Chatt, Coffee", type: "Veg", popularity: 64, waste: 9 },
      dinner: { label: "Rice, Roti, Dal Fry, Besan Curry, Jalebi, Mixed Boiled Vegetable", type: "Veg", popularity: 70, waste: 14 },
    },
    {
      day: "Tue",
      breakfast: { label: "Uttapam, Samber, Chutney, Cornflakes, Milk, Banana, Tea", type: "Veg", popularity: 76, waste: 12 },
      lunch: { label: "Rice, Roti, Dal, Egg Curry, Drumstic Baigan Besar, Friems, Mixed Boiled Vegetable", type: "Non Veg", popularity: 83, waste: 15 },
      eveningSnacks: { label: "Biscuit, Elaichi Tea", type: "Veg", popularity: 60, waste: 8 },
      dinner: { label: "Rice, Roti, Dal, Aloo Parwal Curry, Ice-Cream, Mixed Boiled Vegetable", type: "Veg", popularity: 74, waste: 13 },
    },
    {
      day: "Wed",
      breakfast: { label: "Bread, Butter, Jam, Boiled Egg, Vegetable Chop, Cornflakes, Milk, Banana, Coffee", type: "Mixed", popularity: 80, waste: 14 },
      lunch: { label: "Rice, Roti, Dal, Sarso Fish Curry, Bhendi Sabji, Aloo Chips, Mixed Boiled Vegetable", type: "Non Veg", popularity: 90, waste: 11 },
      eveningSnacks: { label: "Watermelon, Squash", type: "Veg", popularity: 66, waste: 10 },
      dinner: { label: "Rice, Roti, Dal, Chicken Kassa, Paneer Curry, Salad, Mixed Boiled Vegetable", type: "Mixed", popularity: 88, waste: 9 },
    },
    {
      day: "Thu",
      breakfast: { label: "Plain Paratha, Aloo Curry, Meetha Achar, Bread, Butter, Jam, Tea", type: "Veg", popularity: 73, waste: 13 },
      lunch: { label: "Rice, Dal Fry, Soyabin Sabji, Bargudi Aloo Bhaja, Plain Dahi, Mixed Boiled Vegetable", type: "Veg", popularity: 68, waste: 17 },
      eveningSnacks: { label: "Bread Pakoda, Coffee", type: "Veg", popularity: 72, waste: 11 },
      dinner: { label: "Rice, Dal, Buta Aloo Kakharu Curry, Puri, Rasgolla, Mixed Boiled Vegetable", type: "Veg", popularity: 77, waste: 14 },
    },
    {
      day: "Fri",
      breakfast: { label: "Bread, Butter, Jam, Egg Omlette, Veg Cutlet, Cornflakes, Milk Banana, Coffee", type: "Mixed", popularity: 84, waste: 12 },
      lunch: { label: "Rice, Roti, Dal, Fish Fry, Jhinga Sabji, Finger Chips, Mixed Boiled Vegetable", type: "Non Veg", popularity: 87, waste: 10 },
      eveningSnacks: { label: "Jhal Mudhi, Tea", type: "Veg", popularity: 75, waste: 9 },
      dinner: { label: "Veg Biriyani, Non Veg Biriyani, Raita, Tamato Aloo Curry, Mixed Boiled Vegetable", type: "Mixed", popularity: 98, waste: 8 },
    },
    {
      day: "Sat",
      breakfast: { label: "Bara, Guguni, Khata Meetha Chutney, Bread, Butter, Jam, Tea", type: "Veg", popularity: 79, waste: 11 },
      lunch: { label: "Rice, Dal, Khichdi, Aloo Chokha, Tamato Khata (Khajur), Papad, Mixed Boiled Vegetable", type: "Veg", popularity: 69, waste: 18 },
      eveningSnacks: { label: "Sprouts, Coffee", type: "Veg", popularity: 63, waste: 12 },
      dinner: { label: "Rice, Roti, Dal, Chicken Aloo Curry, Chilli Soyabin, Gulab Jamun, Mixed Boiled Vegetable", type: "Mixed", popularity: 86, waste: 10 },
    },
    {
      day: "Sun",
      breakfast: { label: "Masala Dosa, Sambar, Chutney, Bread, Butter, Jam, Coffee", type: "Veg", popularity: 82, waste: 10 },
      lunch: { label: "Rice, Roti, Dal, Kadhai Chicken, Paneer Pasanda, Boondi Raita, Mixed Boiled Vegetable", type: "Mixed", popularity: 91, waste: 9 },
      eveningSnacks: { label: "Veg Roll, Tea", type: "Veg", popularity: 76, waste: 8 },
      dinner: { label: "Rice, Roti, Dal, Green Matar, Aloo Tamato Kassa, Masala Egg, Salad, Mixed Boiled Vegetable", type: "Mixed", popularity: 85, waste: 11 },
    },
  ],
  B: [
    {
      day: "Mon",
      breakfast: { label: "Idli, Samber, Chutney, Bread, Butter, Jam, Coffee", type: "Veg", popularity: 81, waste: 12 },
      lunch: { label: "Rice, Roti, Dalma, Papad, Aloo Chokha, Tamato Khata (Khajur), Mixed Boiled Vegetable", type: "Veg", popularity: 74, waste: 15 },
      eveningSnacks: { label: "Aloo Sandwitch, Tea", type: "Veg", popularity: 68, waste: 10 },
      dinner: { label: "Rice, Roti, Dal Fry, Gobhi Curry, Rice Kheer, Mixed Boiled Vegetable", type: "Veg", popularity: 76, waste: 13 },
    },
    {
      day: "Tue",
      breakfast: { label: "Besan Chilla, Cornflakes, Milk, Banana, Tea", type: "Veg", popularity: 73, waste: 11 },
      lunch: { label: "Rice, Roti, Mong Dal, Egg Curry, Cabbage Matar Kasha, Plain Dahi, Mixed Boiled Vegetable", type: "Non Veg", popularity: 82, waste: 14 },
      eveningSnacks: { label: "Sprouts, Coffee", type: "Veg", popularity: 64, waste: 8 },
      dinner: { label: "Rice, Roti, Dal, Malai Kofta, Mix Bhaja, Ice-Cream, Mixed Boiled Vegetable", type: "Veg", popularity: 79, waste: 12 },
    },
    {
      day: "Wed",
      breakfast: { label: "Bread, Butter, Jam, Boiled Egg, Aloo Tikki, Cornflakes, Milk, Banana, Coffee", type: "Mixed", popularity: 78, waste: 13 },
      lunch: { label: "Rice, Roti, Dal, Sarso Fish Curry, Meethi Aloo Sabji, Dahi Curdi, Mixed Boiled Vegetable", type: "Non Veg", popularity: 89, waste: 10 },
      eveningSnacks: { label: "Biscuit, Tea", type: "Veg", popularity: 58, waste: 9 },
      dinner: { label: "Rice, Roti, Dal, Chicken Kassa, Palak Paneer, Salad, Mixed Boiled Vegetable", type: "Mixed", popularity: 91, waste: 9 },
    },
    {
      day: "Thu",
      breakfast: { label: "Plain Paratha, Aloo Curry, Meetha Achar, Bread, Butter, Jam, Tea", type: "Veg", popularity: 72, waste: 12 },
      lunch: { label: "Rice, Dal Fry, Mix Veg with Paneer, Tamato Aloo Chokha, Dahi Baigan, Mixed Boiled Vegetable", type: "Veg", popularity: 71, waste: 16 },
      eveningSnacks: { label: "Bread Pakoda, Coffee", type: "Veg", popularity: 75, waste: 10 },
      dinner: { label: "Rice, Roti, Veg Tadka, Gobhi Aloo Bhaja, Meetha Boondi, Mixed Boiled Vegetable", type: "Veg", popularity: 73, waste: 15 },
    },
    {
      day: "Fri",
      breakfast: { label: "Bread, Butter, Jam, Egg Omlette, Veg Cutlet, Cornflakes, Milk Banana, Coffee", type: "Mixed", popularity: 83, waste: 11 },
      lunch: { label: "Rice, Roti, Dal, Fish Fry, Kela Kofta, Aloo Fries, Mixed Boiled Vegetable", type: "Non Veg", popularity: 86, waste: 10 },
      eveningSnacks: { label: "Jhal Mudhi, Red Tea", type: "Veg", popularity: 73, waste: 9 },
      dinner: { label: "Veg Biriyani, Non Veg Biriyani, Raita, Tamato Aloo Curry, Mixed Boiled Vegetable", type: "Mixed", popularity: 97, waste: 8 },
    },
    {
      day: "Sat",
      breakfast: { label: "Bara, Guguni, Khata Meetha Chutney, Bread, Butter, Jam, Tea", type: "Veg", popularity: 77, waste: 10 },
      lunch: { label: "Rice, Roti, Dal, Chicken Manchuriyan, Phool Gobhi Manchurian, Aloo Bins Bhaja, Mixed Boiled Vegetable", type: "Mixed", popularity: 88, waste: 11 },
      eveningSnacks: { label: "Papdi Chatt, Coffee", type: "Veg", popularity: 70, waste: 11 },
      dinner: { label: "Rice, Roti, Dal, Matar Paneer, Keema Mix Bhaja, Gulabjamun, Mixed Boiled Vegetable", type: "Mixed", popularity: 84, waste: 10 },
    },
    {
      day: "Sun",
      breakfast: { label: "Masala Dosa, Sambar, Chutney, Bread, Butter, Jam, Coffee", type: "Veg", popularity: 81, waste: 9 },
      lunch: { label: "Rice, Roti, Dal, Kadhai Chicken, Kadhai Paneer, Boondi Raita, Mixed Boiled Vegetable", type: "Mixed", popularity: 92, waste: 8 },
      eveningSnacks: { label: "Veg Roll, Tea", type: "Veg", popularity: 74, waste: 7 },
      dinner: { label: "Rice, Roti, Dal, Chholle Sabji, Masala Egg, Friems, Mixed Boiled Vegetable", type: "Mixed", popularity: 82, waste: 11 },
    },
  ],
};

const cloneWeeklyMenuMeal = (meal: WeeklyMenuMeal): WeeklyMenuMeal => ({
  label: meal.label,
  type: meal.type,
  popularity: meal.popularity,
  waste: meal.waste,
});

const cloneWeeklyMenuPlan = (plan: WeeklyMenuPlan): WeeklyMenuPlan =>
  plan.map((entry) => ({
    day: entry.day,
    breakfast: cloneWeeklyMenuMeal(entry.breakfast),
    lunch: cloneWeeklyMenuMeal(entry.lunch),
    eveningSnacks: cloneWeeklyMenuMeal(entry.eveningSnacks),
    dinner: cloneWeeklyMenuMeal(entry.dinner),
  }));

const getDefaultWeeklyMenuPlan = (outletIndex = 0) =>
  cloneWeeklyMenuPlan(defaultMenuPlans[outletIndex % 2 === 0 ? "A" : "B"]);

const inferMenuType = (label: string, fallback = "Veg") => {
  const normalized = label.toLowerCase();

  if (!normalized.trim()) {
    return fallback;
  }

  const hasNonVeg = ["chicken", "fish", "egg", "mutton", "meat", "keema", "prawn"].some(
    (term) => normalized.includes(term),
  );
  const hasVegCue = ["paneer", "veg", "sabji", "dal", "chholle", "soya", "matar"].some(
    (term) => normalized.includes(term),
  );

  if (hasNonVeg && hasVegCue) {
    return "Mixed";
  }

  return hasNonVeg ? "Non Veg" : "Veg";
};

const sanitizeWeeklyMenuMeal = (
  value: unknown,
  fallback: WeeklyMenuMeal,
): WeeklyMenuMeal => {
  const source =
    value !== null && typeof value === "object" ? (value as Partial<WeeklyMenuMeal>) : {};
  const label =
    typeof source.label === "string" && source.label.trim()
      ? source.label
      : fallback.label;
  const popularity = Number(source.popularity);
  const waste = Number(source.waste);

  return {
    label,
    type:
      typeof source.type === "string" && source.type.trim()
        ? source.type
        : inferMenuType(label, fallback.type),
    popularity: Number.isFinite(popularity)
      ? clamp(Math.round(popularity), 0, 100)
      : fallback.popularity,
    waste: Number.isFinite(waste) ? clamp(Math.round(waste), 0, 100) : fallback.waste,
  };
};

const sanitizeWeeklyMenuPlan = (
  value: unknown,
  fallback: WeeklyMenuPlan,
): WeeklyMenuPlan =>
  weekdayCodeToDay.map((dayCode, index) => {
    const sourcePlan = Array.isArray(value) ? value : [];
    const sourceEntry = sourcePlan.find((entry) => entry?.day === dayCode);
    const fallbackEntry = fallback[index] ?? getDefaultWeeklyMenuPlan(0)[index];

    return {
      day: dayCode,
      breakfast: sanitizeWeeklyMenuMeal(sourceEntry?.breakfast, fallbackEntry.breakfast),
      lunch: sanitizeWeeklyMenuMeal(sourceEntry?.lunch, fallbackEntry.lunch),
      eveningSnacks: sanitizeWeeklyMenuMeal(
        sourceEntry?.eveningSnacks,
        fallbackEntry.eveningSnacks,
      ),
      dinner: sanitizeWeeklyMenuMeal(sourceEntry?.dinner, fallbackEntry.dinner),
    };
  });

const getWeeklyMenuPlanForOutlet = (
  outletMenuPlans: OutletMenuPlans,
  outletId: string,
  outletIndex = 0,
) => outletMenuPlans[outletId] ?? getDefaultWeeklyMenuPlan(outletIndex);

const getMenuStorageKey = (userId?: string) =>
  `${MENU_STORAGE_PREFIX}.${userId || "anonymous"}`;

const readStoredOutletMenuPlans = (userId?: string): OutletMenuPlans => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(getMenuStorageKey(userId));

    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.entries(parsed as Record<string, unknown>).reduce<OutletMenuPlans>(
      (plans, [outletId, plan], index) => {
        if (outletId.trim()) {
          plans[outletId] = sanitizeWeeklyMenuPlan(plan, getDefaultWeeklyMenuPlan(index));
        }

        return plans;
      },
      {},
    );
  } catch {
    return {};
  }
};

const saveStoredOutletMenuPlans = (userId: string | undefined, plans: OutletMenuPlans) => {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  try {
    window.localStorage.setItem(getMenuStorageKey(userId), JSON.stringify(plans));
  } catch {
    // Local storage is optional for this editor; the live state still works.
  }
};

const ensureOutletMenuPlans = (
  currentPlans: OutletMenuPlans,
  outlets: DonorEntry[],
): OutletMenuPlans => {
  const nextPlans = { ...currentPlans };

  if (outlets.length === 0) {
    nextPlans[DEFAULT_OUTLET_ID] =
      nextPlans[DEFAULT_OUTLET_ID] ?? getDefaultWeeklyMenuPlan(0);
    return nextPlans;
  }

  outlets.forEach((outlet, index) => {
    if (!outlet._id) {
      return;
    }

    nextPlans[outlet._id] = sanitizeWeeklyMenuPlan(
      nextPlans[outlet._id],
      getDefaultWeeklyMenuPlan(index),
    );
  });

  return nextPlans;
};

const shiftHexColor = (hex: string, amount: number) => {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const clamp = (channel: number) => Math.max(0, Math.min(255, channel));
  const red = clamp((value >> 16) + amount);
  const green = clamp(((value >> 8) & 0xff) + amount);
  const blue = clamp((value & 0xff) + amount);

  return `rgb(${red}, ${green}, ${blue})`;
};

type DateInputWithPicker = HTMLInputElement & {
  showPicker?: () => void;
};

const ThreeDBarShape = (props: {
  fill?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) => {
  const { fill = "#2563EB", x = 0, y = 0, width = 0, height = 0 } = props;
  const depth = 10;
  const safeHeight = Math.max(height, 0);
  const topY = y;
  const bottomY = y + safeHeight;
  const rightX = x + width;
  const frontFill = shiftHexColor(fill, -4);
  const topFill = shiftHexColor(fill, 42);
  const sideFill = shiftHexColor(fill, -46);

  return (
    <g>
      <rect
        x={x + depth - 1}
        y={y + 5}
        width={width}
        height={safeHeight}
        rx={10}
        ry={10}
        fill="rgba(15,23,42,0.12)"
      />
      <rect x={x} y={y} width={width} height={safeHeight} rx={10} ry={10} fill={frontFill} />
      <polygon
        points={`${x},${topY} ${x + depth},${topY - depth} ${rightX + depth},${topY - depth} ${rightX},${topY}`}
        fill={topFill}
      />
      <polygon
        points={`${rightX},${topY} ${rightX + depth},${topY - depth} ${rightX + depth},${bottomY - depth} ${rightX},${bottomY}`}
        fill={sideFill}
      />
    </g>
  );
};

const getDefaultAnalyticsInput = (): DonorPerformanceAnalyticsInput => {
  const now = new Date();
  const jsDay = now.getDay();

  return {
    day: now.getDate(),
    weekday: jsDay === 0 ? 6 : jsDay - 1,
    meal_type: "lunch",
    menu: "idli_sambar",
    hostel: DEFAULT_OUTLET_ID,
  };
};

const getDefaultPlannerDate = () => new Date().toISOString().slice(0, 10);

const getStatusCount = (orders: OrderItem[], status: OrderItem["status"]) =>
  orders.filter((order) => order.status === status).length;

const formatPercent = (value: number) => `${Math.round(value)}%`;

const getRiskMeta = (risk?: string) => {
  switch (risk) {
    case "High":
      return {
        badgeVariant: "destructive" as const,
        toneClass:
          "border-red-200/80 bg-[linear-gradient(135deg,rgba(254,242,242,0.95),rgba(254,226,226,0.7))] text-red-700",
        summary:
          "Surplus is likely if cooking stays aggressive. Tighten batch sizing and release food in smaller waves.",
      };
    case "Medium":
      return {
        badgeVariant: "secondary" as const,
        toneClass:
          "border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(254,243,199,0.7))] text-amber-700",
        summary:
          "Forecast is balanced but sensitive. Keep a moderate buffer and monitor confirmations before final prep.",
      };
    default:
      return {
        badgeVariant: "outline" as const,
        toneClass:
          "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(209,250,229,0.7))] text-emerald-700",
        summary:
          "Current conditions look efficient. The model expects low waste risk with the recommended cooking target.",
      };
  }
};

const getModelMenuFromSchedule = (
  mealType: DonorPerformanceAnalyticsInput["meal_type"],
  mealLabel?: string,
): DonorPerformanceAnalyticsInput["menu"] => {
  if (!mealLabel) {
    return mealType === "breakfast" ? "idli_sambar" : "rice_dal";
  }

  const normalizedLabel = mealLabel.toLowerCase();

  if (mealType === "breakfast") {
    if (
      normalizedLabel.includes("idli") ||
      normalizedLabel.includes("uttapam") ||
      normalizedLabel.includes("dosa") ||
      normalizedLabel.includes("sambar") ||
      normalizedLabel.includes("samber") ||
      normalizedLabel.includes("chilla")
    ) {
      return "idli_sambar";
    }

    return "poha";
  }

  if (
    normalizedLabel.includes("biriyani") ||
    normalizedLabel.includes("pulao") ||
    normalizedLabel.includes("khichdi")
  ) {
    return "veg_pulao";
  }

  if (
    normalizedLabel.includes("roti") ||
    normalizedLabel.includes("sabji") ||
    normalizedLabel.includes("curry") ||
    normalizedLabel.includes("paneer") ||
    normalizedLabel.includes("chicken") ||
    normalizedLabel.includes("fish")
  ) {
    return "roti_sabji";
  }

  return "rice_dal";
};

const getModelMealType = (
  mealType: DonorPerformanceAnalyticsInput["meal_type"],
): "breakfast" | "lunch" | "dinner" => {
  if (mealType === "breakfast" || mealType === "dinner") {
    return mealType;
  }

  // The current ML model does not include a separate evening-snacks class yet,
  // so we align it to the mid-day service bucket for prediction.
  return "lunch";
};

const getForecastInputFromPlanner = (
  plannerDate: string,
  outletId: DonorPerformanceAnalyticsInput["hostel"],
  mealType: DonorPerformanceAnalyticsInput["meal_type"],
  outletMenuPlans: OutletMenuPlans = {},
  outletIndex = 0,
): DonorPerformanceAnalyticsInput => {
  const selected = new Date(plannerDate);
  const fallback = getDefaultAnalyticsInput();
  const safeOutletId = String(outletId || DEFAULT_OUTLET_ID);

  if (Number.isNaN(selected.getTime())) {
    return {
      ...fallback,
      hostel: safeOutletId,
      meal_type: mealType,
    };
  }

  const jsDay = selected.getDay();
  const weekday = jsDay === 0 ? 6 : jsDay - 1;
  const day = selected.getDate();
  const dayCode = weekdayCodeToDay[weekday] ?? "Mon";
  const safeMealType =
    mealType === "breakfast" ||
    mealType === "lunch" ||
    mealType === "eveningSnacks" ||
    mealType === "dinner"
      ? mealType
      : "lunch";
  const matchedMenu = getWeeklyMenuPlanForOutlet(
    outletMenuPlans,
    safeOutletId,
    outletIndex,
  ).find((entry) => entry.day === dayCode);
  const matchedMeal = matchedMenu?.[safeMealType];

  return {
    day,
    weekday,
    hostel: safeOutletId,
    meal_type: safeMealType,
    menu: getModelMenuFromSchedule(safeMealType, matchedMeal?.label),
  };
};

const PerformanceAnalyticsSection = () => {
  const { token, user } = useAuth();
  const plannerDateInputRef = useRef<HTMLInputElement | null>(null);
  const hasLoadedInitialForecastRef = useRef(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [outlets, setOutlets] = useState<DonorEntry[]>([]);
  const [outletMenuPlans, setOutletMenuPlans] = useState<OutletMenuPlans>(() => ({
    [DEFAULT_OUTLET_ID]: getDefaultWeeklyMenuPlan(0),
  }));
  const [selectedOutletId, setSelectedOutletId] = useState(DEFAULT_OUTLET_ID);
  const [menuStorageOwnerId, setMenuStorageOwnerId] = useState<string | null>(null);
  const [menuInsightMeal, setMenuInsightMeal] = useState<
    "breakfast" | "lunch" | "eveningSnacks" | "dinner"
  >("lunch");
  const [plannerDate, setPlannerDate] = useState(getDefaultPlannerDate);
  const [forecastInput, setForecastInput] = useState<DonorPerformanceAnalyticsInput>(
    getDefaultAnalyticsInput,
  );
  const [forecast, setForecast] = useState<DonorPerformanceAnalyticsResponse | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(true);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [isForecasting, setIsForecasting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const outletOptions = useMemo<OutletOption[]>(() => {
    if (outlets.length === 0) {
      return [{ value: DEFAULT_OUTLET_ID, label: "Sample Outlet", modelHostel: "A" }];
    }

    return outlets.map((outlet, index) => ({
      value: outlet._id,
      label: outlet.title?.trim() || `Outlet ${index + 1}`,
      modelHostel: index % 2 === 0 ? "A" : "B",
    }));
  }, [outlets]);

  const outletOptionIds = useMemo(
    () => outletOptions.map((option) => option.value).join("|"),
    [outletOptions],
  );

  const getOutletIndex = useCallback(
    (outletId: string) => {
      const index = outletOptions.findIndex((option) => option.value === outletId);
      return index >= 0 ? index : 0;
    },
    [outletOptions],
  );

  const getOutletLabel = useCallback(
    (outletId: string) =>
      outletOptions.find((option) => option.value === outletId)?.label || "Selected outlet",
    [outletOptions],
  );

  const getModelHostelForOutlet = useCallback(
    (outletId: string): ModelHostel =>
      outletOptions.find((option) => option.value === outletId)?.modelHostel ||
      (outletId === "B" ? "B" : "A"),
    [outletOptions],
  );

  const loadOrders = useCallback(async (refresh = false) => {
    if (!token) {
      setOrders([]);
      setIsLoadingOrders(false);
      return;
    }

    if (refresh) {
      setIsRefreshingOrders(true);
    } else {
      setIsLoadingOrders(true);
    }

    try {
      const response = await getDonorOrders(token);
      setOrders(response.orders || []);
      if (refresh) {
        setMessage({ type: "success", text: "Performance data refreshed." });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to load donor performance data."),
      });
    } finally {
      setIsLoadingOrders(false);
      setIsRefreshingOrders(false);
    }
  }, [token]);

  const loadOutlets = useCallback(async () => {
    if (!token) {
      setOutlets([]);
      setIsLoadingOutlets(false);
      return;
    }

    setIsLoadingOutlets(true);

    try {
      const response = await getMyDonorEntries(token);
      setOutlets(response.Doners || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to load your outlets for analytics."),
      });
    } finally {
      setIsLoadingOutlets(false);
    }
  }, [token]);

  const loadForecast = useCallback(async (input: DonorPerformanceAnalyticsInput) => {
    setIsForecasting(true);

    try {
      const modelMealType = getModelMealType(input.meal_type);
      const displayOutletId = String(input.hostel || DEFAULT_OUTLET_ID);
      const safeInput = {
        ...input,
        hostel: getModelHostelForOutlet(displayOutletId),
        meal_type: modelMealType,
        menu: menuOptions.some((option) => option.value === input.menu)
          ? input.menu
          : getModelMenuFromSchedule(input.meal_type, String(input.menu)),
      };
      const response = await getDonorPerformanceAnalytics(safeInput);
      setForecast(response);
      setForecastInput((current) => ({
        ...current,
        day: input.day,
        weekday: input.weekday,
        hostel: displayOutletId,
        meal_type: input.meal_type,
        menu: safeInput.menu,
      }));
      setMessage({ type: "success", text: "ML forecast updated." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to generate the ML forecast."),
      });
    } finally {
      setIsForecasting(false);
    }
  }, [getModelHostelForOutlet]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadOrders();
  }, [loadOrders, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadOutlets();
  }, [loadOutlets, token]);

  useEffect(() => {
    const storedPlans = readStoredOutletMenuPlans(user?._id);
    setOutletMenuPlans(
      Object.keys(storedPlans).length > 0
        ? storedPlans
        : { [DEFAULT_OUTLET_ID]: getDefaultWeeklyMenuPlan(0) },
    );
    setMenuStorageOwnerId(user?._id ?? null);
  }, [user?._id]);

  useEffect(() => {
    setOutletMenuPlans((current) => ensureOutletMenuPlans(current, outlets));
  }, [outlets, user?._id]);

  useEffect(() => {
    if (!user?._id || menuStorageOwnerId !== user._id) {
      return;
    }

    saveStoredOutletMenuPlans(user._id, outletMenuPlans);
  }, [menuStorageOwnerId, outletMenuPlans, user?._id]);

  useEffect(() => {
    if (hasLoadedInitialForecastRef.current) {
      return;
    }

    hasLoadedInitialForecastRef.current = true;
    const defaultOutletId = outletOptions[0]?.value ?? DEFAULT_OUTLET_ID;
    const initialInput = getForecastInputFromPlanner(
      getDefaultPlannerDate(),
      defaultOutletId,
      getDefaultAnalyticsInput().meal_type,
      outletMenuPlans,
      getOutletIndex(defaultOutletId),
    );
    void loadForecast(initialInput);
  }, [getOutletIndex, loadForecast, outletMenuPlans, outletOptions]);

  useEffect(() => {
    const defaultOutletId = outletOptions[0]?.value ?? DEFAULT_OUTLET_ID;
    const currentOutletId = String(forecastInput.hostel || DEFAULT_OUTLET_ID);
    const isForecastOutletAvailable = outletOptions.some(
      (option) => option.value === currentOutletId,
    );
    const isSelectedOutletAvailable = outletOptions.some(
      (option) => option.value === selectedOutletId,
    );

    if (!isSelectedOutletAvailable) {
      setSelectedOutletId(defaultOutletId);
    }

    if (isForecastOutletAvailable) {
      return;
    }

    const nextInput = getForecastInputFromPlanner(
      plannerDate,
      defaultOutletId,
      forecastInput.meal_type,
      outletMenuPlans,
      getOutletIndex(defaultOutletId),
    );

    setForecastInput(nextInput);

    if (outlets.length > 0) {
      void loadForecast(nextInput);
    }
  }, [outletOptionIds]);

  useEffect(() => {
    if (message?.type !== "success") {
      return;
    }

    const timer = window.setTimeout(() => {
      setMessage((current) => (current?.type === "success" ? null : current));
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [message]);

  const completedCount = useMemo(() => getStatusCount(orders, "completed"), [orders]);
  const acceptedCount = useMemo(() => getStatusCount(orders, "accepted"), [orders]);
  const pendingCount = useMemo(() => getStatusCount(orders, "pending"), [orders]);
  const rejectedCount = useMemo(() => getStatusCount(orders, "rejected"), [orders]);

  const acceptanceRate = useMemo(() => {
    if (orders.length === 0) {
      return 0;
    }

    return ((acceptedCount + completedCount) / orders.length) * 100;
  }, [acceptedCount, completedCount, orders.length]);

  const completionRate = useMemo(() => {
    if (orders.length === 0) {
      return 0;
    }

    return (completedCount / orders.length) * 100;
  }, [completedCount, orders.length]);

  const orderStatusData = useMemo(
    () => [
      { name: "Pending", value: pendingCount },
      { name: "Accepted", value: acceptedCount },
      { name: "Completed", value: completedCount },
      { name: "Rejected", value: rejectedCount },
    ],
    [acceptedCount, completedCount, pendingCount, rejectedCount],
  );

  const visibleOrderStatusData = useMemo(() => {
    if (orders.length === 0) {
      return orderStatusData;
    }

    return orderStatusData.filter((entry) => entry.value > 0);
  }, [orderStatusData, orders.length]);

  const projectedGap =
    forecast === null ? 0 : forecast.recommended_cooking - forecast.predicted_demand;

  const forecastVolumeData = useMemo(() => {
    if (!forecast) {
      return [];
    }

    return [
      { label: "Predicted Demand", value: forecast.predicted_demand, fill: "#2563EB" },
      { label: "Cook Target", value: forecast.recommended_cooking, fill: "#0F766E" },
      { label: "Safety Buffer", value: projectedGap, fill: "#F97316" },
    ];
  }, [forecast, projectedGap]);

  const riskMeta = getRiskMeta(forecast?.surplus_risk);

  const forecastNarrative = useMemo(() => {
    if (!forecast) {
      return [];
    }

    const demandLine =
      forecast.predicted_demand >= 120
        ? "Demand is trending strong for this service window, so prep flow should start early."
        : "Demand is moderate, so you have room to stage cooking in smaller batches.";

    const bufferLine =
      projectedGap >= 15
        ? `The model suggests a wider ${projectedGap}-portion cushion, which is useful if pickup confirmations are uncertain.`
        : `The model suggests a lean ${projectedGap}-portion buffer, which supports lower waste if attendance stays stable.`;

    const actionLine =
      forecast.surplus_risk === "High"
        ? "Action: reduce overproduction by holding part of the menu for a second prep decision."
        : forecast.surplus_risk === "Medium"
          ? "Action: keep ingredients ready, but delay the final batch until order acceptance improves."
          : "Action: stay close to the recommended cook target and prioritize timely handoff.";

    return [demandLine, bufferLine, actionLine];
  }, [forecast, projectedGap]);

  const currentWeeklyMenuPlan = useMemo(
    () =>
      getWeeklyMenuPlanForOutlet(
        outletMenuPlans,
        selectedOutletId,
        getOutletIndex(selectedOutletId),
      ),
    [getOutletIndex, outletMenuPlans, selectedOutletId],
  );

  const selectedOutletLabel = useMemo(
    () => getOutletLabel(selectedOutletId),
    [getOutletLabel, selectedOutletId],
  );

  const plannerOutletId = useMemo(
    () => String(forecastInput.hostel || DEFAULT_OUTLET_ID),
    [forecastInput.hostel],
  );

  const plannerOutletLabel = useMemo(
    () => getOutletLabel(plannerOutletId),
    [getOutletLabel, plannerOutletId],
  );

  const plannerWeeklyMenuPlan = useMemo(
    () =>
      getWeeklyMenuPlanForOutlet(
        outletMenuPlans,
        plannerOutletId,
        getOutletIndex(plannerOutletId),
      ),
    [getOutletIndex, outletMenuPlans, plannerOutletId],
  );

  const plannerMealSlot = useMemo(
    () => (forecastInput.meal_type === "breakfast" || forecastInput.meal_type === "lunch" || forecastInput.meal_type === "eveningSnacks" || forecastInput.meal_type === "dinner"
      ? forecastInput.meal_type
      : "lunch"),
    [forecastInput.meal_type],
  );

  const plannerDayCode = useMemo(
    () => weekdayCodeToDay[forecastInput.weekday] ?? "Mon",
    [forecastInput.weekday],
  );

  const plannerDayMenu = useMemo(
    () => plannerWeeklyMenuPlan.find((entry) => entry.day === plannerDayCode),
    [plannerWeeklyMenuPlan, plannerDayCode],
  );

  const matchedPlannerMenuLabel = useMemo(
    () => plannerDayMenu?.[plannerMealSlot].label ?? null,
    [plannerDayMenu, plannerMealSlot],
  );

  useEffect(() => {
    setForecastInput((current) =>
      getForecastInputFromPlanner(
        plannerDate,
        current.hostel,
        current.meal_type,
        outletMenuPlans,
        getOutletIndex(String(current.hostel || DEFAULT_OUTLET_ID)),
      ),
    );
  }, [getOutletIndex, outletMenuPlans, plannerDate]);

  const updateOutletMenuLabel = useCallback(
    (outletId: string, dayCode: WeekdayCode, mealSlot: MealSlot, label: string) => {
      setOutletMenuPlans((current) => {
        const outletIndex = getOutletIndex(outletId);
        const currentPlan = getWeeklyMenuPlanForOutlet(current, outletId, outletIndex);

        return {
          ...current,
          [outletId]: currentPlan.map((entry) => {
            if (entry.day !== dayCode) {
              return entry;
            }

            const currentMeal = entry[mealSlot];

            return {
              ...entry,
              [mealSlot]: {
                ...currentMeal,
                label,
                type: inferMenuType(label, currentMeal.type),
              },
            };
          }),
        };
      });
    },
    [getOutletIndex],
  );

  const resetSelectedOutletMenu = useCallback(() => {
    setOutletMenuPlans((current) => ({
      ...current,
      [selectedOutletId]: getDefaultWeeklyMenuPlan(getOutletIndex(selectedOutletId)),
    }));
  }, [getOutletIndex, selectedOutletId]);

  const applySelectedOutletToForecast = useCallback(() => {
    setForecastInput((current) =>
      getForecastInputFromPlanner(
        plannerDate,
        selectedOutletId,
        current.meal_type,
        outletMenuPlans,
        getOutletIndex(selectedOutletId),
      ),
    );
  }, [getOutletIndex, outletMenuPlans, plannerDate, selectedOutletId]);

  const weeklyMealRankingData = useMemo(
    () =>
      currentWeeklyMenuPlan
        .map((entry) => {
          const meal = entry[menuInsightMeal];
          return {
            day: entry.day,
            menu: meal.label,
            type: meal.type,
            popularity: meal.popularity,
            waste: meal.waste,
          };
        })
        .sort((left, right) => right.popularity - left.popularity),
    [currentWeeklyMenuPlan, menuInsightMeal],
  );

  const mostEatenMeal = weeklyMealRankingData[0];
  const leastEatenMeal = weeklyMealRankingData[weeklyMealRankingData.length - 1];
  const wasteRankingData = useMemo(
    () => [...weeklyMealRankingData].sort((left, right) => right.waste - left.waste),
    [weeklyMealRankingData],
  );
  const mostWasteMeal = wasteRankingData[0];
  const leastWasteMeal = wasteRankingData[wasteRankingData.length - 1];
  const weeklyTrendData = useMemo(
    () =>
      currentWeeklyMenuPlan.map((entry) => {
        const meal = entry[menuInsightMeal];
        return {
          day: entry.day,
          menu: meal.label,
          type: meal.type,
          consume: meal.popularity,
          waste: meal.waste,
        };
      }),
    [currentWeeklyMenuPlan, menuInsightMeal],
  );

  const plannerMenuSignal = plannerDayMenu?.[plannerMealSlot];

  const projectedOrderPlaced = useMemo(() => {
    if (!forecast) {
      return orders.length;
    }

    return forecast.predicted_demand;
  }, [forecast, orders.length]);

  const projectedAcceptanceRate = useMemo(() => {
    if (!forecast) {
      return acceptanceRate;
    }

    const popularityBoost = plannerMenuSignal ? (plannerMenuSignal.popularity - 75) * 0.35 : 0;
    const wastePenalty = plannerMenuSignal ? plannerMenuSignal.waste * 0.45 : 0;
    const riskPenalty =
      forecast.surplus_risk === "High" ? 10 : forecast.surplus_risk === "Medium" ? 5 : 1;
    const gapEffect = projectedGap < 0 ? -8 : Math.min(projectedGap, 18) * 0.2;

    return clamp(acceptanceRate + popularityBoost - wastePenalty - riskPenalty + gapEffect, 32, 96);
  }, [acceptanceRate, forecast, plannerMenuSignal, projectedGap]);

  const projectedCompletionRate = useMemo(() => {
    if (!forecast) {
      return completionRate;
    }

    const popularityBoost = plannerMenuSignal ? (plannerMenuSignal.popularity - 72) * 0.28 : 0;
    const wastePenalty = plannerMenuSignal ? plannerMenuSignal.waste * 0.3 : 0;
    const riskPenalty =
      forecast.surplus_risk === "High" ? 8 : forecast.surplus_risk === "Medium" ? 4 : 1;
    const completionBase = completionRate + popularityBoost - wastePenalty - riskPenalty;

    return clamp(Math.min(completionBase, projectedAcceptanceRate - 4), 20, 92);
  }, [completionRate, forecast, plannerMenuSignal, projectedAcceptanceRate]);

  const projectedAcceptedOrders = useMemo(
    () => Math.round(projectedOrderPlaced * (projectedAcceptanceRate / 100)),
    [projectedAcceptanceRate, projectedOrderPlaced],
  );

  const projectedCompletedOrders = useMemo(
    () => Math.round(projectedOrderPlaced * (projectedCompletionRate / 100)),
    [projectedCompletionRate, projectedOrderPlaced],
  );

  const projectedOrderFlowData = useMemo(
    () => [
      { name: "Placed", value: projectedOrderPlaced, fill: "#166534" },
      { name: "Accepted", value: projectedAcceptedOrders, fill: "#15803D" },
      { name: "Completed", value: projectedCompletedOrders, fill: "#22C55E" },
    ],
    [projectedAcceptedOrders, projectedCompletedOrders, projectedOrderPlaced],
  );

  if (!token) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/60 bg-background/95 shadow-xl">
        <CardContent className="p-0">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-between border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_36%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] px-6 py-7 text-white xl:border-b-0 xl:border-r">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  ML-assisted donor intelligence
                </Badge>
                <Badge className="border-white/10 bg-teal-400/15 text-teal-100 hover:bg-teal-400/15">
                  Live workspace
                </Badge>
              </div>

              <div className="mt-5 max-w-xl">
                <p className="text-xs uppercase tracking-[0.32em] text-white/60">
                  Performance Studio
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-[2.35rem] sm:leading-[1.08]">
                  Forecast demand, cooking volume, and waste risk from one donor view.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/80 sm:text-[15px]">
                  This section blends your real incoming-order performance with the
                  trained ML model so donors can decide how much to cook, how much
                  buffer to keep, and when to slow down production.
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                    Orders Placed
                  </p>
                  <p className="mt-3 text-3xl font-bold">{orders.length}</p>
                  <p className="mt-2 text-sm text-white/70">
                    Actual requests created in your current donor order queue.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                    Acceptance Rate
                  </p>
                  <p className="mt-3 text-3xl font-bold">{formatPercent(acceptanceRate)}</p>
                  <p className="mt-2 text-sm text-white/70">
                    Live rate from your current order queue, not from forecast dates.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/60">
                    Surplus risk
                  </p>
                  <p className="mt-3 text-3xl font-bold">
                    {forecast?.surplus_risk ?? "Loading"}
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    Current model read for waste exposure on the planned service.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/55">
                    Scenario Focus
                  </p>
                  <p className="mt-3 text-xl font-semibold tracking-tight text-white">
                    Keep prep aligned with the selected schedule instead of cooking too early.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/15 p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                        Service Day
                      </p>
                      <p className="mt-2 text-sm font-medium text-white/90">
                        {weekdayOptions.find((option) => option.value === forecastInput.weekday)?.label}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/15 p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                        Meal Window
                      </p>
                      <p className="mt-2 text-sm font-medium capitalize text-white/90">
                        {String(forecastInput.meal_type)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/15 p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                        Outlet
                      </p>
                      <p className="mt-2 text-sm font-medium text-white/90">
                        {plannerOutletLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/55">
                    Forecast Notes
                  </p>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200/82">
                    <p>
                      Order flow, acceptance, and completion come from real donor orders and do
                      not change when you test a forecast date.
                    </p>
                    <p>
                      Use the planner on the right only to test ML demand, cooking target, and
                      surplus risk for alternate service dates.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.25))] px-6 py-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                    Quick Read
                  </p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    Live donor order snapshot
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This area reflects real order activity so you can compare it with the ML plan.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => void loadOrders(true)}
                  disabled={isRefreshingOrders}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isRefreshingOrders ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              {message && (
                <div
                  className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                    message.type === "success"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="mt-5 rounded-3xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.18))] p-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-foreground">Order Flow Overview</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This chart always shows the real status mix of placed donor orders. Running the
                  ML forecast only updates demand, cooking target, and surplus risk.
                </p>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="h-[220px] rounded-2xl border border-border/50 bg-background/70 p-2">
                    {isLoadingOrders ? (
                      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Loading order activity...
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <ClipboardList className="h-8 w-8 text-muted-foreground/70" />
                        <p className="mt-3 text-sm font-medium text-foreground">
                          No placed orders yet
                        </p>
                        <p className="mt-1 max-w-[14rem] text-xs leading-5 text-muted-foreground">
                          Once requests arrive, this chart will split them into pending,
                          accepted, completed, and rejected states.
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={visibleOrderStatusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={38}
                            outerRadius={82}
                            paddingAngle={2}
                            stroke="rgba(255,255,255,0.9)"
                            strokeWidth={2}
                          >
                            {visibleOrderStatusData.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={orderStatusColorMap[entry.name] ?? orderStatusColors[index % orderStatusColors.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="grid gap-3">
                    {visibleOrderStatusData.map((entry, index) => (
                      <div
                        key={entry.name}
                        className="rounded-2xl border border-border/60 bg-background/80 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3.5 w-3.5 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.4)]"
                              style={{
                                backgroundColor:
                                  orderStatusColorMap[entry.name] ?? orderStatusColors[index % orderStatusColors.length],
                              }}
                            />
                            <p className="font-medium text-foreground">{entry.name}</p>
                          </div>
                          <p className="text-xl font-bold text-foreground">{entry.value}</p>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${orders.length === 0 ? 0 : (entry.value / orders.length) * 100}%`,
                              background: `linear-gradient(90deg, ${shiftHexColor(orderStatusColorMap[entry.name] ?? orderStatusColors[index % orderStatusColors.length], 25)}, ${orderStatusColorMap[entry.name] ?? orderStatusColors[index % orderStatusColors.length]})`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4 text-primary" />
                    Completion rate
                  </div>
                  <p className="mt-3 text-3xl font-bold text-foreground">
                    {formatPercent(completionRate)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Real completed handoffs from your current placed orders.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    Accepted orders
                  </div>
                  <p className="mt-3 text-3xl font-bold text-foreground">{acceptedCount}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Requests currently in the accepted state from live orders.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid items-stretch gap-4 xl:grid-cols-2">
        <Card className="hidden border-border/60 bg-background/92 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Order Flow Visual
            </CardTitle>
            <CardDescription>
              A compact picture of how donor orders are moving from request to fulfillment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-[240px] rounded-3xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.3))] p-3">
                {isLoadingOrders ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Loading order analytics...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={82}
                        paddingAngle={4}
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={orderStatusColors[index % orderStatusColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-3">
                {orderStatusData.map((item, index) => (
                  <div
                    key={item.name}
                    className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: orderStatusColors[index] }}
                        />
                        <p className="font-medium text-foreground">{item.name}</p>
                      </div>
                      <p className="text-xl font-bold text-foreground">{item.value}</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${orders.length === 0 ? 0 : (item.value / orders.length) * 100}%`,
                          backgroundColor: orderStatusColors[index],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col border-border/60 bg-background/92 shadow-lg">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              ML Forecast Visual
            </CardTitle>
            <CardDescription>
              Compare predicted demand, recommended cooking, and the model&apos;s safety buffer.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4">
            <div className="flex h-full flex-col rounded-3xl border border-border/60 bg-[radial-gradient(circle_at_top,_hsl(var(--secondary)/0.12),_transparent_38%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.22))] p-4">
              {forecast === null ? (
                <div className="flex min-h-[290px] flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Generating first forecast...
                </div>
              ) : (
                <div className="flex h-full flex-col space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/60 bg-background/90 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Predicted demand
                      </p>
                      <p className="mt-2 text-[2rem] font-bold leading-none text-foreground">
                        {forecast.predicted_demand}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/90 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Cook target
                      </p>
                      <p className="mt-2 text-[2rem] font-bold leading-none text-foreground">
                        {forecast.recommended_cooking}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/90 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Safety buffer
                      </p>
                      <p className="mt-2 text-[2rem] font-bold leading-none text-foreground">
                        {projectedGap}
                      </p>
                    </div>
                  </div>

                  <div className="min-h-[250px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecastVolumeData} barCategoryGap={24}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="label"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis
                          allowDecimals={false}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip />
                        <Bar dataKey="value" radius={[12, 12, 4, 4]}>
                          {forecastVolumeData.map((entry) => (
                            <Cell key={entry.label} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col border-border/60 bg-background/92 shadow-lg">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Forecast Planner
            </CardTitle>
            <CardDescription>
              Adjust the ML inputs and re-run the scenario for an upcoming meal window.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="analytics-date-planner">Service Date</Label>
                <div className="relative">
                  <Input
                    id="analytics-date-planner"
                    ref={plannerDateInputRef}
                    type="date"
                    value={plannerDate}
                    className="pr-3 font-medium tabular-nums [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0"
                    onChange={(event) => setPlannerDate(event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label="Open calendar"
                    className="absolute right-3 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center text-foreground/80 transition-colors hover:text-foreground"
                    onClick={() => {
                      const input = plannerDateInputRef.current as DateInputWithPicker | null;
                      if (!input) return;
                      if (typeof input.showPicker === "function") {
                        input.showPicker();
                      } else {
                        input.focus();
                      }
                    }}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Weekday</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground">
                  {weekdayOptions.find((option) => option.value === forecastInput.weekday)?.label}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Select
                  value={String(forecastInput.meal_type)}
                  onValueChange={(value) =>
                    setForecastInput((current) =>
                      getForecastInputFromPlanner(
                        plannerDate,
                        current.hostel,
                        value,
                        outletMenuPlans,
                        getOutletIndex(String(current.hostel || DEFAULT_OUTLET_ID)),
                      ),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Outlet</Label>
                <Select
                  value={String(forecastInput.hostel)}
                  onValueChange={(value) => {
                    setSelectedOutletId(value);
                    setForecastInput((current) =>
                      getForecastInputFromPlanner(
                        plannerDate,
                        value,
                        current.meal_type,
                        outletMenuPlans,
                        getOutletIndex(value),
                      ),
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outletOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
              The planner uses the selected calendar date to derive the weekday automatically and
              match the correct outlet meal schedule for the forecast.
            </div>

            {plannerDayMenu && (
              <>
              <div className="hidden rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm leading-6 text-muted-foreground">
                Matched schedule:
                {` ${plannerOutletLabel} | ${plannerDayMenu.day} | `}
                {mealTypeOptions.find((option) => option.value === plannerMealSlot)?.label}
                {` | ${plannerDayMenu[plannerMealSlot].label}`}
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3 text-sm leading-6 text-muted-foreground">
                Matched schedule:
                {` ${plannerOutletLabel} | ${plannerDayMenu.day} | `}
                {mealTypeOptions.find((option) => option.value === plannerMealSlot)?.label}
                {` | ${plannerDayMenu[plannerMealSlot].label}`}
              </div>
              </>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                onClick={() => void loadForecast(forecastInput)}
                disabled={isForecasting}
              >
                {isForecasting ? "Running Forecast..." : "Run ML Forecast"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const defaultDate = getDefaultPlannerDate();
                  const defaultOutletId = outletOptions[0]?.value ?? DEFAULT_OUTLET_ID;
                  const defaults = getForecastInputFromPlanner(
                    defaultDate,
                    defaultOutletId,
                    "lunch",
                    outletMenuPlans,
                    getOutletIndex(defaultOutletId),
                  );
                  setPlannerDate(defaultDate);
                  setSelectedOutletId(defaultOutletId);
                  setForecastInput(defaults);
                  void loadForecast(defaults);
                }}
                disabled={isForecasting}
              >
                Reset Inputs
              </Button>
            </div>
          </CardContent>
        </Card>

        {forecast !== null && (
          <Card className={`border shadow-lg xl:col-span-2 ${riskMeta.toneClass}`}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <p className="font-semibold">Written forecast summary</p>
              </div>
              <div className="mt-3 space-y-2 text-sm leading-7 sm:text-[15px]">
                {forecastNarrative.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-border/60 bg-background/92 shadow-lg">
        <CardHeader className="flex flex-col gap-4 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Weekly Outlet Menu
            </CardTitle>
            <CardDescription>
              Add the 7-day menu for breakfast, lunch, evening snacks, and dinner for each outlet.
            </CardDescription>
          </div>

          <div className="flex w-full flex-col gap-3 sm:max-w-[620px] sm:flex-row sm:items-end">
            <div className="w-full space-y-2">
              <Label>Outlet</Label>
              <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outletOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={applySelectedOutletToForecast}
              className="sm:shrink-0"
            >
              Use In Forecast
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetSelectedOutletMenu}
              className="sm:shrink-0"
            >
              Reset Menu
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingOutlets ? (
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading your outlets...
            </div>
          ) : outlets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground">
              Create an outlet first, then its name will appear here for menu planning.
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-3 text-sm leading-6 text-muted-foreground">
              Editing menu for {selectedOutletLabel}. Changes stay saved in this browser for your donor login.
            </div>
          )}

          <div className="grid gap-3">
            {currentWeeklyMenuPlan.map((dayMenu) => (
              <div
                key={dayMenu.day}
                className="rounded-2xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.18))] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{dayMenu.day}</p>
                  <Badge variant="outline">{selectedOutletLabel}</Badge>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-4">
                  {mealSlotOptions.map((slot) => (
                    <div key={slot.value} className="space-y-2">
                      <Label>{slot.label}</Label>
                      <Textarea
                        rows={2}
                        value={dayMenu[slot.value].label}
                        onChange={(event) =>
                          updateOutletMenuLabel(
                            selectedOutletId,
                            dayMenu.day,
                            slot.value,
                            event.target.value,
                          )
                        }
                        placeholder={`${slot.label} menu`}
                        className="min-h-[74px] resize-y"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/60 bg-background/92 shadow-lg xl:col-span-2">
          <CardHeader className="flex flex-col gap-4 pb-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                Weekly Menu Intelligence
              </CardTitle>
              <CardDescription>
                Review outlet menus, then inspect weekly consumption and waste patterns
                for the selected meal window.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-4 sm:max-w-[460px] sm:flex-row">
              <div className="w-full space-y-2">
                <Label>Outlet Filter</Label>
                <Select
                  value={selectedOutletId}
                  onValueChange={setSelectedOutletId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outletOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full space-y-2">
                <Label>Meal Filter</Label>
                <Select
                  value={menuInsightMeal}
                  onValueChange={(value) =>
                    setMenuInsightMeal(
                      value as "breakfast" | "lunch" | "eveningSnacks" | "dinner",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealSlotOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-3xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.2))] p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <p className="font-semibold text-foreground">Weekly Waste Trend</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Waste score by day for {selectedOutletLabel} in{" "}
                  {mealSlotOptions.find((option) => option.value === menuInsightMeal)?.label.toLowerCase()}.
                </p>

                <div className="mt-4 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis
                        allowDecimals={false}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip
                        formatter={(value, _, payload) => [
                          `${value} waste score`,
                          `${payload?.payload?.menu} (${payload?.payload?.type})`,
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="waste"
                        stroke="rgba(255,255,255,0.28)"
                        strokeWidth={10}
                        dot={false}
                        activeDot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="waste"
                        stroke="#DC2626"
                        strokeWidth={4}
                        dot={{ r: 5, fill: "#DC2626", stroke: "#FECACA", strokeWidth: 3 }}
                        activeDot={{ r: 7, fill: "#B91C1C", stroke: "#FEE2E2", strokeWidth: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-border/60 bg-[radial-gradient(circle_at_top,_hsl(var(--secondary)/0.14),_transparent_40%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.25))] p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <p className="font-semibold text-foreground">Weekly Food Consume Trend</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedOutletLabel} ranking for{" "}
                    {mealSlotOptions.find((option) => option.value === menuInsightMeal)?.label.toLowerCase()} this week.
                  </p>

                  <div className="mt-4 h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis
                          allowDecimals={false}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip
                          formatter={(value, _, payload) => [
                            `${value} consume score`,
                            `${payload?.payload?.menu} (${payload?.payload?.type})`,
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="consume"
                          stroke="rgba(255,255,255,0.28)"
                          strokeWidth={10}
                          dot={false}
                          activeDot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="consume"
                          stroke="#2563EB"
                          strokeWidth={4}
                          dot={{ r: 5, fill: "#2563EB", stroke: "#93C5FD", strokeWidth: 3 }}
                          activeDot={{ r: 7, fill: "#1D4ED8", stroke: "#DBEAFE", strokeWidth: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="hidden grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-emerald-800">
                    <p className="text-xs uppercase tracking-[0.2em] opacity-80">
                      Most Eaten
                    </p>
                    <p className="mt-3 text-xl font-bold">{mostEatenMeal?.menu}</p>
                    <p className="mt-1 text-sm">
                      {mostEatenMeal?.day} • {mostEatenMeal?.type} • score {mostEatenMeal?.popularity}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-200/70 bg-amber-50/85 p-4 text-amber-800">
                    <p className="text-xs uppercase tracking-[0.2em] opacity-80">
                      Least Eaten
                    </p>
                    <p className="mt-3 text-xl font-bold">{leastEatenMeal?.menu}</p>
                    <p className="mt-1 text-sm">
                      {leastEatenMeal?.day} • {leastEatenMeal?.type} • score {leastEatenMeal?.popularity}
                    </p>
                  </div>
                </div>

                <div className="hidden rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                  The weekly menu list has been hidden so this area stays chart-first. Use the
                  outlet and meal filters to compare weekly consume movement faster.
                </div>
              </div>
            </div>

            <div className="hidden grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="hidden rounded-3xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.2))] p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <p className="font-semibold text-foreground">Weekly Waste Trend</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Waste score by day for {selectedOutletLabel} in{" "}
                  {mealSlotOptions.find((option) => option.value === menuInsightMeal)?.label.toLowerCase()}.
                </p>

                <div className="mt-4 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        formatter={(value, _, payload) => [
                          `${value} waste score`,
                          `${payload?.payload?.menu} (${payload?.payload?.type})`,
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="waste"
                        stroke="rgba(255,255,255,0.28)"
                        strokeWidth={10}
                        dot={false}
                        activeDot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="waste"
                        stroke="#DC2626"
                        strokeWidth={4}
                        dot={{ r: 5, fill: "#DC2626", stroke: "#FECACA", strokeWidth: 3 }}
                        activeDot={{ r: 7, fill: "#B91C1C", stroke: "#FEE2E2", strokeWidth: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:col-span-3">
                <div className="rounded-2xl border border-red-200/70 bg-red-50/85 p-4 text-red-800">
                  <p className="text-xs uppercase tracking-[0.2em] opacity-80">
                    Most Waste
                  </p>
                  <p className="mt-3 text-xl font-bold">{mostWasteMeal?.menu}</p>
                  <p className="mt-1 text-sm">
                    {mostWasteMeal?.day} • {mostWasteMeal?.type} • waste {mostWasteMeal?.waste}
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-200/70 bg-sky-50/85 p-4 text-sky-800">
                  <p className="text-xs uppercase tracking-[0.2em] opacity-80">
                    Least Waste
                  </p>
                  <p className="mt-3 text-xl font-bold">{leastWasteMeal?.menu}</p>
                  <p className="mt-1 text-sm">
                    {leastWasteMeal?.day} • {leastWasteMeal?.type} • waste {leastWasteMeal?.waste}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/90 p-4 sm:col-span-2 xl:col-span-2">
                  <p className="text-sm font-medium text-foreground">How to read this</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Higher consume score means that menu was better received for the selected meal
                    slot. Higher waste score means more leftovers were likely produced. This makes
                    it easier to compare outlet-level menu performance over the full week.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-emerald-800">
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">
                  Most Eaten
                </p>
                <p className="mt-3 text-xl font-bold">{mostEatenMeal?.menu}</p>
                <p className="mt-1 text-sm">
                  {mostEatenMeal?.day} | {mostEatenMeal?.type} | score {mostEatenMeal?.popularity}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/85 p-4 text-amber-800">
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">
                  Least Eaten
                </p>
                <p className="mt-3 text-xl font-bold">{leastEatenMeal?.menu}</p>
                <p className="mt-1 text-sm">
                  {leastEatenMeal?.day} | {leastEatenMeal?.type} | score {leastEatenMeal?.popularity}
                </p>
              </div>
              <div className="rounded-2xl border border-red-200/70 bg-red-50/85 p-4 text-red-800">
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">
                  Most Waste
                </p>
                <p className="mt-3 text-xl font-bold">{mostWasteMeal?.menu}</p>
                <p className="mt-1 text-sm">
                  {mostWasteMeal?.day} | {mostWasteMeal?.type} | waste {mostWasteMeal?.waste}
                </p>
              </div>
              <div className="rounded-2xl border border-sky-200/70 bg-sky-50/85 p-4 text-sky-800">
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">
                  Least Waste
                </p>
                <p className="mt-3 text-xl font-bold">{leastWasteMeal?.menu}</p>
                <p className="mt-1 text-sm">
                  {leastWasteMeal?.day} | {leastWasteMeal?.type} | waste {leastWasteMeal?.waste}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
              Use the outlet and meal filters above to compare both weekly trends. Higher consume
              scores suggest stronger reception, while higher waste scores indicate meal windows
              that may need tighter cooking control.
            </div>
          </CardContent>
        </Card>

        <Card className="hidden border-border/60 bg-background/92 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Forecast Planner
            </CardTitle>
            <CardDescription>
              Adjust the ML inputs and re-run the scenario for an upcoming meal window.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="analytics-date-old">Service Date</Label>
                <Input
                  id="analytics-date-old"
                  type="date"
                  value={plannerDate}
                  onChange={(event) => setPlannerDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Weekday</Label>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted/20 px-3 text-sm text-foreground">
                  {weekdayOptions.find((option) => option.value === forecastInput.weekday)?.label}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Select
                  value={String(forecastInput.meal_type)}
                  onValueChange={(value) =>
                    setForecastInput((current) => ({
                      ...current,
                      meal_type: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Menu Type</Label>
                <Select
                  value={String(forecastInput.menu)}
                  onValueChange={(value) =>
                    setForecastInput((current) => ({
                      ...current,
                      menu: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select menu" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Outlet</Label>
                <Select
                  value={String(forecastInput.hostel)}
                  onValueChange={(value) =>
                    setForecastInput((current) => ({
                      ...current,
                      hostel: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outletOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              The planner now uses a calendar date and derives the weekday automatically.
              Menu choices are aligned to the selected outlet and meal type for that weekly schedule.
            </div>

            {plannerDayMenu && (
              <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
                Matched schedule:
                {` ${plannerOutletLabel} | ${plannerDayMenu.day} | `}
                {mealTypeOptions.find((option) => option.value === plannerMealSlot)?.label}
                {` | ${plannerDayMenu[plannerMealSlot].label}`}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => void loadForecast(forecastInput)}
                disabled={isForecasting}
              >
                {isForecasting ? "Running Forecast..." : "Run ML Forecast"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const defaults = getDefaultAnalyticsInput();
                  setForecastInput(defaults);
                  void loadForecast(defaults);
                }}
                disabled={isForecasting}
              >
                Reset Inputs
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="self-start border-border/60 bg-background/92 shadow-lg xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Donor Guidance
            </CardTitle>
            <CardDescription>
              A written operating brief designed to make the ML output easier to act on.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/60 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.22))] p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Recommended donor playbook
              </div>
              <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
                <p>
                  Start production toward the predicted demand level first, then use the
                  recommended cooking figure as your controlled upper boundary rather than
                  cooking the full amount too early.
                </p>
                <p>
                  If order acceptance remains low while surplus risk is medium or high,
                  hold back the final batch and re-check the dashboard after new NGO
                  responses arrive.
                </p>
                <p>
                  Pair the ML signal with your local donor context such as outlet timing,
                  travel distance, and menu perishability before making the final cooking decision.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Best used for
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground">
                  Planning morning prep, deciding safety stock, and setting a more disciplined
                  cooking ceiling for each service window.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ChefHat className="h-4 w-4 text-primary" />
                  Keep in mind
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground">
                  The ML model is guidance, not a guarantee. Unexpected weather, donor closures,
                  or last-minute NGO demand can still shift the final outcome.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceAnalyticsSection;
