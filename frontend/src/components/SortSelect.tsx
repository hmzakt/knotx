"use client";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { SortAsc, SortDesc, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

type SortOption = "newest" | "oldest" | "priceLow" | "priceHigh";

const LABELS: Record<SortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  priceLow: "Price: Low to High",
  priceHigh: "Price: High to Low",
};

export function SortSelect({
  value,
  onChange,
  className,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
  className?: string;
}) {
  const isPrice = value === "priceLow" || value === "priceHigh";

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
          {isPrice ? (
            <SortAsc className="w-4 h-4 mr-2 text-muted-foreground" />
          ) : (
            <SortDesc className="w-4 h-4 mr-2 text-muted-foreground" />
          )}
          <span className="text-sm font-medium truncate">{LABELS[value]}</span>
          <ChevronDown className="absolute right-3 w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as SortOption)}>
          {(Object.keys(LABELS) as SortOption[]).map((opt) => (
            <DropdownMenuRadioItem key={opt} value={opt}>
              {LABELS[opt]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SortSelect;
