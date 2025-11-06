import { TrainingForm } from "@/modules/training/ui/components/training-form";

export function TrainingView() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Training</h1>
        <p className="text-muted-foreground">Create a new training template.</p>
      </div>
      <TrainingForm />
    </div>
  );
}


