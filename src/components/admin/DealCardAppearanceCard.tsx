import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DogIcon, CatIcon, DogFace2Icon, CatFace2Icon, PawIcon, BoneIcon, FishIcon } from "@/components/PaddyIconPatterns";

interface DealCardAppearanceCardProps {
  gradientFrom: string;
  gradientTo: string;
  iconType: string;
  onGradientFromChange: (value: string) => void;
  onGradientToChange: (value: string) => void;
  onIconTypeChange: (value: string) => void;
}

const iconOptions = [
  { value: "dog_cat", label: "Dog & Cat", TopIcon: DogIcon, BottomIcon: CatIcon },
  { value: "cat_dog", label: "Cat & Dog", TopIcon: CatIcon, BottomIcon: DogIcon },
  { value: "dog_face_2", label: "Dog Face Duo", TopIcon: DogFace2Icon, BottomIcon: CatFace2Icon },
  { value: "paw_bone", label: "Paw & Bone", TopIcon: PawIcon, BottomIcon: BoneIcon },
  { value: "bone_paw", label: "Bone & Paw", TopIcon: BoneIcon, BottomIcon: PawIcon },
  { value: "fish_paw", label: "Fish & Paw", TopIcon: FishIcon, BottomIcon: PawIcon },
];

// Preset gradient colors
const gradientPresets = [
  { from: "#FF6B6B", to: "#EE5A24", name: "Red Orange" },
  { from: "#0984E3", to: "#74B9FF", name: "Blue Sky" },
  { from: "#00B894", to: "#00CEC9", name: "Teal" },
  { from: "#6C5CE7", to: "#A29BFE", name: "Purple" },
  { from: "#FDCB6E", to: "#F39C12", name: "Yellow" },
  { from: "#E84393", to: "#FD79A8", name: "Pink" },
  { from: "#2D3436", to: "#636E72", name: "Gray" },
  { from: "#00B894", to: "#55EFC4", name: "Mint" },
];

export function DealCardAppearanceCard({
  gradientFrom,
  gradientTo,
  iconType,
  onGradientFromChange,
  onGradientToChange,
  onIconTypeChange,
}: DealCardAppearanceCardProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <h3 className="font-semibold">Deal Card Appearance</h3>

        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div
            className="relative aspect-square w-32 rounded-xl overflow-hidden shadow-lg mx-auto"
            style={{
              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            }}
          >
            {/* Show selected icons */}
            {(() => {
              const selected = iconOptions.find((opt) => opt.value === iconType);
              if (!selected) return null;
              const { TopIcon, BottomIcon } = selected;
              return (
                <>
                  <TopIcon className="absolute -top-2 -right-2 w-12 h-12 text-white/20 rotate-12" />
                  <BottomIcon className="absolute -bottom-2 -left-2 w-10 h-10 text-white/15 -rotate-12" />
                </>
              );
            })()}
            <div className="relative z-10 h-full flex flex-col items-center justify-center p-3 text-center">
              <p className="text-white text-sm font-bold drop-shadow-md">Flash Sale</p>
              <p className="text-white/90 text-xs mt-1 drop-shadow-md">50% OFF</p>
            </div>
          </div>
        </div>

        {/* Gradient Colors */}
        <div className="space-y-3">
          <Label>Gradient Colors</Label>
          
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {gradientPresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  onGradientFromChange(preset.from);
                  onGradientToChange(preset.to);
                }}
                className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-foreground/30 transition-all shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                }}
                title={preset.name}
              />
            ))}
          </div>

          {/* Custom color inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">From</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradientFrom}
                  onChange={(e) => onGradientFromChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border"
                />
                <Input
                  value={gradientFrom}
                  onChange={(e) => onGradientFromChange(e.target.value)}
                  placeholder="#FF6B6B"
                  className="flex-1 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">To</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradientTo}
                  onChange={(e) => onGradientToChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border"
                />
                <Input
                  value={gradientTo}
                  onChange={(e) => onGradientToChange(e.target.value)}
                  placeholder="#EE5A24"
                  className="flex-1 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Icon Selection */}
        <div className="space-y-3">
          <Label>Background Icons</Label>
          <RadioGroup
            value={iconType}
            onValueChange={onIconTypeChange}
            className="grid grid-cols-2 gap-2"
          >
            {iconOptions.map((opt) => (
              <div key={opt.value} className="relative">
                <RadioGroupItem
                  value={opt.value}
                  id={opt.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={opt.value}
                  className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-1">
                    <opt.TopIcon className="w-5 h-5 text-foreground/70" />
                    <opt.BottomIcon className="w-4 h-4 text-foreground/50" />
                  </div>
                  <span className="text-xs">{opt.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
