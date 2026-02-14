import { useAtom } from "jotai";
import {
  ClipboardCopyIcon,
  LoaderIcon,
  LogInIcon,
  LogOutIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!deviceFlow) return;
    await navigator.clipboard.writeText(deviceFlow.userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AgentOne Account</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <LoaderIcon className="text-muted-foreground size-4 animate-spin" />
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
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            A browser window has been opened. Enter the code below to link this
            device to your account.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleCopy}
              className="bg-muted hover:bg-muted/80 flex items-center gap-2 rounded-md px-4 py-2 font-mono text-xl font-bold tracking-[0.2em] transition-colors"
            >
              {deviceFlow.userCode}
              <ClipboardCopyIcon className="text-muted-foreground size-4" />
            </button>
          </div>
          <p className="text-muted-foreground text-center text-xs">
            {copied ? "Copied!" : "Click code to copy"}
          </p>
          <div className="flex items-center justify-center gap-2">
            <LoaderIcon className="text-muted-foreground size-3 animate-spin" />
            <span className="text-muted-foreground text-sm">
              Waiting for authorization...
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={cancelSignIn}>
            <XIcon className="size-4" />
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (user) {
    const initials = user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <Card>
        <CardHeader>
          <CardTitle>AgentOne Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">
                {user.name}
              </span>
              <span className="text-muted-foreground text-sm">
                {user.email}
              </span>
            </div>
          </div>
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
