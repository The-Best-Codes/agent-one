import { IconAlertTriangle } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { EnvVarsEditor } from "@/components/a1/input/env-vars-editor";
import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { type McpServerType } from "@/lib/settings/types";

export interface McpServerConfigFormValues {
  type: McpServerType;
  name: string;
  command: string;
  env: Record<string, string>;
  url: string;
  headers: Record<string, string>;
  timeoutSec: number;
  requiresApproval: boolean;
}

interface McpServerConfigFormProps {
  values: McpServerConfigFormValues;
  onChange: (updates: Partial<McpServerConfigFormValues>) => void;
  idPrefix: string;
  className?: string;
  showTypeSelector?: boolean;
  showTransportEditors?: boolean;
  namePlaceholder?: string;
  commandPlaceholder?: string;
  urlPlaceholder?: string;
  approvalDescription?: string;
  stdioSupplement?: ReactNode;
  httpSupplement?: ReactNode;
  showApprovalControls?: boolean;
  showStdioWarning?: boolean;
}

export function McpServerConfigForm({
  values,
  onChange,
  idPrefix,
  className,
  showTypeSelector = false,
  showTransportEditors = true,
  namePlaceholder,
  commandPlaceholder,
  urlPlaceholder,
  approvalDescription,
  stdioSupplement,
  httpSupplement,
  showApprovalControls = false,
  showStdioWarning = false,
}: McpServerConfigFormProps) {
  const isStdio = values.type === "stdio";
  const resolvedNamePlaceholder = namePlaceholder ?? "Server name";
  const resolvedCommandPlaceholder =
    commandPlaceholder ?? "e.g., npx -y @modelcontextprotocol/server-everything";
  const resolvedUrlPlaceholder = urlPlaceholder ?? "https://mcp.example.com/api";
  const resolvedApprovalDescription =
    approvalDescription ??
    "Ask for confirmation before running tools from this server, unless in Auto mode";

  return (
    <FieldGroup className={className}>
      {showTypeSelector ? (
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-server-type`}>Server Type</FieldLabel>
          <Select
            value={values.type}
            onValueChange={(value: McpServerType) => onChange({ type: value })}
          >
            <SelectTrigger id={`${idPrefix}-server-type`}>
              <SelectValue placeholder="Select server type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="stdio">STDIO (Local)</SelectItem>
                <SelectItem value="http">HTTP (Remote)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            {isStdio
              ? "STDIO servers run locally via command line."
              : "HTTP servers are remote endpoints that support the MCP protocol."}
          </FieldDescription>
        </Field>
      ) : null}

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
        <Input
          id={`${idPrefix}-name`}
          placeholder={resolvedNamePlaceholder}
          value={values.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </Field>

      {isStdio ? (
        <>
          {showStdioWarning ? (
            <Alert>
              <IconAlertTriangle />
              <AlertTitle>This extension runs code on your device</AlertTitle>
              <AlertDescription>
                Only install it if you trust the developer. It may not work correctly on all
                devices.
              </AlertDescription>
            </Alert>
          ) : null}
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-command`}>Command</FieldLabel>
            <Input
              id={`${idPrefix}-command`}
              placeholder={resolvedCommandPlaceholder}
              value={values.command}
              onChange={(event) => onChange({ command: event.target.value })}
            />
          </Field>
          {stdioSupplement}
          {showTransportEditors ? (
            <EnvVarsEditor
              id={idPrefix}
              env={values.env}
              onChange={(env) => onChange({ env })}
              labelClassName="text-sm"
            />
          ) : null}
        </>
      ) : (
        <>
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-url`}>URL</FieldLabel>
            <Input
              id={`${idPrefix}-url`}
              placeholder={resolvedUrlPlaceholder}
              value={values.url}
              onChange={(event) => onChange({ url: event.target.value })}
            />
          </Field>
          {httpSupplement}
          {showTransportEditors ? (
            <HttpHeadersEditor
              id={idPrefix}
              headers={values.headers}
              onChange={(headers) => onChange({ headers })}
              labelClassName="text-sm"
            />
          ) : null}
        </>
      )}

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-timeout`}>Timeout (seconds)</FieldLabel>
        <Input
          id={`${idPrefix}-timeout`}
          type="number"
          min="0.1"
          max="300"
          step="0.1"
          value={values.timeoutSec}
          onChange={(event) => {
            const seconds = parseFloat(event.target.value);
            onChange({ timeoutSec: Number.isFinite(seconds) ? seconds : 0 });
          }}
        />
      </Field>

      {showApprovalControls ? (
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={`${idPrefix}-requires-approval`}>
              Require Approval By Default
            </FieldLabel>
            <FieldDescription>{resolvedApprovalDescription}</FieldDescription>
          </FieldContent>
          <Switch
            id={`${idPrefix}-requires-approval`}
            checked={values.requiresApproval}
            onCheckedChange={(requiresApproval) => onChange({ requiresApproval })}
          />
        </Field>
      ) : null}
    </FieldGroup>
  );
}
