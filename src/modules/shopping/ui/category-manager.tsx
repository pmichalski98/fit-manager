"use client";

import { useState } from "react";
import {
  GripVerticalIcon,
  Trash2Icon,
  PencilIcon,
  PlusIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createShoppingCategory,
  updateShoppingCategory,
  deleteShoppingCategory,
  reorderShoppingCategories,
} from "../actions";
import type { ShoppingCategory } from "@/server/db/schema";

type Props = {
  initialCategories: ShoppingCategory[];
};

function SortableCategory({
  category,
  onRename,
  onDelete,
}: {
  category: ShoppingCategory;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editName.trim()) {
      onRename(category.id, editName.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border p-2"
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="h-4 w-4" />
      </button>

      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="flex flex-1 items-center gap-1"
        >
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-7 text-sm"
            autoFocus
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              setIsEditing(false);
              setEditName(category.name);
            }}
          >
            <XIcon className="h-3.5 w-3.5" />
          </Button>
        </form>
      ) : (
        <>
          <span className="flex-1 text-sm">{category.name}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsEditing(true)}
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(category.id)}
          >
            <Trash2Icon className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

export function CategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] =
    useState<ShoppingCategory[]>(initialCategories);
  const [newName, setNewName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);

    await reorderShoppingCategories(reordered.map((c) => c.id));
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const result = await createShoppingCategory(newName.trim());
    if (result.ok) {
      setCategories([...categories, result.data]);
      setNewName("");
    } else {
      toast.error(result.error);
    }
  };

  const handleRename = async (id: string, name: string) => {
    const result = await updateShoppingCategory(id, name);
    if (result.ok) {
      setCategories(
        categories.map((c) => (c.id === id ? { ...c, name } : c)),
      );
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Products in this category will become uncategorized.")) return;

    const result = await deleteShoppingCategory(id);
    if (result.ok) {
      setCategories(categories.filter((c) => c.id !== id));
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
        className="flex gap-2"
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name..."
          className="h-9"
        />
        <Button type="submit" size="sm" disabled={!newName.trim()}>
          <PlusIcon className="mr-1 h-4 w-4" />
          Add
        </Button>
      </form>
    </div>
  );
}
