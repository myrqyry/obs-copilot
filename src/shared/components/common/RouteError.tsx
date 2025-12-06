import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

const RouteError: React.FC = () => {
    const error = useRouteError();
    let errorMessage: string;

    if (isRouteErrorResponse(error)) {
        // error is type `ErrorResponse`
        errorMessage = error.statusText || error.data?.message || 'Unknown error';
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    } else {
        console.error(error);
        errorMessage = 'Unknown error';
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4 text-center">
            <h1 className="text-4xl font-bold mb-4 text-destructive">Oops!</h1>
            <p className="text-xl mb-4">Sorry, an unexpected error has occurred.</p>
            <p className="text-muted-foreground mb-8">
                <i>{errorMessage}</i>
            </p>
            <Link 
                to="/" 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
                Go Home
            </Link>
        </div>
    );
};

export default RouteError;
