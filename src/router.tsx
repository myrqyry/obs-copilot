import React, { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const App = lazy(() => import('./App'));
const TwitchCallback = lazy(() => import('@/features/auth/TwitchCallback'));

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
    },
    {
        path: '/auth/twitch/callback',
        element: <TwitchCallback />,
    },
]);

export const AppRouter: React.FC = () => {
    return <RouterProvider router={router} />;
};
