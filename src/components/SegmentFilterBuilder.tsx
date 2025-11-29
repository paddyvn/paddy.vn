import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentFilter } from "@/hooks/useSegments";

const FIELD_OPTIONS = [
  { value: "total_spent", label: "Total Spent" },
  { value: "orders_count", label: "Orders Count" },
  { value: "email", label: "Email" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "phone", label: "Phone" },
  { value: "accepts_marketing", label: "Accepts Marketing" },
  { value: "verified_email", label: "Verified Email" },
  { value: "tags", label: "Tags" },
];

const NUMERIC_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "greater_than_or_equal", label: "Greater or Equal" },
  { value: "less_than_or_equal", label: "Less or Equal" },
];

const TEXT_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
];

const BOOLEAN_OPERATORS = [
  { value: "is_true", label: "Is True" },
  { value: "is_false", label: "Is False" },
];

interface SegmentFilterBuilderProps {
  filters: SegmentFilter[];
  onChange: (filters: SegmentFilter[]) => void;
}

export function SegmentFilterBuilder({ filters, onChange }: SegmentFilterBuilderProps) {
  const addFilter = () => {
    onChange([
      ...filters,
      { field: "total_spent", operator: "greater_than", value: "" },
    ]);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<SegmentFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onChange(newFilters);
  };

  const getOperatorsForField = (field: string) => {
    if (["total_spent", "orders_count"].includes(field)) {
      return NUMERIC_OPERATORS;
    }
    if (["accepts_marketing", "verified_email"].includes(field)) {
      return BOOLEAN_OPERATORS;
    }
    return TEXT_OPERATORS;
  };

  const isFieldBoolean = (field: string) => {
    return ["accepts_marketing", "verified_email"].includes(field);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Filters</Label>
        <Button type="button" variant="outline" size="sm" onClick={addFilter}>
          <Plus className="h-4 w-4 mr-2" />
          Add Filter
        </Button>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground">
          No filters added. Click "Add Filter" to create your first condition.
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter, index) => (
            <div
              key={index}
              className="flex items-end gap-2 p-4 border rounded-lg bg-background"
            >
              <div className="flex-1 space-y-2">
                <Label className="text-xs">Field</Label>
                <Select
                  value={filter.field}
                  onValueChange={(value) => {
                    const operators = getOperatorsForField(value);
                    updateFilter(index, {
                      field: value,
                      operator: operators[0].value,
                      value: "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label className="text-xs">Operator</Label>
                <Select
                  value={filter.operator}
                  onValueChange={(value) => updateFilter(index, { operator: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getOperatorsForField(filter.field).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isFieldBoolean(filter.field) &&
                !["is_true", "is_false"].includes(filter.operator) && (
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs">Value</Label>
                    <Input
                      type={
                        ["total_spent", "orders_count"].includes(filter.field)
                          ? "number"
                          : "text"
                      }
                      value={filter.value}
                      onChange={(e) =>
                        updateFilter(index, { value: e.target.value })
                      }
                      placeholder="Enter value"
                    />
                  </div>
                )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFilter(index)}
                className="mb-0.5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
