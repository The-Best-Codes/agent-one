"use client";
import { IconAlertTriangle, IconChevronDown, IconRefresh } from "@tabler/icons-react";
import dedent from "dedent";
import React from "react";

import { CopyButton } from "@/components/a1/copy-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import i18n from "@/lib/i18n";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  copiedStatus: "success" | "error" | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copiedStatus: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error("Caught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRefresh = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copiedStatus: null,
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh w-svw items-center justify-center overflow-auto p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-destructive flex items-center gap-2 text-xl">
                    <IconAlertTriangle />
                    {i18n.t("errorBoundary.title")}
                  </CardTitle>
                  <CardDescription>{i18n.t("errorBoundary.description")}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <CopyButton
                    text={dedent`
                Error: ${this.state.error?.toString() ?? i18n.t("errorBoundary.unknownError")}
                Stack: ${this.state.errorInfo?.componentStack ?? i18n.t("errorBoundary.noStackTrace")}
                    `}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertTitle className="text-lg">{i18n.t("errorBoundary.errorMessage")}</AlertTitle>
                <AlertDescription>
                  {this.state.error
                    ? this.state.error.toString()
                    : i18n.t("errorBoundary.unknownErrorOccurred")}
                </AlertDescription>
              </Alert>

              <Accordion
                type="single"
                collapsible
                className="border-border flex w-full flex-col gap-2 rounded-md border px-3"
              >
                <AccordionItem className="p-0" value="details">
                  <AccordionTrigger
                    icon={<IconChevronDown className="size-4" data-icon="inline-end" />}
                    shouldRotateIcon
                    className="flex justify-between p-2 px-1"
                  >
                    <span>{i18n.t("errorBoundary.technicalDetails")}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="bg-muted max-h-96 overflow-auto rounded-md p-3 font-mono text-sm">
                      {this.state.errorInfo?.componentStack}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2 pt-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={this.handleReset}>
                  {i18n.t("errorBoundary.tryAgain")}
                </Button>
                <Button onClick={this.handleRefresh}>
                  <IconRefresh data-icon="inline-start" />
                  {i18n.t("errorBoundary.reloadApp")}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
