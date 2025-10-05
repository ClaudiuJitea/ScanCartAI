import { useCallback, useState } from "react";
import { DialogConfig } from "../types/Dialog";

export const useThemedDialog = () => {
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);

  const showDialog = useCallback((config: DialogConfig) => {
    setDialogConfig(config);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogConfig(null);
  }, []);

  return { dialogConfig, showDialog, closeDialog };
};
