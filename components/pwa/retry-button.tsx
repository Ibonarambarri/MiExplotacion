"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryButton() {
  return (
    <Button type="button" size="lg" className="w-full" onClick={() => window.location.reload()}>
      <RotateCw className="h-5 w-5" aria-hidden />
      Reintentar
    </Button>
  );
}
