import React, { useEffect } from 'react';
import { useErrorStore, AppError } from '@/store/errorStore';
import { toast } from '@/components/ui/toast';

const GlobalErrorDisplay: React.FC = () => {
  const { errors, dismissError } = useErrorStore();

  useEffect(() => {
    errors.filter(error => !error.isDismissed).forEach((error: AppError) => {
      toast({
        id: error.id,
        title: error.source ? `${error.source} Error` : 'Application Error',
        description: error.message,
        variant: error.level === 'critical' || error.level === 'error' ? 'destructive' : 'default',
        duration: error.level === 'critical' ? Infinity : 5000,
        action: {
          label: 'Dismiss',
          onClick: () => dismissError(error.id),
        },
      });
      // Mark as dismissed immediately after showing toast to prevent re-showing
      dismissError(error.id);
    });
  }, [errors, dismissError]);

  return null; // This component doesn't render anything directly
};

export default GlobalErrorDisplay;
