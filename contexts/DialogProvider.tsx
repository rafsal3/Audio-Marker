import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import Dialog, { DialogType } from '../components/Dialog';

interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface DialogContextType {
  alert: (options: DialogOptions) => void;
  confirm: (options: DialogOptions) => Promise<boolean>;
  warning: (options: DialogOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

interface DialogState extends DialogOptions {
  isOpen: boolean;
  type: DialogType;
  resolve: (value: boolean) => void;
}

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const alert = useCallback(({ title, message, confirmText }: DialogOptions) => {
    setDialogState({
      isOpen: true,
      type: 'alert',
      title,
      message,
      confirmText,
      resolve: () => {}, // No-op for alert
    });
  }, []);
  
  const confirm = useCallback(({ title, message, confirmText, cancelText }: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        resolve,
      });
    });
  }, []);

  const warning = useCallback(({ title, message, confirmText, cancelText }: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        isOpen: true,
        type: 'warning',
        title,
        message,
        confirmText,
        cancelText,
        resolve,
      });
    });
  }, []);


  const handleConfirm = () => {
    if (dialogState) {
      dialogState.resolve(true);
      setDialogState(null);
    }
  };

  const handleCancel = () => {
    if (dialogState) {
      dialogState.resolve(false);
      setDialogState(null);
    }
  };

  return (
    <DialogContext.Provider value={{ alert, confirm, warning }}>
      {children}
      {dialogState && dialogState.isOpen && (
        <Dialog
          isOpen={dialogState.isOpen}
          type={dialogState.type}
          title={dialogState.title}
          message={dialogState.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
        />
      )}
    </DialogContext.Provider>
  );
};
