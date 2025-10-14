import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import useUiStore from '@/store/uiStore';

const ConfirmationDialog: React.FC = () => {
  const { confirmationDialog, hideConfirmation } = useUiStore();
  const { isOpen, title, description, onConfirm } = confirmationDialog;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={hideConfirmation}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p>{description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={hideConfirmation}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
