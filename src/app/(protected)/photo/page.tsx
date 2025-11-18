import { PhotoForm } from "@/modules/photo/components/ui/photo-form";

export default async function PhotoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Photos</h1>
        <p className="text-muted-foreground">
          Upload progress photos with date and weight.
        </p>
      </div>

      <div className="max-w-xl">
        <PhotoForm />
      </div>
    </div>
  );
}
