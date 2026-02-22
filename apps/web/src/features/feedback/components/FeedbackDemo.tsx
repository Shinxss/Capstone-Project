import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useConfirm } from "@/features/feedback/hooks/useConfirm";
import { toastInfo, toastSuccess } from "@/services/feedback/toast.service";

export default function FeedbackDemo() {
  const confirm = useConfirm();
  const [dialogOpen, setDialogOpen] = useState(false);

  const runConfirm = async () => {
    const ok = await confirm({
      title: "Approve this action?",
      description: "This demonstrates the global confirmation dialog.",
      confirmText: "Approve",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (ok) {
      toastSuccess("Confirmed");
      return;
    }

    toastInfo("Cancelled");
  };

  return (
    <section className="mt-6 rounded-lg border border-dashed border-border p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Feedback demo</h2>

      <Alert>
        <AlertTitle>Inline alert</AlertTitle>
        <AlertDescription>This is a persistent alert rendered with the shared UI kit.</AlertDescription>
      </Alert>

      <div className="mt-4 flex flex-wrap gap-2">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>General dialog</DialogTitle>
              <DialogDescription>This modal uses the shared dialog primitive.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="destructive" onClick={runConfirm}>
          Trigger confirm + toast
        </Button>
      </div>
    </section>
  );
}
