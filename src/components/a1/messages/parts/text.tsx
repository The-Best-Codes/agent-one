import type { TextUIPart } from "ai";

export const MessagePartText = ({ ...props }: TextUIPart) => {
  return (
    <div className="max-w-full overflow-auto rounded-md">{props.text}</div>
  );
};
