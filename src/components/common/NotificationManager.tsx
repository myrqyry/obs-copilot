import React, { useEffect } from 'react';
import { useAppStore, Notification, NotificationType } from '../../store/appStore';
import { XCircleIcon, CheckCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon className="h-6 w-6 text-green-400" aria-hidden="true" />;
    case 'error':
      return <XCircleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />;
    case 'warning':
      return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" aria-hidden="true" />;
    case 'info':
    default:
      return <InformationCircleIcon className="h-6 w-6 text-blue-400" aria-hidden="true" />;
  }
};

const getTitleColor = (type: NotificationType) => {
  switch (type) {
    case 'success': return 'text-green-500';
    case 'error': return 'text-red-500';
    case 'warning': return 'text-yellow-500';
    case 'info':
    default: return 'text-blue-500';
  }
};


const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const removeNotification = useAppStore((state) => state.actions.removeNotification);
  const defaultDuration = 5000; // 5 seconds

  useEffect(() => {
    const timer = setTimeout(() => {
      removeNotification(notification.id);
    }, notification.duration || defaultDuration);
    return () => clearTimeout(timer);
  }, [notification, removeNotification]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="mb-4 w-full max-w-sm overflow-hidden rounded-lg bg-background-card shadow-lg ring-1 ring-black ring-opacity-5 pointer-events-auto"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${getTitleColor(notification.type)}`}>
              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
            </p>
            <p className="mt-1 text-sm text-text-primary">
              {notification.message}
            </p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md bg-background-card text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-mauve focus:ring-offset-2"
              onClick={() => removeNotification(notification.id)}
            >
              <span className="sr-only">Close</span>
              <XCircleIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const NotificationManager: React.FC = () => {
  const notifications = useAppStore((state) => state.notifications);

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 flex flex-col items-end justify-start px-4 py-6 sm:p-6 z-50 mt-12 space-y-4" // Added mt-12 for top margin
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationManager;
