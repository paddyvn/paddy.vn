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
  const getUniqueOptions = (optionKey: "option1" | "option2" | "option3") => {
    const options = variants
      .map((v) => v[optionKey])
      .filter((v, i, arr) => v && arr.indexOf(v) === i);
    return options as string[];
  };

  const option1Values = getUniqueOptions("option1");
  const option2Values = getUniqueOptions("option2");
  const option3Values = getUniqueOptions("option3");

  // If there's only one variant with no options, don't show selector
  if (variants.length === 1 && !option1Values.length && !option2Values.length && !option3Values.length) {
    return null;
  }

  const handleOptionSelect = (optionKey: string, value: string) => {
    const matchingVariant = variants.find((v) => {
      if (optionKey === "option1") {
        return v.option1 === value && 
          (!selectedVariant?.option2 || v.option2 === selectedVariant.option2) &&
          (!selectedVariant?.option3 || v.option3 === selectedVariant.option3);
      }
      if (optionKey === "option2") {
        return (!selectedVariant?.option1 || v.option1 === selectedVariant.option1) &&
          v.option2 === value &&
          (!selectedVariant?.option3 || v.option3 === selectedVariant.option3);
      }
      if (optionKey === "option3") {
        return (!selectedVariant?.option1 || v.option1 === selectedVariant.option1) &&
          (!selectedVariant?.option2 || v.option2 === selectedVariant.option2) &&
          v.option3 === value;
      }
      return false;
    });

    if (matchingVariant) {
      onVariantChange(matchingVariant);
    }
  };

  const renderOptionGroup = (
    optionKey: "option1" | "option2" | "option3",
    optionName: string | null,
    values: string[]
  ) => {
    if (!values.length) return null;

    const selectedValue = selectedVariant?.[optionKey];

    return (
      <div key={optionKey} className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-base font-semibold">
            Select {optionName || optionKey}
          </label>
          <button className="text-sm text-primary hover:underline">
            Size Guide
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {values.map((value) => {
            const isSelected = selectedValue === value;
            const isOutOfStock = variants.find(
              (v) => v[optionKey] === value && v.stock_quantity !== null && v.stock_quantity <= 0
            );

            return (
              <button
                key={value}
                onClick={() => handleOptionSelect(optionKey, value)}
                disabled={!!isOutOfStock}
                className={cn(
                  "relative px-6 py-3 text-sm font-medium border rounded-lg transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:border-primary/50 text-foreground",
                  isOutOfStock && "opacity-50 cursor-not-allowed line-through"
                )}
              >
                {value}
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {option1Values.length > 0 && renderOptionGroup("option1", optionNames.option1, option1Values)}
      {option2Values.length > 0 && renderOptionGroup("option2", optionNames.option2, option2Values)}
      {option3Values.length > 0 && renderOptionGroup("option3", optionNames.option3, option3Values)}
    </div>
  );
}
