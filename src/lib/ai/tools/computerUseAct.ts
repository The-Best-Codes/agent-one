import { platform } from "@tauri-apps/plugin-os";
import { tool } from "ai";
import { z } from "zod";

import { COMPUTER_USE_GUIDANCE } from "@/lib/ai/tools/computerUseObserve";
import { raceWithAbort } from "@/lib/ai/tools/utils/abort";
import { type ComputerUseAction, performComputerUseAction } from "@/lib/computer-use";

const actionSchema = z.enum([
  "openApp",
  "click",
  "typeText",
  "pressKey",
  "scroll",
  "drag",
  "setValue",
  "selectText",
  "performAction",
]);

const inputSchema = z.object({
  app: z
    .string()
    .describe(
      "App name or process ID, the same one used with computerUseObserve. For openApp, the installed app's name, or its path when several share a name.",
    ),
  summary: z
    .string()
    .describe(
      'A few words shown to the user describing this step, like "Click the Send button" or "Type the search query".',
    ),
  action: actionSchema.describe(
    [
      "openApp: open an installed app by name (or path), then observe it.",
      "click: click an element (elementIndex) or a screenshot point (x, y).",
      "typeText: type text into the focused element, or into elementIndex.",
      "pressKey: press a key or chord, like Return, Escape, Tab, ctrl+shift+t, or cmd+c on macOS.",
      "scroll: scroll in a direction over an element, a screenshot point, or the window center.",
      "drag: drag between two screenshot points.",
      "setValue: replace the value of an editable element.",
      "selectText: select text inside an element, or put the caret before or after it. Use prefix/suffix when the text appears more than once.",
      "performAction: run a secondary action listed on an element, like Show Menu, Raise, or Increment.",
    ].join("\n"),
  ),
  elementIndex: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Element index from the latest computerUseObserve result for this app."),
  x: z.number().int().optional().describe("X pixel in the latest screenshot."),
  y: z.number().int().optional().describe("Y pixel in the latest screenshot."),
  toX: z.number().int().optional().describe("Drag end X pixel in the latest screenshot."),
  toY: z.number().int().optional().describe("Drag end Y pixel in the latest screenshot."),
  text: z
    .string()
    .optional()
    .describe(
      "Text for typeText, the new value for setValue, the text to find for selectText, or the action name for performAction.",
    ),
  key: z
    .string()
    .optional()
    .describe(
      'Key or chord for pressKey, in xdotool style like "Return", "ctrl+shift+Tab", or "cmd+c" on macOS.',
    ),
  prefix: z
    .string()
    .optional()
    .describe("For selectText: text that must appear right before the match."),
  suffix: z
    .string()
    .optional()
    .describe("For selectText: text that must appear right after the match."),
  mode: z
    .enum(["select", "before", "after"])
    .optional()
    .describe("For selectText: select the text (default), or place the caret before or after it."),
  button: z.enum(["left", "right", "middle"]).optional().describe("Mouse button for click."),
  clickCount: z.number().int().min(1).max(3).optional().describe("2 for a double-click."),
  direction: z.enum(["up", "down", "left", "right"]).optional().describe("Scroll direction."),
  pages: z
    .number()
    .min(0.1)
    .max(20)
    .optional()
    .describe("Scroll distance in pages; fractions allowed. Defaults to 1."),
});

type ComputerUseActInput = z.infer<typeof inputSchema>;

export interface ComputerUseActOutput {
  message: string;
}

function required<T>(value: T | undefined, name: string, action: string): T {
  if (value === undefined) {
    throw new Error(`${action} needs ${name}.`);
  }
  return value;
}

function toAction(input: ComputerUseActInput): ComputerUseAction {
  const { action } = input;
  switch (action) {
    case "openApp":
      return { type: "openApp" };
    case "click":
      return {
        type: "click",
        elementIndex: input.elementIndex,
        x: input.x,
        y: input.y,
        button: input.button,
        clickCount: input.clickCount,
      };
    case "typeText":
      return {
        type: "typeText",
        text: required(input.text, "text", action),
        elementIndex: input.elementIndex,
      };
    case "pressKey":
      return {
        type: "pressKey",
        key: required(input.key ?? input.text, "key", action),
      };
    case "scroll":
      return {
        type: "scroll",
        direction: required(input.direction, "direction", action),
        pages: input.pages,
        elementIndex: input.elementIndex,
        x: input.x,
        y: input.y,
      };
    case "drag":
      return {
        type: "drag",
        fromX: required(input.x, "x", action),
        fromY: required(input.y, "y", action),
        toX: required(input.toX, "toX", action),
        toY: required(input.toY, "toY", action),
      };
    case "setValue":
      return {
        type: "setValue",
        elementIndex: required(input.elementIndex, "elementIndex", action),
        value: required(input.text, "text", action),
      };
    case "selectText":
      return {
        type: "selectText",
        elementIndex: required(input.elementIndex, "elementIndex", action),
        text: required(input.text, "text", action),
        prefix: input.prefix,
        suffix: input.suffix,
        mode: input.mode,
      };
    case "performAction":
      return {
        type: "performAction",
        elementIndex: required(input.elementIndex, "elementIndex", action),
        action: required(input.text, "text", action),
      };
  }
}

const inputDelivery = () =>
  platform() === "linux"
    ? "Actions on element indexes run in the background. Clicks and scrolls at x/y coordinates, drags, key presses, and typing that can't go through the element use the real mouse and keyboard and go to the focused window, so prefer element indexes."
    : "Input goes to the app in the background, so it does not take over the user's mouse, keyboard, or focus.";

export const createComputerUseActTool = (observer?: string) =>
  tool({
    description: `Use an app on the user's computer: open it, click, type, press keys, scroll, drag, set values, select text, or run element actions. ${inputDelivery()} Observe the app with computerUseObserve before acting on it, and again afterwards to see the result.

${COMPUTER_USE_GUIDANCE}`,
    inputSchema,
    execute: async (input, { abortSignal }): Promise<ComputerUseActOutput> => {
      abortSignal?.throwIfAborted();
      const message = await raceWithAbort(
        performComputerUseAction(input.app, toAction(input), observer),
        abortSignal,
      );
      return { message };
    },
  });
