import React from 'react';

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="flex flex-col items-center justify-center h-screen space-y-4">
    <h2 className="text-xl font-bold">Something went wrong</h2>
    <p className="text-muted-foreground">{error.message}</p>
    <button onClick={resetErrorBoundary} className="px-4 py-2 bg-primary text-primary-foreground rounded">
      Try again
    </button>
  </div>
);

export default ErrorFallback;