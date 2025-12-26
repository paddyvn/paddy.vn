import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Plus, X } from "lucide-react";
import { DogIcon, CatIcon, DogFace2Icon, CatFace2Icon, PawIcon, BoneIcon, FishIcon } from "@/components/PaddyIconPatterns";
import { ImagePickerDialog } from "./ImagePickerDialog";

export interface CustomIcon {
  position: "top_left" | "top_right" | "bottom_left" | "bottom_right";
  url: string;
}

interface DealCardAppearanceCardProps {
  gradientFrom: string;
  gradientTo: string;
  iconType: string;
  customIcons?: CustomIcon[];
  title?: string;
  subtitle?: string;
  onGradientFromChange: (value: string) => void;
  onGradientToChange: (value: string) => void;
  onIconTypeChange: (value: string) => void;
  onCustomIconsChange?: (icons: CustomIcon[]) => void;
}

const iconOptions = [
  { value: "dog_cat", label: "Dog & Cat", TopIcon: DogIcon, BottomIcon: CatIcon },
  { value: "cat_dog", label: "Cat & Dog", TopIcon: CatIcon, BottomIcon: DogIcon },
  { value: "dog_face_2", label: "Dog Face Duo", TopIcon: DogFace2Icon, BottomIcon: CatFace2Icon },
  { value: "paw_bone", label: "Paw & Bone", TopIcon: PawIcon, BottomIcon: BoneIcon },
  { value: "bone_paw", label: "Bone & Paw", TopIcon: BoneIcon, BottomIcon: PawIcon },
  { value: "fish_paw", label: "Fish & Paw", TopIcon: FishIcon, BottomIcon: PawIcon },
];

const positionOptions = [
  { value: "top_left", label: "Top Left" },
  { value: "top_right", label: "Top Right" },
  { value: "bottom_left", label: "Bottom Left" },
  { value: "bottom_right", label: "Bottom Right" },
];

const positionStyles: Record<string, string> = {
  top_left: "-top-2 -left-2",
  top_right: "-top-2 -right-2",
  bottom_left: "-bottom-2 -left-2",
  bottom_right: "-bottom-2 -right-2",
};

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
  customIcons = [],
  title,
  subtitle,
  onGradientFromChange,
  onGradientToChange,
  onIconTypeChange,
  onCustomIconsChange,
}: DealCardAppearanceCardProps) {
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<CustomIcon["position"] | null>(null);
  const [addingIcon, setAddingIcon] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<CustomIcon["position"]>("top_right");

  const useCustomIcons = customIcons.length > 0;

  // Get positions that are already used
  const usedPositions = customIcons.map(icon => icon.position);
  const availablePositions = positionOptions.filter(p => !usedPositions.includes(p.value as CustomIcon["position"]));

  const handleAddIcon = () => {
    if (availablePositions.length === 0) return;
    setAddingIcon(true);
    setSelectedPosition(availablePositions[0].value as CustomIcon["position"]);
  };

  const handlePositionConfirm = () => {
    setPendingPosition(selectedPosition);
    setImagePickerOpen(true);
    setAddingIcon(false);
  };

  const handleImageSelect = (url: string) => {
    if (pendingPosition && onCustomIconsChange) {
      const newIcons = [...customIcons, { position: pendingPosition, url }];
      onCustomIconsChange(newIcons);
      onIconTypeChange("custom");
    }
    setPendingPosition(null);
    setImagePickerOpen(false);
  };

  const handleRemoveIcon = (position: CustomIcon["position"]) => {
    if (onCustomIconsChange) {
      const newIcons = customIcons.filter(icon => icon.position !== position);
      onCustomIconsChange(newIcons);
      if (newIcons.length === 0) {
        onIconTypeChange("dog_cat");
      }
    }
  };

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
            {/* Show custom images only when added */}
            {customIcons.map((icon) => (
              <img 
                key={icon.position}
                src={icon.url} 
                alt={`${icon.position} icon`} 
                className={`absolute w-12 h-12 object-contain opacity-30 ${positionStyles[icon.position]}`}
              />
            ))}
            <div className="relative z-10 h-full flex flex-col items-center justify-center p-3 text-center">
              <p className="text-white text-sm font-bold drop-shadow-md">{title || "Flash Sale"}</p>
              <p className="text-white/90 text-xs mt-1 drop-shadow-md">{subtitle || "50% OFF"}</p>
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
          
          {/* Custom Icons Section */}
          {onCustomIconsChange && (
            <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
              <Label className="text-xs text-muted-foreground">Custom Images (from Files)</Label>
              
              {/* Display added icons */}
              {customIcons.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {customIcons.map((icon) => (
                    <div key={icon.position} className="flex items-center gap-2 p-2 rounded-lg border bg-background">
                      <img src={icon.url} alt={icon.position} className="w-10 h-10 object-contain rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium capitalize">{icon.position.replace("_", " ")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveIcon(icon.position)}
                        className="p-1 rounded-full hover:bg-destructive/10 text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Icon Flow */}
              {addingIcon ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedPosition}
                    onValueChange={(value) => setSelectedPosition(value as CustomIcon["position"])}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePositions.map((pos) => (
                        <SelectItem key={pos.value} value={pos.value}>
                          {pos.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="sm" onClick={handlePositionConfirm}>
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Select Image
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setAddingIcon(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                availablePositions.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleAddIcon}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Icon
                  </Button>
                )
              )}

              {customIcons.length === 4 && (
                <p className="text-xs text-muted-foreground text-center">All positions filled</p>
              )}
            </div>
          )}
          
        </div>
      </CardContent>

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onSelect={handleImageSelect}
      />
    </Card>
  );
}
