import { IconSearch } from "@tabler/icons-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  containerClassName?: string;
  groupClassName?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ containerClassName, groupClassName, className, ...props }, ref) => {
    return (
      <div className={cn("group/search-input relative", containerClassName, groupClassName)}>
        <IconSearch className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-100 duration-200 group-focus-within/search-input:left-0 group-focus-within/search-input:opacity-0" />
        <Input
          ref={ref}
          type="search"
          className={cn(
            "bg-background pl-9 transition-[padding] duration-200 group-focus-within/search-input:pl-3",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
