import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import LoadingScreen from "../components/common/LoadingScreen";
import ProtectedRoute from "../components/common/ProtectedRoute";
import DashboardLayout from "../components/layout/DashboardLayout";

// Lazy loaded pages
const LandingPage = lazy(() => import("../pages/landing/LandingPage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const DashboardHome = lazy(() => import("../pages/dashboard/DashboardHome"));
const InterviewsPage = lazy(() => import("../pages/dashboard/InterviewsPage"));
const AnalyticsPage = lazy(() => import("../pages/dashboard/AnalyticsPage"));
const ProfilePage = lazy(() => import("../pages/dashboard/ProfilePage"));
const SettingsPage = lazy(() => import("../pages/dashboard/SettingsPage"));
const CandidatesPage = lazy(() => import("../pages/dashboard/CandidatesPage"));
const InterviewRoom = lazy(() => import("../pages/interview/InterviewRoom"));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <SuspenseWrapper>
        <LandingPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: "/login",
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: "/register",
    element: (
      <SuspenseWrapper>
        <RegisterPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <DashboardHome />
              </SuspenseWrapper>
            ),
          },
          {
            path: "interviews",
            element: (
              <SuspenseWrapper>
                <InterviewsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "analytics",
            element: (
              <SuspenseWrapper>
                <AnalyticsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "candidates",
            element: (
              <SuspenseWrapper>
                <CandidatesPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "feedback",
            element: (
              <SuspenseWrapper>
                <AnalyticsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "users",
            element: (
              <SuspenseWrapper>
                <InterviewsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "settings",
            element: (
              <SuspenseWrapper>
                <SettingsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "profile",
            element: (
              <SuspenseWrapper>
                <ProfilePage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
    ],
  },
  // Full-screen rooms: authenticated, but outside the dashboard chrome.
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/interview/:meetingId",
        element: (
          <SuspenseWrapper>
            <InterviewRoom />
          </SuspenseWrapper>
        ),
      },
      {
        path: "/dashboard/practice",
        element: (
          <SuspenseWrapper>
            <InterviewRoom />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
