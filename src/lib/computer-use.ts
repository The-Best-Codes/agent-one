import { invoke } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";

export interface ComputerUsePermissions {
  accessibility: boolean;
  screenRecording: boolean;
  supported: boolean;
}

export type ComputerUsePermission = "accessibility" | "screenRecording";

export interface ComputerUseAppInfo {
  name: string;
  pid?: number;
  windows: string[];
}

export interface ComputerUseScreenshot {
  data: string;
  mediaType: string;
  width: number;
  height: number;
}

export interface ComputerUseAppState {
  app: string;
  pid: number;
  window?: string;
  tree: string;
  elementCount: number;
  truncated: boolean;
  screenshot?: ComputerUseScreenshot;
  screenshotError?: string;
}

export type ComputerUseAction =
  | {
      type: "click";
      elementIndex?: number;
      x?: number;
      y?: number;
      button?: "left" | "right" | "middle";
      clickCount?: number;
    }
  | { type: "typeText"; text: string; elementIndex?: number }
  | { type: "pressKey"; key: string }
  | {
      type: "scroll";
      direction: "up" | "down" | "left" | "right";
      amount?: number;
      elementIndex?: number;
      x?: number;
      y?: number;
    }
  | { type: "drag"; fromX: number; fromY: number; toX: number; toY: number }
  | { type: "setValue"; elementIndex: number; value: string }
  | { type: "performAction"; elementIndex: number; action: string };

export const isComputerUseSupported = () => !["android", "ios"].includes(platform());

export const getComputerUsePermissions = () =>
  invoke<ComputerUsePermissions>("computer_use_permissions");

export const requestComputerUsePermission = (permission: ComputerUsePermission) =>
  invoke<void>("computer_use_request_permission", { permission });

export const listComputerUseApps = () => invoke<ComputerUseAppInfo[]>("computer_use_list_apps");

export const getComputerUseAppState = (options: {
  app: string;
  window?: string;
  includeScreenshot?: boolean;
  includeMenuBar?: boolean;
  maxElements?: number;
}) => invoke<ComputerUseAppState>("computer_use_get_state", options);

export const performComputerUseAction = (app: string, action: ComputerUseAction) =>
  invoke<string>("computer_use_act", { app, action });
