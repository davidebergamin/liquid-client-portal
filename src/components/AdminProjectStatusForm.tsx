"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdminProjectStatusForm({
  projectId,
  status,
  statusOptions,
  action,
}: {
  projectId: string;
  status: string;
  statusOptions: Array<{ value: string; label: string }>;
  action: (formData: FormData) => Promise<void>;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);

  return (
    <form action={action} className="flex min-w-[190px] items-center gap-2">
      <input type="hidden" name="id" value={projectId} />
      <input type="hidden" name="status" value={currentStatus} />
      <Select value={currentStatus} onValueChange={setCurrentStatus}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" variant="outline">
        Salva
      </Button>
    </form>
  );
}
