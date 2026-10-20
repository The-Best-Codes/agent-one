import { tool } from "ai";
import { z } from "zod";

import { COMPUTER_USE_GUIDANCE } from "@/lib/ai/tools/computerUseObserve";
import { raceWithAbort } from "@/lib/ai/tools/utils/abort";
import { type ComputerUseAction, performComputerUseAction } from "@/lib/computer-use";
import type { ComputerUseActToolConfig } from "@/lib/settings/types";

const actionSchema = z.enum([
  "openApp",
  "click",
  "typeText",
  "pressKey",
  "scroll",
  "drag",
  "setValue",
  "performAction",
]);

const inputSchema = z.object({
  app: z
    .string()
    .describe(
      "App name or process ID, the same one used with computerUseObserve. For openApp, the installed app's name.",
    ),
  summary: z
    .string()
    .describe(
      'A few words shown to the user describing this step, like "Click the Send button" or "Type the search query".',
    ),
  action: actionSchema.describe(
    [
      "openApp: open an installed app by name, then observe it.",
      "click: click an element (elementIndex) or a screenshot point (x, y).",
      "typeText: type text into the focused element, or into elementIndex.",
      "pressKey: press a key or chord, like Return, Escape, Tab, cmd+c, ctrl+shift+t.",
      "scroll: scroll in a direction over an element, a point, or the window center.",
      "drag: drag between two screenshot points.",
      "setValue: replace the value of an editable element.",
      "performAction: run an action listed on an element, like toggle, expand, show_menu, focus, or activate.",
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
      "Text for typeText, the new value for setValue, or the action name for performAction.",
    ),
  key: z.string().optional().describe("Key or chord for pressKey."),
  button: z.enum(["left", "right", "middle"]).optional().describe("Mouse button for click."),
  clickCount: z.number().int().min(1).max(3).optional().describe("2 for a double-click."),
  direction: z.enum(["up", "down", "left", "right"]).optional().describe("Scroll direction."),
  amount: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe("Scroll distance in wheel steps. Defaults to 5."),
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
      return { type: "pressKey", key: required(input.key ?? input.text, "key", action) };
    case "scroll":
      return {
        type: "scroll",
        direction: required(input.direction, "direction", action),
        amount: input.amount,
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
    case "performAction":
      return {
        type: "performAction",
        elementIndex: required(input.elementIndex, "elementIndex", action),
        action: required(input.text, "text", action),
      };
  }
}

export const createComputerUseActTool = (config: ComputerUseActToolConfig) =>
  tool({
    description: `Use an app on the user's computer: open it, click, type, press keys, scroll, drag, set values, or run element actions. Observe the app with computerUseObserve before acting on it, and again afterwards to see the result.

${COMPUTER_USE_GUIDANCE}`,
    needsApproval: config.requiresApproval,
    inputSchema,
    execute: async (input, { abortSignal }): Promise<ComputerUseActOutput> => {
      abortSignal?.throwIfAborted();
      const message = await raceWithAbort(
        performComputerUseAction(input.app, toAction(input)),
        abortSignal,
      );
      return { message };
    },
  });
