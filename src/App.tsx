import { lazy, Suspense } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Toaster } from "sonner";

import { LocalProviderStartupSync } from "@/components/a1/local-provider-startup-sync";
import { ModelDirectoryStartupSync } from "@/components/a1/model-directory-startup-sync";
import { ReactScan } from "@/components/a1/react-scan";
import { Spinner } from "@/components/ui/spinner";
import { MultiChatProvider } from "@/contexts/use-chat/chat-context";
import ChatRoute from "@/routes/chat";
import ExtensionsRoute from "@/routes/extensions";
import IndexRoute from "@/routes/index";
import NotFoundRoute from "@/routes/not-found";
import OnboardingRoute from "@/routes/onboarding";
import ScheduledAgentsRoute from "@/routes/scheduled-agents";
import SettingsRoute from "@/routes/settings";

const TestsRoute = lazy(() => import("@/routes/tests"));
const CronsTestRoute = lazy(() => import("@/routes/tests/crons"));
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
      <DeepLinkHandler />
      {/* This essentially lets MultiChatProvider wrap all the <Route> components while being a child of <Routes> */}
      <Outlet />
    </MultiChatProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ModelDirectoryStartupSync />
      <LocalProviderStartupSync />
      <KbdRegistry />
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
          <Route path="/extensions" element={<ExtensionsRoute />} />
          <Route path="/settings" element={<SettingsRoute />} />
          <Route path="/scheduled-agents" element={<ScheduledAgentsRoute />} />
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
            <Route path="/tests/crons" element={<CronsTestRoute />} />
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
