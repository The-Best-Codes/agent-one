import { Link, type LinkProps } from "react-router";

import { type SettingsDestination, useSettingsPath } from "@/hooks/use-settings-path";

type SettingsLinkProps = Omit<LinkProps, "to"> & SettingsDestination;

export function SettingsLink({ id, ...props }: SettingsLinkProps) {
  return <Link {...props} to={useSettingsPath({ id })} />;
}
