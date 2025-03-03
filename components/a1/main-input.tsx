import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send, Square as Stop } from "lucide-react";

interface MainInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  stop: () => void;
}

export const MainInput: React.FC<MainInputProps> = ({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      if (input.trim().length > 0) {
        handleSubmit(e as any);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col bg-secondary dark:bg-secondary rounded-md focus-within:ring-1 focus-within:ring-ring pt-2 pr-2"
    >
      <Textarea
        autoFocus
        className="bg-secondary dark:bg-secondary pt-0 resize-none rounded-b-none field-sizing-content min-h-10 max-h-40 overflow-auto focus-visible:ring-0"
        value={input}
        placeholder="Enter research instructions..."
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      <div
        className={`bg-secondary dark:bg-secondary p-2 pr-0 rounded-b-md rounded-t-none ${isLoading ? "bg-opacity-50" : ""}`}
      >
        <div className="flex justify-between items-center">
          <div>
            <Button type="button" disabled={isLoading} size="icon">
              <Plus />
            </Button>
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
                <Send />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};
