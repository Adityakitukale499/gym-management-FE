import * as React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof Calendar>;

function CustomCalendar({ className, ...props }: CalendarProps) {
  return (
    <Calendar className={cn("rounded-md border p-3", className)} {...props} />
  );
}

CustomCalendar.displayName = "Calendar";

export { CustomCalendar as Calendar };
