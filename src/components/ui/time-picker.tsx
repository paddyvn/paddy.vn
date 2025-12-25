import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  const [hours, minutes] = value ? value.split(":").map(Number) : [0, 0];

  const hoursArray = Array.from({ length: 24 }, (_, i) => i);
  const minutesArray = Array.from({ length: 60 }, (_, i) => i);

  const handleHourSelect = (hour: number) => {
    const newTime = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    onChange(newTime);
  };

  const handleMinuteSelect = (minute: number) => {
    const newTime = `${hours.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    onChange(newTime);
    setOpen(false);
  };

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? formatTime(hours, minutes) : "Select time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="flex flex-col">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
              Hour
            </div>
            <ScrollArea className="h-56">
              <div className="p-1">
                {hoursArray.map((hour) => (
                  <Button
                    key={hour}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-12 justify-center font-normal",
                      hours === hour && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    onClick={() => handleHourSelect(hour)}
                  >
                    {hour.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex flex-col border-l">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
              Minute
            </div>
            <ScrollArea className="h-56">
              <div className="p-1">
                {minutesArray.map((minute) => (
                  <Button
                    key={minute}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-12 justify-center font-normal",
                      minutes === minute && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    onClick={() => handleMinuteSelect(minute)}
                  >
                    {minute.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
