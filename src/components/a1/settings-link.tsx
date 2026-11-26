import { Link, type LinkProps, useLocation } from "react-router";

type SettingsLinkProps = Omit<LinkProps, "to"> & { id?: string };

export function SettingsLink({ id, ...props }: SettingsLinkProps) {
  const { pathname } = useLocation();
  return (
    <Link {...props} to={`/settings${id ? `#${id}` : ""}`} replace={pathname === "/settings"} />
  );
}
