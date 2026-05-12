import ReactGA from "react-ga4";

import { getLogger } from "@/lib/logger";

const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-Z7HCYBLX8N";

type GoogleAnalyticsPrimitive = string | number | boolean;

export type GoogleAnalyticsEventParams = Record<
  string,
  GoogleAnalyticsPrimitive | null | undefined
>;

const logger = getLogger(import.meta.url);

let googleAnalyticsInitialized = false;

function normalizeGoogleAnalyticsParams(params?: GoogleAnalyticsEventParams) {
  if (!params) {
    return undefined;
  }

  const normalizedEntries = Object.entries(params).flatMap(([key, value]) => {
    if (value == null) {
      return [];
    }

    return [[key, typeof value === "boolean" ? String(value) : value] as const];
  });

  return normalizedEntries.length > 0 ? Object.fromEntries(normalizedEntries) : undefined;
}

export function initializeGoogleAnalytics() {
  if (typeof window === "undefined" || googleAnalyticsInitialized) {
    return;
  }

  googleAnalyticsInitialized = true;
  ReactGA.initialize(GOOGLE_ANALYTICS_MEASUREMENT_ID, {
    gaOptions: {
      anonymize_ip: true,
    },
    gtagOptions: {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: false,
      app_name: "AgentOne",
    },
  });
}

export function trackGoogleAnalyticsEvent(event: string, params?: GoogleAnalyticsEventParams) {
  if (typeof window === "undefined") {
    return;
  }

  initializeGoogleAnalytics();
  const normalizedParams = normalizeGoogleAnalyticsParams(params);
  logger.verbose("Sending Google Analytics event", {
    event,
    params: normalizedParams,
  });

  if (normalizedParams) {
    ReactGA.event(event, normalizedParams);
    return;
  }

  ReactGA.event(event);
}

export function trackGoogleAnalyticsPageView(pagePath: string, pageTitle = document.title) {
  if (typeof window === "undefined") {
    return;
  }

  initializeGoogleAnalytics();
  logger.verbose("Sending Google Analytics page view", {
    pagePath,
    pageTitle,
  });

  ReactGA.send({
    hitType: "pageview",
    page: pagePath,
    title: pageTitle,
  });
}

export function setGoogleAnalyticsUserId(userId: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  initializeGoogleAnalytics();
  logger.verbose("Updating Google Analytics user_id", {
    hasUserId: Boolean(userId),
  });
  ReactGA.gtag("set", { user_id: userId });
}

export type ButtonAnalytics = {
  event: string;
  params?: GoogleAnalyticsEventParams;
};

export function trackSettingsInteraction(
  section: string,
  control: string,
  params?: GoogleAnalyticsEventParams,
) {
  trackGoogleAnalyticsEvent("settings_interaction", {
    section,
    control,
    ...params,
  });
}
