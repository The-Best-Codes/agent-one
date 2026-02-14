import { useAtom } from "jotai";
import { Loader2Icon, LogInIcon, LogOutIcon } from "lucide-react";
import { useState } from "react";

import { DeviceCodeDisplay } from "@/components/a1/device-code-display";
import { UserProfileDisplay } from "@/components/a1/user-profile-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AgentOne Account</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
          <span className="text-muted-foreground text-sm">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  if (isSigningIn && deviceFlow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AgentOne Account</CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceCodeDisplay deviceFlow={deviceFlow} onCancel={cancelSignIn} />
        </CardContent>
      </Card>
    );
  }

  if (user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AgentOne Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <UserProfileDisplay user={user} />
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOutIcon className="size-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AgentOne Account</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Sign in to synchronize your data across devices and access AgentOne
          models.
        </p>
        <Button disabled={isSigningIn} onClick={startSignIn}>
          <LogInIcon className="size-4" />
          Sign in with AgentOne
        </Button>
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

      <Separator />

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
