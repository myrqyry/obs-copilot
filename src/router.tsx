import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import RouteErrorBoundary from '@/shared/components/common/RouteErrorBoundary';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';

// Lazy load route components
const App = lazy(() => import('./App'));
const TwitchCallback = lazy(() => import('@/features/auth/TwitchCallback'));

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingSpinner fullscreen />}>
        <App />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/auth/twitch/callback',
    element: (
      <Suspense fallback={<LoadingSpinner fullscreen />}>
        <TwitchCallback />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
