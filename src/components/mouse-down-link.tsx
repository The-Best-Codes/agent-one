import { useLinkClickHandler } from "react-router";

interface MouseDownLinkProps extends React.HTMLProps<HTMLAnchorElement> {
  to: string;
}

export function MouseDownLink({ to, children, ...props }: MouseDownLinkProps) {
  const handleMouseDown = useLinkClickHandler(to, props);

  return (
    <a
      {...props}
      href={to}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.preventDefault()}
    >
      {children}
    </a>
  );
}
