import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="container flex min-h-[40dvh] items-center justify-center py-20">
      <Loader2
        className="h-8 w-8 animate-spin text-muted-foreground"
        aria-label="loading"
      />
    </div>
  );
}
