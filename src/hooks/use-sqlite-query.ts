import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { chatUpdateTriggerAtom } from "@/lib/jotai/atoms";

export function useSqliteQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);
  const chatUpdateTrigger = useAtomValue(chatUpdateTriggerAtom);

  useEffect(() => {
    let isMounted = true;

    queryFn().then((result) => {
      if (isMounted) {
        setData(result);
      }
    });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatUpdateTrigger, ...deps]);

  return data;
}
