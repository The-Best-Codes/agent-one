import { Attachments } from "@/components/a1/input/attachments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  stop,
}) => {
  // Use DataTransfer to maintain the FileList state
  const [attachmentList, setAttachmentList] = useState<DataTransfer>(
    new DataTransfer(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract FileList from DataTransfer object for rendering
  const files =
    attachmentList.files.length > 0 ? attachmentList.files : undefined;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      if (input.trim().length > 0) {
        handleSubmitWithFiles(e as any);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newDataTransfer = new DataTransfer();

      // Add existing files
      Array.from(attachmentList.files).forEach((file) => {
        newDataTransfer.items.add(file);
      });

      // Add new files
      Array.from(event.target.files).forEach((file) => {
        newDataTransfer.items.add(file);
      });

      setAttachmentList(newDataTransfer);
    }
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    if (!files) return;

    const newDataTransfer = new DataTransfer();
    Array.from(files).forEach((file, i) => {
      if (i !== index) {
        newDataTransfer.items.add(file);
      }
    });

    setAttachmentList(newDataTransfer);
  };

  const handleSubmitWithFiles = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e, { experimental_attachments: files });

    // Clear attachments after submitting
    setAttachmentList(new DataTransfer());

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form
      onSubmit={handleSubmitWithFiles}
      className="flex flex-col bg-secondary dark:bg-secondary rounded-md focus-within:ring-1 focus-within:ring-ring"
    >
      {files && files.length > 0 && (
        <Attachments files={files} onRemove={handleRemoveFile} />
      )}

      <Textarea
        autoFocus
        className="bg-secondary dark:bg-secondary resize-none rounded-b-none field-sizing-content min-h-10 max-h-40 overflow-auto focus-visible:ring-0"
        value={input}
        placeholder="Enter research instructions..."
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      <div className="bg-secondary dark:bg-secondary p-2 pr-0 rounded-b-md rounded-t-none flex justify-between items-center">
        <div className="relative">
          <Button
            type="button"
            disabled={isLoading}
            size="icon"
            onClick={handlePlusClick}
          >
            <Plus />
          </Button>
          {files && files.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {files.length}
            </span>
          )}
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*, text/*" // Only allow image and text files as before
          />
        </div>
        <div>
          {isLoading ? (
            <Button type="button" size="icon" onClick={stop}>
              <Stop />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || input.trim().length === 0}
            >
              <ArrowUp />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
