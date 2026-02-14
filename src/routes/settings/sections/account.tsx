import { useAtom } from "jotai";
import { useState } from "react";

import { AuthStatusDisplay } from "@/components/a1/web-auth/auth-status-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  systemPromptAppendixAtom,
  userNameAtom,
} from "@/lib/jotai/settings-atoms";

const MAX_APPENDIX_CHARS = 2000;

function AgentOneAccountCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AgentOne Account</CardTitle>
      </CardHeader>
      <CardContent>
        <AuthStatusDisplay />
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
