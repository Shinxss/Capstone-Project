import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  contentClassName?: string;
}

type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState(null);
  }, []);

  const confirm = useCallback<ConfirmFunction>((options) => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }

    setState({
      ...options,
      open: true,
      confirmText: options.confirmText ?? "Confirm",
      cancelText: options.cancelText ?? "Cancel",
      variant: options.variant ?? "default",
    });

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AlertDialog
        open={Boolean(state?.open)}
        onOpenChange={(open) => {
          if (!open) {
            close(false);
          }
        }}
      >
        <AlertDialogContent className={state?.contentClassName}>
          <AlertDialogHeader>
            <AlertDialogTitle>{state?.title}</AlertDialogTitle>
            {state?.description ? <AlertDialogDescription>{state.description}</AlertDialogDescription> : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild className="border-0 bg-transparent p-0 shadow-none hover:bg-transparent">
              <Button variant="outline" className="min-w-24" onClick={() => close(false)}>
                {state?.cancelText}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild className="border-0 bg-transparent p-0 shadow-none hover:bg-transparent">
              <Button
                variant={state?.variant === "destructive" ? "destructive" : "default"}
                className={state?.variant === "destructive" ? "min-w-24 bg-red-600 text-white hover:bg-red-700" : "min-w-24 bg-blue-600 text-white hover:bg-blue-700"}
                onClick={() => close(true)}
              >
                {state?.confirmText}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }

  return context;
}
