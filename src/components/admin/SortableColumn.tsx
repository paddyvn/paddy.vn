import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NavigationColumn, NavigationItem } from "@/hooks/useNavigationMenus";
import { SortableItem } from "./SortableItem";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface SortableColumnProps {
  column: NavigationColumn;
  onEditColumn: (column: NavigationColumn) => void;
  onDeleteColumn: (columnId: string) => void;
  onEditItem: (item: NavigationItem) => void;
  onDeleteItem: (itemId: string, columnId: string) => void;
  onAddItem: (columnId: string) => void;
  onItemsReorder: (columnId: string, items: NavigationItem[]) => void;
}

export function SortableColumn({
  column,
  onEditColumn,
  onDeleteColumn,
  onEditItem,
  onDeleteItem,
  onAddItem,
  onItemsReorder,
}: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = column.items.findIndex((i) => i.id === active.id);
      const newIndex = column.items.findIndex((i) => i.id === over.id);
      
      const newItems = [...column.items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      
      onItemsReorder(column.id, newItems);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible defaultOpen>
        <div className="border rounded-lg">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing touch-none"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{column.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {column.items.length} items
                    {column.shop_all_link && ` · Shop all: ${column.shop_all_link}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditColumn(column);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteColumn(column.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t p-4 space-y-2 bg-muted/20">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleItemDragEnd}
              >
                <SortableContext
                  items={column.items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {column.items.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onEdit={onEditItem}
                      onDelete={(id) => onDeleteItem(id, column.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => onAddItem(column.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add item
              </Button>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
