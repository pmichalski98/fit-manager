import { Spinner } from "@/components/ui/spinner";

export default function TrainingSessionLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-10">
      <Spinner className="h-8 w-8" />
      <div className="space-y-1 text-center">
        <p className="text-lg font-semibold">We are loading your training</p>
        <p className="text-muted-foreground text-sm">
          We are loading your training info and your previous training session
          details.
        </p>
      </div>
    </div>
  );
}
