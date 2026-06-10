import { useAtomValue } from "jotai";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router";
import { Toaster } from "sonner";

import { LocalProviderStartupSync } from "@/components/a1/local-provider-startup-sync";
import { MultiChatProvider } from "@/contexts/use-chat/chat-context";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import {
  initializeGoogleAnalytics,
  setGoogleAnalyticsEnabled,
  setGoogleAnalyticsUserId,
  trackGoogleAnalyticsPageView,
} from "@/lib/google-analytics";
import { analyticsIdentityAtom } from "@/lib/jotai/settings-atoms";
import SuspenseFallback from "@/routes/suspense-fallback";

import { ReleaseNotesDialog } from "./components/a1/release-notes-dialog";
import { UpdateAvailableDialog } from "./components/a1/update-available-dialog";
import { DeepLinkHandler } from "./deep-link-handler";
import { KbdRegistry } from "./kbd-shortcuts";

const ChatRoute = lazy(() => import("@/routes/chat"));
const IndexRoute = lazy(() => import("@/routes/index"));
const NotFoundRoute = lazy(() => import("@/routes/not-found"));
const OnboardingRoute = lazy(() => import("@/routes/onboarding"));
const SettingsRoute = lazy(() => import("@/routes/settings"));
const TestsRoute = lazy(() => import("@/routes/tests"));
const ChatStressTestRoute = lazy(() => import("@/routes/tests/chat-stress"));
const LocalDatabaseTestRoute = lazy(() => import("@/routes/tests/local-database"));
const NotificationsTestRoute = lazy(() => import("@/routes/tests/notifications"));

function AppLayout() {
  return (
    <MultiChatProvider>
      {/* This essentially lets MultiChatProvider wrap all the <Route> components while being a child of <Routes> */}
      <Outlet />
    </MultiChatProvider>
  );
}

function GoogleAnalyticsTracker() {
  const location = useLocation();
  const analyticsIdentity = useAtomValue(analyticsIdentityAtom);
  const { user } = useWebAuth();

  useEffect(() => {
    setGoogleAnalyticsEnabled(analyticsIdentity !== "off");

    if (analyticsIdentity !== "off") {
      initializeGoogleAnalytics();
    }
  }, [analyticsIdentity]);

  useEffect(() => {
    setGoogleAnalyticsUserId(analyticsIdentity === "user-id" ? (user?.id ?? null) : null);
  }, [analyticsIdentity, user?.id]);

  useEffect(() => {
    trackGoogleAnalyticsPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <GoogleAnalyticsTracker />
      <LocalProviderStartupSync />
      <KbdRegistry />
      <DeepLinkHandler />
      <ReleaseNotesDialog />
      <UpdateAvailableDialog />
      <Toaster className="pointer-events-auto!" position="top-right" richColors closeButton />
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<IndexRoute />} />
            <Route path="/chat" element={<ChatRoute />} />
            <Route path="/chat/:id" element={<ChatRoute />} />
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route path="/settings" element={<SettingsRoute />} />
            <Route path="/tests" element={<TestsRoute />} />
            <Route path="/tests/chat-stress" element={<ChatStressTestRoute />} />
            <Route path="/tests/local-database" element={<LocalDatabaseTestRoute />} />
            <Route path="/tests/notifications" element={<NotificationsTestRoute />} />
            <Route path="*" element={<NotFoundRoute />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
