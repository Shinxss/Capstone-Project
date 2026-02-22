import { useCallback, useState } from "react";

export function useReportPill(initialVisible = false) {
  const [visible, setVisible] = useState(initialVisible);

  const show = useCallback(() => {
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const toggle = useCallback(() => {
    setVisible((current) => !current);
  }, []);

  return { visible, show, hide, toggle };
}
