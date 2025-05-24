import{
  Activity,
  Users,
  UserPlus,
  Clock,
  AlertTriangle,
  UserMinus,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IconType =
  | "users"
  | "user-plus"
  | "clock"
  | "alert-triangle"
  | "user-minus"
  | "activity"
  | "credit-card";
type ColorType =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary";

interface StatsCardProps {
  title: string;
  value: number;
  icon: IconType;
  color: ColorType;
}

export default function StatsCard({
  title,
  value,
  icon,
  color,
}: StatsCardProps) {
  // Map color to tailwind classes
  const colorClasses: Record<
    ColorType,
    { border: string; bg: string; text: string }
  > = {
    primary: {
      border: "border-primary-500",
      bg: "bg-primary-50",
      text: "text-primary-500",
    },
    success: {
      border: "border-green-500",
      bg: "bg-green-50",
      text: "text-green-500",
    },
    warning: {
      border: "border-yellow-500",
      bg: "bg-yellow-50",
      text: "text-yellow-500",
    },
    danger: {
      border: "border-red-500",
      bg: "bg-red-50",
      text: "text-red-500",
    },
    info: {
      border: "border-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-500",
    },
    secondary: {
      border: "border-gray-500",
      bg: "bg-gray-50",
      text: "text-gray-500",
    },
  };

  // Map icon name to lucide icon component
  const renderIcon = () => {
    switch (icon) {
      case "users":
        return <Users className={cn("h-6 w-6", colorClasses[color].text)} />;
      case "user-plus":
        return <UserPlus className={cn("h-6 w-6", colorClasses[color].text)} />;
      case "clock":
        return <Clock className={cn("h-6 w-6", colorClasses[color].text)} />;
      case "alert-triangle":
        return (
          <AlertTriangle className={cn("h-6 w-6", colorClasses[color].text)} />
        );
      case "user-minus":
        return (
          <UserMinus className={cn("h-6 w-6", colorClasses[color].text)} />
        );
      case "activity":
        return <Activity className={cn("h-6 w-6", colorClasses[color].text)} />;

      case "credit-card": // ✅ Add this
        return (
          <CreditCard className={cn("h-6 w-6", colorClasses[color].text)} />
        );
      default:
        return <Activity className={cn("h-6 w-6", colorClasses[color].text)} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-6 flex items-center gap-2 md:gap-4 text-xs md:text-base">
      <div className={cn("p-3 rounded-lg", colorClasses[color].bg)}>
        {renderIcon()}
      </div>
      <div>
        <div className="font-semibold text-base md:text-xl">{value}</div>
        <div className="text-xs md:text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
}
