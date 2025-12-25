import { useState, useEffect } from "react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface OrderColumn {
  id: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

const DEFAULT_COLUMNS: OrderColumn[] = [
  { id: "order_number", label: "Order", visible: true, required: true },
  { id: "created_at", label: "Date", visible: true },
  { id: "customer", label: "Customer", visible: true },
  { id: "customer_email", label: "Email", visible: false },
  { id: "customer_phone", label: "Phone", visible: false },
  { id: "items", label: "Items", visible: true },
  { id: "total", label: "Total", visible: true },
  { id: "payment", label: "Payment", visible: true },
  { id: "status", label: "Status", visible: true },
  { id: "delivery_method", label: "Delivery method", visible: true },
  { id: "source", label: "Source", visible: false },
  { id: "tags", label: "Tags", visible: false },
  { id: "notes", label: "Notes", visible: false },
  { id: "currency", label: "Currency", visible: false },
  { id: "actions", label: "Actions", visible: true, required: true },
];

const STORAGE_KEY = "order-columns-config";

function SortableColumnItem({
  column,
  onToggle,
}: {
  column: OrderColumn;
  onToggle: (id: string) => void;
}) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-muted/50"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <Checkbox
        id={column.id}
        checked={column.visible}
        onCheckedChange={() => onToggle(column.id)}
        disabled={column.required}
      />
      <label
        htmlFor={column.id}
        className={`text-sm flex-1 cursor-pointer ${
          column.required ? "text-muted-foreground" : ""
        }`}
      >
        {column.label}
      </label>
    </div>
  );
}

interface OrderColumnsSelectorProps {
  columns: OrderColumn[];
  onColumnsChange: (columns: OrderColumn[]) => void;
}

export function OrderColumnsSelector({
  columns,
  onColumnsChange,
}: OrderColumnsSelectorProps) {
  const [open, setOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over.id);
      const newColumns = arrayMove(columns, oldIndex, newIndex);
      onColumnsChange(newColumns);
    }
  };

  const handleToggle = (id: string) => {
    const newColumns = columns.map((col) =>
      col.id === id ? { ...col, visible: !col.visible } : col
    );
    onColumnsChange(newColumns);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Columns3 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="text-sm font-medium mb-2 px-1">Edit columns</div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {columns.map((column) => (
                <SortableColumnItem
                  key={column.id}
                  column={column}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </PopoverContent>
    </Popover>
  );
}

export function useOrderColumns() {
  const [columns, setColumns] = useState<OrderColumn[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as OrderColumn[];
        // Merge with defaults to handle new columns
        const mergedColumns = DEFAULT_COLUMNS.map((defaultCol) => {
          const savedCol = parsed.find((c) => c.id === defaultCol.id);
          return savedCol ? { ...defaultCol, visible: savedCol.visible } : defaultCol;
        });
        // Reorder based on saved order
        const orderedColumns: OrderColumn[] = [];
        parsed.forEach((savedCol) => {
          const col = mergedColumns.find((c) => c.id === savedCol.id);
          if (col) orderedColumns.push(col);
        });
        // Add any new columns that weren't in saved
        mergedColumns.forEach((col) => {
          if (!orderedColumns.find((c) => c.id === col.id)) {
            orderedColumns.push(col);
          }
        });
        return orderedColumns;
      } catch {
        return DEFAULT_COLUMNS;
      }
    }
    return DEFAULT_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  const isColumnVisible = (id: string) => {
    const col = columns.find((c) => c.id === id);
    return col ? col.visible : true;
  };

  const visibleColumns = columns.filter((c) => c.visible);

  return { columns, setColumns, isColumnVisible, visibleColumns };
}
