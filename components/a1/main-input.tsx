import { Attachments } from "@/components/a1/input/attachments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUp, Plus, Square as Stop } from "lucide-react";
import { useRef, useState } from "react";

interface MainInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: FileList | Attachment[] },
  ) => void;
  isLoading: boolean;
  status: string;
  stop: () => void;
}

interface Attachment {
  name: string;
  contentType: string;
  url: string;
}

export const MainInput: React.FC<MainInputProps> = ({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  status,
  stop,
}) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStreaming = status === "streaming" || status === "submitted";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      if (input.trim().length > 0) {
        handleSubmitWithFiles(e as any);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(event.target.files);
    }
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    if (!files) return;

    const newFiles = Array.from(files).filter((_, i) => i !== index);
    const newDataTransfer = new DataTransfer();
    newFiles.forEach((file) => newDataTransfer.items.add(file));

    setFiles(newDataTransfer.files);
  };

  const handleSubmitWithFiles = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e, { experimental_attachments: files || undefined });
    
    // Clear attachments after submitting
    setFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form
      onSubmit={handleSubmitWithFiles}
      className="flex flex-col bg-secondary dark:bg-secondary pr-2 pt-2 rounded-md focus-within:ring-1 focus-within:ring-ring"
    >
      {files && files.length > 0 && (
        <Attachments files={files} onRemove={handleRemoveFile} />
      )}

      <Textarea
        autoFocus
        className="bg-secondary dark:bg-secondary pr-0 pt-0 resize-none rounded-b-none field-sizing-content min-h-10 max-h-40 overflow-auto border-none focus-visible:ring-0"
        value={input}
        placeholder="Enter research instructions..."
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      <div className="bg-secondary dark:bg-secondary p-2 pr-0 rounded-b-md rounded-t-none flex justify-between items-center">
        <div className="relative">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  disabled={isLoading}
                  size="icon"
                  onClick={handlePlusClick}
                >
                  <Plus />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Attach files</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {files && files.length > 0 && (
            <span
              title={`${files.length.toString()} attached`}
              className="absolute -top-1 -right-1 dark:shadow-sm dark:shadow-muted select-none bg-primary text-primary-foreground text-xs rounded-md h-4 min-w-4 flex items-center justify-center"
            >
              {files.length}
            </span>
          )}
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*, text/*"
          />
        </div>
        <div>
          {isStreaming ? (
            <Button
              variant="destructive"
              type="button"
              size="icon"
              onClick={stop}
            >
              <Stop />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={isStreaming || input.trim().length === 0}
            >
              <ArrowUp />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
