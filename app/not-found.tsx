import Link from "next/link";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Plane className="h-8 w-8" />
      </div>
      <div>
        <h1 className="font-display text-4xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">This route doesn&apos;t exist.</p>
      </div>
      <Link href="/">
        <Button className="rounded-full px-8">Back to home</Button>
      </Link>
    </div>
  );
}
