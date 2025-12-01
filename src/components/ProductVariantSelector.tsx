import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  price: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  stock_quantity: number | null;
}

interface ProductVariantSelectorProps {
  variants: Variant[];
  selectedVariant: Variant | null;
  onVariantChange: (variant: Variant) => void;
  optionNames: {
    option1: string | null;
    option2: string | null;
    option3: string | null;
  };
}

export function ProductVariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
  optionNames,
}: ProductVariantSelectorProps) {
  // Extract unique options for each option type
  const getUniqueOptions = (optionKey: 'option1' | 'option2' | 'option3') => {
    const options = variants
      .map(v => v[optionKey])
      .filter((v, i, arr) => v && arr.indexOf(v) === i);
    return options;
  };

  const option1Values = getUniqueOptions('option1');
  const option2Values = getUniqueOptions('option2');
  const option3Values = getUniqueOptions('option3');

  // If only one variant with no options, don't show selector
  if (variants.length === 1 && !option1Values.length && !option2Values.length && !option3Values.length) {
    return null;
  }

  const renderOptionGroup = (
    optionKey: 'option1' | 'option2' | 'option3',
    optionName: string | null,
    values: (string | null)[]
  ) => {
    if (!values.length || !optionName) return null;

    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold">{optionName}</Label>
        <RadioGroup
          value={selectedVariant?.[optionKey] || ''}
          onValueChange={(value) => {
            const newVariant = variants.find(v => {
              if (optionKey === 'option1') return v.option1 === value;
              if (optionKey === 'option2') return v.option2 === value;
              if (optionKey === 'option3') return v.option3 === value;
              return false;
            });
            if (newVariant) onVariantChange(newVariant);
          }}
          className="flex flex-wrap gap-2"
        >
          {values.map((value) => {
            const variant = variants.find(v => v[optionKey] === value);
            const isOutOfStock = variant && variant.stock_quantity !== null && variant.stock_quantity <= 0;
            
            return (
              <Label
                key={value}
                className={cn(
                  "flex items-center justify-center px-4 py-2 border-2 rounded-md cursor-pointer transition-smooth",
                  selectedVariant?.[optionKey] === value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50",
                  isOutOfStock && "opacity-50 cursor-not-allowed"
                )}
              >
                <RadioGroupItem value={value || ''} className="sr-only" disabled={isOutOfStock} />
                <span className="font-medium">{value}</span>
                {isOutOfStock && (
                  <span className="ml-2 text-xs text-muted-foreground">(Out of stock)</span>
                )}
              </Label>
            );
          })}
        </RadioGroup>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderOptionGroup('option1', optionNames.option1, option1Values)}
      {renderOptionGroup('option2', optionNames.option2, option2Values)}
      {renderOptionGroup('option3', optionNames.option3, option3Values)}
    </div>
  );
}
