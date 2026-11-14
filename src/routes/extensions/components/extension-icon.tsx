import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ExtensionIcon({
  name,
  src,
  size = "default",
  className,
}: {
  name: string;
  src?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const letter = (name.match(/[\p{L}\p{N}]/u)?.[0] ?? "?").toUpperCase();

  return (
    <Avatar aria-hidden size={size} className={className}>
      {src ? (
        <AvatarImage
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          draggable={false}
          className="bg-muted object-contain p-1"
        />
      ) : null}
      <AvatarFallback>{letter}</AvatarFallback>
    </Avatar>
  );
}
