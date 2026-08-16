import i18n from "@/lib/i18n";

interface UxErrorConfig {
  key: string;
  uxErrorKey: string;
  descriptionKey: string;
}

export const aiErrorMessages = new Set<UxErrorConfig>([
  {
    key: "Failed to fetch",
    uxErrorKey: "aiErrors.failedToConnect",
    descriptionKey: "aiErrors.failedToConnectDescription",
  },
  {
    key: "'Non-image file content parts' functionality not supported.",
    uxErrorKey: "aiErrors.onlyImageFiles",
    descriptionKey: "aiErrors.onlyImageFilesDescription",
  },
  {
    key: "Unauthorized",
    uxErrorKey: "aiErrors.unauthorized",
    descriptionKey: "aiErrors.unauthorizedDescription",
  },
  {
    key: "API key not valid. Please pass a valid API key.",
    uxErrorKey: "aiErrors.invalidApiKey",
    descriptionKey: "aiErrors.invalidApiKeyDescription",
  },
  {
    key: "Invalid API Key",
    uxErrorKey: "aiErrors.invalidApiKey",
    descriptionKey: "aiErrors.invalidApiKeyDescription",
  },
]);

/**
 * Parses a raw error message and returns a user-friendly message and description if available.
 * If no specific UX error is found, it returns the raw message (or a default) and null description.
 * @param rawErrorMessage The raw error message string from the AI API or system.
 * @returns An object with a user-friendly `message` and an optional `description`.
 */
export const getAiErrorMessageUx = (
  rawErrorMessage: string | undefined | null,
): { message: string | null; description: string | null } => {
  const defaultMessage = i18n.t("aiErrors.unknown");
  const actualErrorMessage = rawErrorMessage?.trim() || "";

  if (!actualErrorMessage) {
    return {
      message: null,
      description: defaultMessage,
    };
  }

  for (const config of aiErrorMessages) {
    if (actualErrorMessage.toLowerCase().includes(config.key.toLowerCase())) {
      return {
        message: i18n.t(config.uxErrorKey),
        description: i18n.t(config.descriptionKey),
      };
    }
  }

  return {
    message: null,
    description: actualErrorMessage,
  };
};
