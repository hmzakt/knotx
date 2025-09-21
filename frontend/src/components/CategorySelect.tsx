"use client";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
};

export default function CategorySelect({ value, onChange, options, className }: Props) {
  const label = value === "all" ? "All Categories" : value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex items-center h-12 px-3 rounded bg-card text-card-foreground shadow-sm w-full sm:w-56 md:w-64",
            "hover:bg-muted/50 transition-colors",
            className
          )}
        >
          <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
          <span className="text-sm font-medium truncate">
            {label}
          </span>
          <ChevronDown className="absolute right-3 w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[12rem]">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v)}>
          <DropdownMenuRadioItem value="all">All Categories</DropdownMenuRadioItem>
          {options.map((opt) => (
            <DropdownMenuRadioItem key={opt} value={opt}>
              {opt}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
