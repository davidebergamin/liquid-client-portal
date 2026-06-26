"use client";

import { useCallback } from "react";
import { useAutosave } from "@/hooks/use-autosave";
import { Textarea } from "@/components/ui/textarea";
import type { PortalActions } from "../types";
import { toFormData } from "./utils";

export function BriefAutosave({ slug, brief, action }: { slug: string; brief: any; action: PortalActions["updateBrief"] }) {
  const save = useCallback(async (values: Record<string, string>) => { await action(toFormData({ slug, ...values })); }, [action, slug]);
  const form = useAutosave<Record<string, string>>({
    initialValues: {
      free_notes: brief?.free_notes || brief?.business_description || "",
    },
    onSave: save,
  });
  return (
    <div>
      <p className="text-sm font-medium text-primary">Brief</p>
      <h3 className="mt-0.5 font-display text-2xl sm:text-3xl">Raccontaci il progetto</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Scrivi liberamente: chi sei, cosa fai, a chi ti rivolgi e qualsiasi cosa possa aiutarci a costruire il sito perfetto.
      </p>
      <Textarea
        className="mt-4 min-h-[180px] resize-none text-base sm:text-sm"
        value={form.values.free_notes}
        placeholder="Es: sono un fotografo specializzato in matrimoni nel nord Italia, il mio target sono coppie tra 25 e 40 anni, voglio trasmettere eleganza e professionalità..."
        rows={8}
        onChange={(e) => form.setField("free_notes", e.target.value)}
      />
    </div>
  );
}
