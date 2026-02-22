import type { ComponentProps } from "react";
import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = ComponentProps<typeof SonnerToaster>;

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      richColors
      position="top-right"
      duration={5000}
      toastOptions={{
        classNames: {
          toast: "min-h-14 px-4 py-3 text-base",
          title: "text-[15px] font-semibold",
          description: "text-sm",
        },
      }}
      {...props}
    />
  );
}
