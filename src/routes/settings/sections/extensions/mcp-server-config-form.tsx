import { IconAlertTriangle } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { EnvVarsEditor } from "@/components/a1/input/env-vars-editor";
import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  className = "grid gap-4",
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
  const { t } = useTranslation();
  const isStdio = values.type === "stdio";
  const resolvedNamePlaceholder = namePlaceholder ?? t("extensions.serverName");
  const resolvedCommandPlaceholder = commandPlaceholder ?? t("extensions.commandPlaceholder");
  const resolvedUrlPlaceholder = urlPlaceholder ?? t("extensions.urlPlaceholder");
  const resolvedApprovalDescription =
    approvalDescription ?? t("extensions.approvalDescriptionServer");

  return (
    <div className={className}>
      {showTypeSelector ? (
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-server-type`}>{t("extensions.serverType")}</Label>
          <Select
            value={values.type}
            onValueChange={(value: McpServerType) => onChange({ type: value })}
          >
            <SelectTrigger id={`${idPrefix}-server-type`}>
              <SelectValue placeholder={t("extensions.selectServerType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="stdio">{t("extensions.stdioLocal")}</SelectItem>
                <SelectItem value="http">{t("extensions.httpRemote")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {isStdio ? t("extensions.stdioHelp") : t("extensions.httpHelp")}
          </p>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-name`}>{t("common.name")}</Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder={resolvedNamePlaceholder}
          value={values.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </div>

      {isStdio ? (
        <>
          {showStdioWarning ? (
            <Alert>
              <IconAlertTriangle />
              <AlertTitle>{t("extensions.stdioSecurityTitle")}</AlertTitle>
              <AlertDescription>{t("extensions.stdioSecurityDescription")}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-command`}>{t("extensions.command")}</Label>
            <Input
              id={`${idPrefix}-command`}
              placeholder={resolvedCommandPlaceholder}
              value={values.command}
              onChange={(event) => onChange({ command: event.target.value })}
            />
          </div>
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
          <div className="grid gap-2">
            <Label htmlFor={`${idPrefix}-url`}>{t("extensions.url")}</Label>
            <Input
              id={`${idPrefix}-url`}
              placeholder={resolvedUrlPlaceholder}
              value={values.url}
              onChange={(event) => onChange({ url: event.target.value })}
            />
          </div>
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

      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-timeout`}>{t("extensions.timeoutSeconds")}</Label>
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
      </div>

      {showApprovalControls ? (
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <Label htmlFor={`${idPrefix}-requires-approval`} className="text-sm">
              {t("extensions.requireApprovalByDefault")}
            </Label>
            <span className="text-muted-foreground text-xs">{resolvedApprovalDescription}</span>
          </div>
          <Switch
            id={`${idPrefix}-requires-approval`}
            checked={values.requiresApproval}
            onCheckedChange={(requiresApproval) => onChange({ requiresApproval })}
          />
        </div>
      ) : null}
    </div>
  );
}
