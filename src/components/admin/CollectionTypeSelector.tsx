import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CollectionTypeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function CollectionTypeSelector({ value, onValueChange }: CollectionTypeSelectorProps) {
  // Map legacy values to manual/smart
  const normalizedValue = value === "smart" ? "smart" : "manual";
  
  return (
    <RadioGroup
      value={normalizedValue}
      onValueChange={onValueChange}
      className="space-y-3"
    >
      <div className="flex items-start space-x-3">
        <RadioGroupItem value="manual" id="manual" className="mt-1" />
        <div className="space-y-1">
          <Label htmlFor="manual" className="font-medium cursor-pointer">
            Manual
          </Label>
          <p className="text-sm text-muted-foreground">
            Add products to this collection one by one.
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-3">
        <RadioGroupItem value="smart" id="smart" className="mt-1" />
        <div className="space-y-1">
          <Label htmlFor="smart" className="font-medium cursor-pointer">
            Smart
          </Label>
          <p className="text-sm text-muted-foreground">
            Existing and future products that match the conditions you set will automatically be added to this collection.
          </p>
        </div>
      </div>
    </RadioGroup>
  );
}

export function getCollectionTypeDescription(type: string): string {
  switch (type) {
    case 'smart':
      return 'Smart collections automatically include products based on conditions';
    case 'manual':
    default:
      return 'Manual collections allow you to add products one by one';
  }
}
