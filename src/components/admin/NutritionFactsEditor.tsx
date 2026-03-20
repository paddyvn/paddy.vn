import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface NutritionFact {
  label: string;
  value: string;
}

interface NutritionFactsEditorProps {
  value: NutritionFact[];
  onChange: (facts: NutritionFact[]) => void;
}

export function NutritionFactsEditor({ value, onChange }: NutritionFactsEditorProps) {
  const addFact = () => {
    onChange([...value, { label: "", value: "" }]);
  };

  const removeFact = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateFact = (index: number, field: "label" | "value", newValue: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: newValue };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {value.map((fact, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder="Tên (VD: Protein thô)"
            value={fact.label}
            onChange={(e) => updateFact(index, "label", e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Giá trị (VD: 24%)"
            value={fact.value}
            onChange={(e) => updateFact(index, "value", e.target.value)}
            className="w-32"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeFact(index)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addFact}
        className="mt-2"
      >
        <Plus className="h-4 w-4 mr-1" />
        Thêm chỉ số
      </Button>
    </div>
  );
}
