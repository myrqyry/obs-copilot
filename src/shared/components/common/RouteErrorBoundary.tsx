import React from 'react';
import { useRouteError } from 'react-router-dom';

const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold text-destructive mb-4">Oops!</h1>
      <p className="text-lg mb-2">Sorry, an unexpected error has occurred.</p>
      <p className="text-muted-foreground">
        <i>{(error as Error)?.message || (error as any)?.statusText}</i>
      </p>
    </div>
  );
};

export default RouteErrorBoundary;
