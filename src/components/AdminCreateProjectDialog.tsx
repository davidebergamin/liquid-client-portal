import { Plus } from "lucide-react";
import { createProject } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function AdminCreateProjectDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Nuovo progetto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">Crea cliente</DialogTitle>
          <DialogDescription>Genera un progetto e il link personale cliente.</DialogDescription>
        </DialogHeader>
        <form action={createProject} className="space-y-3">
          <Input name="name" placeholder="Nome cliente" required />
          <Input name="company_name" placeholder="Azienda" />
          <Input name="email" type="email" placeholder="Email" />
          <Input name="phone" placeholder="Telefono" />
          <Button type="submit" className="w-full">Crea progetto</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
