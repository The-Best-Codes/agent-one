import { useAtom } from "jotai";
import { Loader2Icon, LogInIcon } from "lucide-react";
import { useState } from "react";

import { DeviceCodeDisplay } from "@/components/a1/device-code-display";
import { UserProfileDisplay } from "@/components/a1/user-profile-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import {
  systemPromptAppendixAtom,
  userNameAtom,
} from "@/lib/jotai/settings-atoms";

const MAX_APPENDIX_CHARS = 2000;

function AgentOneAccountCard() {
  const {
    user,
    isLoading,
    isSigningIn,
    deviceFlow,
    startSignIn,
    cancelSignIn,
    signOut,
  } = useWebAuth();

  const getStatusDisplay = () => {
    if (isLoading) {
      return {
        icon: (
          <Loader2Icon className="text-muted-foreground size-5 animate-spin" />
        ),
        title: "Checking status...",
        description: "Please wait while we check your account",
        action: null,
      };
    }

    if (isSigningIn && !deviceFlow) {
      return {
        icon: <Loader2Icon className="text-primary size-5 animate-spin" />,
        title: "Signing in...",
        description: "Preparing device authorization",
        action: (
          <Button variant="secondary" size="sm" onClick={cancelSignIn}>
            Cancel
          </Button>
        ),
      };
    }

    if (isSigningIn && deviceFlow) {
      return {
        isCustom: true,
        content: (
          <DeviceCodeDisplay deviceFlow={deviceFlow} onCancel={cancelSignIn} />
        ),
      };
    }

    if (user) {
      return {
        isCustom: true,
        content: (
          <UserProfileDisplay
            user={user}
            action={
              <Button variant="secondary" size="sm" onClick={signOut}>
                Sign out
              </Button>
            }
          />
        ),
      };
    }

    return {
      icon: <LogInIcon className="text-muted-foreground size-5" />,
      title: "Not signed in",
      description: "Sign in to synchronize your data and access models",
      action: (
        <Button onClick={startSignIn} size="sm">
          Sign in
        </Button>
      ),
    };
  };

  const status = getStatusDisplay();

  return (
    <Card>
      <CardHeader>
        <CardTitle>AgentOne Account</CardTitle>
      </CardHeader>
      <CardContent>
        {status.isCustom ? (
          status.content
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
                {status.icon}
              </div>
              <div>
                <p className="leading-none font-medium">{status.title}</p>
                <p className="text-muted-foreground text-sm">
                  {status.description}
                </p>
              </div>
            </div>
            {status.action}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AccountSection() {
  const [userName, setUserName] = useAtom(userNameAtom);
  const [systemPromptAppendix, setSystemPromptAppendix] = useAtom(
    systemPromptAppendixAtom,
  );

  const [nameInput, setNameInput] = useState(userName);
  const [appendixInput, setAppendixInput] = useState(systemPromptAppendix);

  const handleNameChange = (value: string) => {
    setNameInput(value);
    setUserName(value);
  };

  const handleAppendixChange = (value: string) => {
    const truncated = value.slice(0, MAX_APPENDIX_CHARS);
    setAppendixInput(truncated);
    setSystemPromptAppendix(truncated);
  };

  return (
    <div className="flex flex-col gap-6">
      <AgentOneAccountCard />
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-name" className="text-sm font-medium">
              Your Name
            </Label>
            <p className="text-muted-foreground text-sm">
              AgentOne will use this name to address you.
            </p>
            <Input
              id="user-name"
              type="text"
              value={nameInput}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="system-prompt-appendix"
              className="text-sm font-medium"
            >
              AI Instructions
            </Label>
            <p className="text-muted-foreground text-sm">
              Add custom instructions that will be appended to the system
              prompt. These will guide how AgentOne responds to you.
            </p>
            <div className="relative">
              <Textarea
                id="system-prompt-appendix"
                value={appendixInput}
                onChange={(e) => handleAppendixChange(e.target.value)}
                placeholder="e.g., Always use British English. Be concise and technical."
                className="field-sizing-fixed max-h-96 min-h-15 resize-y"
              />
              <span className="text-muted-foreground pointer-events-none absolute right-2 bottom-2 text-xs">
                {appendixInput.length} / {MAX_APPENDIX_CHARS}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
