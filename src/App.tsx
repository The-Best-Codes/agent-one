import { BrowserRouter, Outlet, Route, Routes } from "react-router";

import { MultiChatProvider } from "@/contexts/use-chat/chat-context";
import ChatRoute from "@/routes/chat";
import IndexRoute from "@/routes/index";
import OnboardingRoute from "@/routes/onboarding";
import SettingsRoute from "@/routes/settings";
import TestsRoute from "@/routes/tests";
import FnmTestRoute from "@/routes/tests/fnm";
import NotificationsTestRoute from "@/routes/tests/notifications";
import SplashTestRoute from "@/routes/tests/splash";

import { KbdRegistry } from "./kbd-shortcuts";
import NotFoundRoute from "./routes/not-found";

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
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<IndexRoute />} />
          <Route path="/chat" element={<ChatRoute />} />
          <Route path="/chat/:id" element={<ChatRoute />} />
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route path="/settings" element={<SettingsRoute />} />
          <Route path="/tests" element={<TestsRoute />} />
          <Route path="/tests/fnm" element={<FnmTestRoute />} />
          <Route
            path="/tests/notifications"
            element={<NotificationsTestRoute />}
          />
          <Route path="/tests/splash" element={<SplashTestRoute />} />
          <Route path="*" element={<NotFoundRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
