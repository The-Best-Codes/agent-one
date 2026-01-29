interface UxErrorConfig {
  key: string;
  uxError: string;
  description: string;
}

export const aiErrorMessages = new Set<UxErrorConfig>([
  {
    key: "Failed to fetch",
    uxError: "Failed to connect to AI model",
    description:
      "AgentOne couldn't connect to the provider of the AI model you've chosen. Try a different model and check your internet connection.",
  },
  {
    key: "'Non-image file content parts' functionality not supported.",
    uxError: "Only image files are supported by this model",
    description:
      "The AI model you've chosen does not support non-image files. Please choose a different model or file type.",
  },
  {
    key: "Unauthorized",
    uxError: "Unauthorized access to AI model",
    description:
      "AgentOne couldn't authenticate with the provider of the AI model you've chosen. Have you configured the correct API key for it in settings?",
  },
  {
    key: "API key not valid. Please pass a valid API key.",
    uxError: "Invalid API key",
    description:
      "AgentOne couldn't authenticate with the provider of the AI model you've chosen. Have you configured the correct API key for it in settings?",
  },
  {
    key: "Invalid API Key",
    uxError: "Invalid API key",
    description:
      "AgentOne couldn't authenticate with the provider of the AI model you've chosen. Have you configured the correct API key for it in settings?",
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
  const defaultMessage = "An unknown error occurred.";
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
        message: config.uxError,
        description: config.description,
      };
    }
  }

  return {
    message: null,
    description: actualErrorMessage,
  };
};
