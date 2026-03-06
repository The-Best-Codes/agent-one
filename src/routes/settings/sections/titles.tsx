import { useAtom } from "jotai";
import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { titleGenerationAtom } from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import { DEFAULT_SETTINGS, type TitleGenerationMethodOption } from "@/lib/settings/types";

export default function TitlesSection() {
  const [titleGeneration, setTitleGeneration] = useAtom(titleGenerationAtom);

  const isTitleGenerationDefault =
    JSON.stringify(titleGeneration) === JSON.stringify(DEFAULT_SETTINGS.TITLE_GENERATION);

  const handleResetTitleGeneration = () => {
    resetSetting("TITLE_GENERATION");
  };

  const updateTitleGeneration = (updates: Partial<typeof DEFAULT_SETTINGS.TITLE_GENERATION>) => {
    setTitleGeneration((prev) => ({ ...prev, ...updates }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Title Generation</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetTitleGeneration}
            disabled={isTitleGenerationDefault}
            aria-label="Reset all title settings to default"
          >
            <RotateCcwIcon className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col items-start">
            <Label className="text-sm font-medium">Generation Method</Label>
            <p className="text-muted-foreground mt-1 text-sm">
              How chat titles should be generated.
            </p>
          </div>
          <Select
            value={titleGeneration.method}
            onValueChange={(value) =>
              updateTitleGeneration({
                method: value as TitleGenerationMethodOption,
              })
            }
          >
            <SelectTrigger
              className="w-full md:w-fit md:max-w-96"
              aria-label="Select generation method"
            >
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai">AI generated</SelectItem>
              <SelectItem value="first-user-message">First user message</SelectItem>
              <SelectItem value="first-assistant-message">First assistant message</SelectItem>
              <SelectItem value="custom">Custom phrase</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(titleGeneration.method === "first-user-message" ||
          titleGeneration.method === "first-assistant-message") && (
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label htmlFor="character-limit" className="text-sm font-medium">
                Character Limit
              </Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Maximum characters to use from the message.
              </p>
            </div>
            <Input
              id="character-limit"
              type="number"
              min="10"
              max="200"
              value={titleGeneration.characterLimit}
              onChange={(e) =>
                updateTitleGeneration({
                  characterLimit: parseInt(e.target.value) || 50,
                })
              }
              className="w-full md:w-32"
            />
          </div>
        )}

        {titleGeneration.method === "custom" && (
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label htmlFor="custom-phrase" className="text-sm font-medium">
                Custom Phrase
              </Label>
              <p className="text-muted-foreground mt-1 text-sm">
                The phrase to use as the chat title.
              </p>
            </div>
            <Input
              id="custom-phrase"
              type="text"
              value={titleGeneration.customPhrase}
              onChange={(e) =>
                updateTitleGeneration({
                  customPhrase: e.target.value,
                })
              }
              placeholder="New chat"
              className="w-full md:w-64"
            />
          </div>
        )}

        {titleGeneration.method !== "custom" && (
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label htmlFor="fallback-phrase" className="text-sm font-medium">
                Fallback Phrase
              </Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Used when title generation fails or no content is available.
              </p>
            </div>
            <Input
              id="fallback-phrase"
              type="text"
              value={titleGeneration.fallbackPhrase}
              onChange={(e) =>
                updateTitleGeneration({
                  fallbackPhrase: e.target.value,
                })
              }
              placeholder="New chat"
              className="w-full md:w-64"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
