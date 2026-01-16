import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  checkNotificationPermission,
  requestNotificationPermission,
  sendNotificationIfAllowed,
} from "./notifications";

// Mock Tauri notification plugin
vi.mock("@tauri-apps/plugin-notification", () => ({
  isPermissionGranted: vi.fn(),
  requestPermission: vi.fn(),
  sendNotification: vi.fn(),
}));

import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

describe("notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("checkNotificationPermission", () => {
    it("should return true when permission is granted", async () => {
      vi.mocked(isPermissionGranted).mockResolvedValue(true);

      const result = await checkNotificationPermission();

      expect(result).toBe(true);
      expect(isPermissionGranted).toHaveBeenCalled();
    });

    it("should return false when permission is not granted", async () => {
      vi.mocked(isPermissionGranted).mockResolvedValue(false);

      const result = await checkNotificationPermission();

      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      vi.mocked(isPermissionGranted).mockRejectedValue(
        new Error("Permission check failed"),
      );

      const result = await checkNotificationPermission();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it("should handle various error types", async () => {
      const errors = [
        new Error("Network error"),
        "String error",
        { message: "Object error" },
        null,
      ];

      for (const error of errors) {
        vi.mocked(isPermissionGranted).mockRejectedValue(error);
        const result = await checkNotificationPermission();
        expect(result).toBe(false);
      }
    });
  });

  describe("requestNotificationPermission", () => {
    it("should return true when permission is granted", async () => {
      vi.mocked(requestPermission).mockResolvedValue("granted");

      const result = await requestNotificationPermission();

      expect(result).toBe(true);
      expect(requestPermission).toHaveBeenCalled();
    });

    it("should return false when permission is denied", async () => {
      vi.mocked(requestPermission).mockResolvedValue("denied");

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
    });

    it("should return false when permission is default", async () => {
      vi.mocked(requestPermission).mockResolvedValue("default");

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      vi.mocked(requestPermission).mockRejectedValue(
        new Error("Request failed"),
      );

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it("should handle timeout errors", async () => {
      vi.mocked(requestPermission).mockRejectedValue(new Error("Timeout"));

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
    });
  });

  describe("sendNotificationIfAllowed", () => {
    it("should send notification when permission is already granted", async () => {
      vi.mocked(isPermissionGranted).mockResolvedValue(true);
      vi.mocked(sendNotification).mockResolvedValue(undefined);

      const result = await sendNotificationIfAllowed("Test", "Message");

      expect(result).toBe(true);
      expect(sendNotification).toHaveBeenCalledWith({
        title: "Test",
        body: "Message",
      });
    });

    it("should request permission and send if granted", async () => {
      vi.mocked(isPermissionGranted).mockResolvedValue(false);
      vi.mocked(requestPermission).mockResolvedValue("granted");
      vi.mocked(sendNotification).mockResolvedValue(undefined);

      const result = await sendNotificationIfAllowed("Title", "Body");

      expect(result).toBe(true);
      expect(requestPermission).toHaveBeenCalled();
      expect(sendNotification).toHaveBeenCalledWith({
        title: "Title",
        body: "Body",
      });
    });

    it("should not send notification if permission denied", async () => {
      vi.mocked(isPermissionGranted).mockResolvedValue(false);
      vi.mocked(requestPermission).mockResolvedValue("denied");

      const result = await sendNotificationIfAllowed("Title", "Body");

      expect(result).toBe(false);
      expect(sendNotification).not.toHaveBeenCalled();
    });

    it("should return false on error", async () => {
      vi.mocked(isPermissionGranted).mockRejectedValue(new Error("Failed"));

      const result = await sendNotificationIfAllowed("Title", "Body");

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it("should handle empty title and body", async () => {
      vi.mocked(isPermissionGranted).mockResolvedValue(true);
      vi.mocked(sendNotification).mockResolvedValue(undefined);

      const result = await sendNotificationIfAllowed("", "");

      expect(result).toBe(true);
      expect(sendNotification).toHaveBeenCalledWith({
        title: "",
        body: "",
      });
    });

    it("should handle special characters in title and body", async () => {
      vi.mocked(isPermissionGranted).mockResolvedValue(true);
      vi.mocked(sendNotification).mockResolvedValue(undefined);

      const result = await sendNotificationIfAllowed(
        "Test: <title>",
        "Body with 'quotes' and \"double quotes\"",
      );

      expect(result).toBe(true);
      expect(sendNotification).toHaveBeenCalledWith({
        title: "Test: <title>",
        body: "Body with 'quotes' and \"double quotes\"",
      });
    });

    it("should handle very long title and body", async () => {
      vi.mocked(isPermissionGranted).mockResolvedValue(true);
      vi.mocked(sendNotification).mockResolvedValue(undefined);

      const longTitle = "a".repeat(1000);
      const longBody = "b".repeat(2000);

      const result = await sendNotificationIfAllowed(longTitle, longBody);

      expect(result).toBe(true);
    });

    it("should handle multiline body text", async () => {
      vi.mocked(isPermissionGranted).mockResolvedValue(true);
      vi.mocked(sendNotification).mockResolvedValue(undefined);

      const result = await sendNotificationIfAllowed(
        "Title",
        "Line 1\nLine 2\nLine 3",
      );

      expect(result).toBe(true);
      expect(sendNotification).toHaveBeenCalledWith({
        title: "Title",
        body: "Line 1\nLine 2\nLine 3",
      });
    });

    it("should handle unicode characters", async () => {
      vi.mocked(isPermissionGranted).mockResolvedValue(true);
      vi.mocked(sendNotification).mockResolvedValue(undefined);

      const result = await sendNotificationIfAllowed(
        "Test 🎉",
        "Message 世界 ✓",
      );

      expect(result).toBe(true);
      expect(sendNotification).toHaveBeenCalledWith({
        title: "Test 🎉",
        body: "Message 世界 ✓",
      });
    });
  });

  describe("error handling edge cases", () => {
    it("should handle all functions throwing errors", async () => {
      vi.mocked(isPermissionGranted).mockRejectedValue(new Error("Error 1"));
      vi.mocked(requestPermission).mockRejectedValue(new Error("Error 2"));

      const checkResult = await checkNotificationPermission();
      const requestResult = await requestNotificationPermission();
      const sendResult = await sendNotificationIfAllowed("T", "B");

      expect(checkResult).toBe(false);
      expect(requestResult).toBe(false);
      expect(sendResult).toBe(false);
    });
  });
});
