import { useAtomValue } from "jotai";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router";
import { Toaster } from "sonner";

import { LocalProviderStartupSync } from "@/components/a1/local-provider-startup-sync";
import { ModelDirectoryStartupSync } from "@/components/a1/model-directory-startup-sync";
import { ReactScan } from "@/components/a1/react-scan";
import { Spinner } from "@/components/ui/spinner";
import { MultiChatProvider } from "@/contexts/use-chat/chat-context";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import {
  initializeGoogleAnalytics,
  setGoogleAnalyticsEnabled,
  setGoogleAnalyticsUserId,
  trackGoogleAnalyticsPageView,
} from "@/lib/google-analytics";
import { analyticsIdentityAtom } from "@/lib/jotai/settings-atoms";
import ChatRoute from "@/routes/chat";
import IndexRoute from "@/routes/index";
import NotFoundRoute from "@/routes/not-found";
import OnboardingRoute from "@/routes/onboarding";
import SettingsRoute from "@/routes/settings";

const TestsRoute = lazy(() => import("@/routes/tests"));
const ChatStressTestRoute = lazy(() => import("@/routes/tests/chat-stress"));
const LocalDatabaseTestRoute = lazy(() => import("@/routes/tests/local-database"));
const NotificationsTestRoute = lazy(() => import("@/routes/tests/notifications"));

import { ReleaseNotesDialog } from "./components/a1/release-notes-dialog";
import { UpdateAvailableDialog } from "./components/a1/update-available-dialog";
import { DeepLinkHandler } from "./deep-link-handler";
import { KbdRegistry } from "./kbd-shortcuts";

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
      <ModelDirectoryStartupSync />
      <LocalProviderStartupSync />
      <KbdRegistry />
      <DeepLinkHandler />
      <ReleaseNotesDialog />
      <UpdateAvailableDialog />
      <ReactScan />
      <Toaster className="pointer-events-auto!" position="top-right" richColors closeButton />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<IndexRoute />} />
          <Route path="/chat" element={<ChatRoute />} />
          <Route path="/chat/:id" element={<ChatRoute />} />
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route path="/settings" element={<SettingsRoute />} />
          <Route
            element={
              <Suspense
                fallback={
                  <div className="flex h-svh items-center justify-center">
                    <Spinner className="text-muted-foreground size-8" />
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            }
          >
            <Route path="/tests" element={<TestsRoute />} />
            <Route path="/tests/chat-stress" element={<ChatStressTestRoute />} />
            <Route path="/tests/local-database" element={<LocalDatabaseTestRoute />} />
            <Route path="/tests/notifications" element={<NotificationsTestRoute />} />
          </Route>
          <Route path="*" element={<NotFoundRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
