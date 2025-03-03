import { Loader } from "@/components/a1/smooth-loader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send } from "lucide-react";

interface MainInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export const MainInput: React.FC<MainInputProps> = ({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}) => {
  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center motion-preset-blur-up"
    >
      <Textarea
        className="bg-secondary dark:bg-secondary resize-none focus-visible:ring-0 focus-visible:ring-transparent py-2 px-3 max-h-40 overflow-y-auto"
        value={input}
        placeholder="Enter research instructions..."
        onChange={handleInputChange}
        autoFocus
        rows={3}
        disabled={isLoading}
      />
      <div className="absolute bottom-2 right-2 flex items-center gap-2">
        <Button type="submit" disabled={isLoading} size="icon">
          {isLoading ? <Loader /> : <Send />}
        </Button>
      </div>
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <Button type="button" disabled={isLoading} size="icon">
          <Plus />
        </Button>
      </div>
    </form>
  );
};
