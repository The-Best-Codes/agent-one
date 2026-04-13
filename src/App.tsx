import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Toaster } from "sonner";

import { MultiChatProvider } from "@/contexts/use-chat/chat-context";
import ChatRoute from "@/routes/chat";
import IndexRoute from "@/routes/index";
import NotFoundRoute from "@/routes/not-found";
import OnboardingRoute from "@/routes/onboarding";
import SettingsRoute from "@/routes/settings";
import TestsRoute from "@/routes/tests";
import NotificationsTestRoute from "@/routes/tests/notifications";

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

function App() {
  return (
    <BrowserRouter>
      <KbdRegistry />
      <DeepLinkHandler />
      <ReleaseNotesDialog />
      <UpdateAvailableDialog />
      <Toaster className="pointer-events-auto!" position="top-right" richColors closeButton />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<IndexRoute />} />
          <Route path="/chat" element={<ChatRoute />} />
          <Route path="/chat/:id" element={<ChatRoute />} />
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route path="/settings" element={<SettingsRoute />} />
          <Route path="/tests" element={<TestsRoute />} />
          <Route path="/tests/notifications" element={<NotificationsTestRoute />} />
          <Route path="*" element={<NotFoundRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
