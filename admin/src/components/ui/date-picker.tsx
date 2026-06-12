import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ClockIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

function DatePicker({ value, onChange, placeholder = "Pick a date", className, id }: {
    value?: Date | string
    onChange: (date: Date) => void
    placeholder?: string
    className?: string
    id?: string
}) {
    const [open, setOpen] = React.useState(false);

    const selected = value ? new Date(value) : undefined;

    function handleSelect(date: Date | undefined) {
        if (date) {
            onChange(date);
        }
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="size-4 text-muted-foreground" />
                    {selected ? format(selected, "PPP") : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={handleSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

function DateTimePicker({ value, onChange, placeholder = "Pick a date & time", className, id }: {
    value?: Date | string
    onChange: (date: Date) => void
    placeholder?: string
    className?: string
    id?: string
}) {
    const [open, setOpen] = React.useState(false);

    const selected = value ? new Date(value) : undefined;
    const currentHour = selected ? String(selected.getHours()).padStart(2, "0") : "";
    const currentMinute = selected
        ? String(Math.floor(selected.getMinutes() / 5) * 5).padStart(2, "0")
        : "";

    function handleDateSelect(date: Date | undefined) {
        if (date) {
            const newDate = new Date(date);
            if (selected) {
                newDate.setHours(selected.getHours(), selected.getMinutes());
            }
            onChange(newDate);
        }
    }

    function handleHourChange(hour: string) {
        const newDate = selected ? new Date(selected) : new Date();
        newDate.setHours(Number(hour), selected ? selected.getMinutes() : 0);
        onChange(newDate);
    }

    function handleMinuteChange(minute: string) {
        const newDate = selected ? new Date(selected) : new Date();
        newDate.setHours(selected ? selected.getHours() : 0, Number(minute));
        onChange(newDate);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="size-4 text-muted-foreground" />
                    {selected ? format(selected, "PPP p") : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={handleDateSelect}
                    initialFocus
                />
                <div className="border-t p-3">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="size-4 text-muted-foreground" />
                        <Label className="text-xs text-muted-foreground">Time</Label>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <Select value={currentHour} onValueChange={handleHourChange}>
                            <SelectTrigger className="w-[70px]">
                                <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent>
                                {hours.map((h) => (
                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-sm font-medium text-muted-foreground">:</span>
                        <Select value={currentMinute} onValueChange={handleMinuteChange}>
                            <SelectTrigger className="w-[70px]">
                                <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                                {minutes.map((m) => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function TimePicker({ value, onChange, placeholder = "Pick a time", className, id }: {
    value?: string
    onChange: (time: string) => void
    placeholder?: string
    className?: string
    id?: string
}) {
    const [open, setOpen] = React.useState(false);

    const parsed = value ? value.split(":") : [];
    const currentHour = parsed[0] || "";
    const currentMinute = parsed[1]
        ? String(Math.floor(Number(parsed[1]) / 5) * 5).padStart(2, "0")
        : "";

    function handleHourChange(hour: string) {
        onChange(`${hour}:${currentMinute || "00"}`);
    }

    function handleMinuteChange(minute: string) {
        onChange(`${currentHour || "00"}:${minute}`);
    }

    const displayValue = currentHour && currentMinute !== ""
        ? `${currentHour}:${currentMinute}`
        : null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !displayValue && "text-muted-foreground",
                        className
                    )}
                >
                    <ClockIcon className="size-4 text-muted-foreground" />
                    {displayValue || placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
                <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="size-4 text-muted-foreground" />
                    <Label className="text-xs text-muted-foreground">Select time</Label>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={currentHour} onValueChange={handleHourChange}>
                        <SelectTrigger className="w-[70px]">
                            <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent>
                            {hours.map((h) => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-sm font-medium text-muted-foreground">:</span>
                    <Select value={currentMinute} onValueChange={handleMinuteChange}>
                        <SelectTrigger className="w-[70px]">
                            <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                            {minutes.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export { DatePicker, DateTimePicker, TimePicker };
