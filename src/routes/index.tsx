import React, { lazy } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import ComprehensiveErrorBoundary from '@/shared/components/common/ComprehensiveErrorBoundary';
import RouteError from '@/shared/components/common/RouteError';
import { TooltipProvider } from '@/shared/components/ui/tooltip';

// Lazy load route components
const MainLayout = lazy(() => import('@/shared/components/layout/MainLayout'));
const TwitchCallback = lazy(() => import('@/features/auth/TwitchCallback'));
const NotFound = lazy(() => import('@/shared/components/common/NotFound'));

const RootLayout: React.FC = () => {
    return (
        <ComprehensiveErrorBoundary>
            <TooltipProvider>
                <Outlet />
            </TooltipProvider>
        </ComprehensiveErrorBoundary>
    );
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        errorElement: <RouteError />,
        children: [
            {
                index: true,
                element: <MainLayout />
            },
            {
                path: 'auth/twitch/callback',
                element: <TwitchCallback />
            },
            {
                path: '*',
                element: <NotFound />
            }
        ]
    }
]);

export const AppRouter: React.FC = () => {
    return <RouterProvider router={router} />;
};
