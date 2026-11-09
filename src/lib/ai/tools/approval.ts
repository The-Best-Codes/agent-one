import type { DynamicToolUIPart, ToolSet, ToolUIPart } from "ai";

const REQUIRES_APPROVAL = Symbol("agentOneRequiresApproval");

export type ApprovalRule = boolean | ((input: unknown) => boolean | PromiseLike<boolean>);

type ApprovalMarked = { [REQUIRES_APPROVAL]?: ApprovalRule };

export function withApproval<T extends object>(tool: T, requiresApproval: ApprovalRule): T {
  return { ...tool, [REQUIRES_APPROVAL]: requiresApproval };
}

export async function toolApproval({
  toolCall,
  tools,
}: {
  toolCall: { toolName: string; input: unknown };
  tools: ToolSet | undefined;
}): Promise<"user-approval" | "not-applicable"> {
  const rule = (tools?.[toolCall.toolName] as ApprovalMarked | undefined)?.[REQUIRES_APPROVAL];
  const required = typeof rule === "function" ? await rule(toolCall.input) : rule;
  return required ? "user-approval" : "not-applicable";
}

export function hideAutomaticApprovalRequest<T extends ToolUIPart | DynamicToolUIPart>(part: T): T {
  if (part.state !== "approval-requested" || !part.approval.isAutomatic) return part;
  return { ...part, state: "input-available", approval: undefined };
}
