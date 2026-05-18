import { useState, useCallback } from 'react';

type DialogOptions = {
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  message?: string;
  defaultValue?: string;
};

export function useDialog() {
  const [dialogConfig, setDialogConfig] = useState<(DialogOptions & {
    isOpen: boolean;
    onConfirm: (val?: string) => void;
    onCancel: () => void;
  }) | null>(null);

  const showDialog = useCallback((options: DialogOptions): Promise<string | boolean> => {
    return new Promise((resolve) => {
      setDialogConfig({
        ...options,
        isOpen: true,
        onConfirm: (val?: string) => {
          setDialogConfig(null);
          if (options.type === 'prompt') {
            resolve(val || '');
          } else {
            resolve(true);
          }
        },
        onCancel: () => {
          setDialogConfig(null);
          if (options.type === 'prompt') {
            resolve('');
          } else {
            resolve(false);
          }
        }
      });
    });
  }, []);

  return { dialogConfig, showDialog };
}
