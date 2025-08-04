import { useEffect, useState } from "react";

type MatchType = "any" | "all";

interface MobileDetectionOptions {
  pointerCoarse?: boolean;
  anyHover?: boolean;
  userAgent?: boolean;
  onTouchStart?: boolean;
  match: MatchType;
}

const useMobileDetection = (options: MobileDetectionOptions): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const { pointerCoarse, anyHover, userAgent, onTouchStart, match } =
        options;
      const checks: boolean[] = [];

      if (pointerCoarse !== undefined) {
        checks.push(
          window.matchMedia("(pointer: coarse)").matches === pointerCoarse,
        );
      }

      if (anyHover !== undefined) {
        checks.push(
          window.matchMedia("(any-hover: none)").matches === anyHover,
        );
      }

      if (userAgent !== undefined) {
        const ua = navigator.userAgent.toLowerCase();
        checks.push(
          /mobile|android|iphone|ipad|ipod|blackberry|windows phone|opera mini/i.test(
            ua,
          ) === userAgent,
        );
      }

      if (onTouchStart !== undefined) {
        checks.push("ontouchstart" in window === onTouchStart);
      }

      let result: boolean;
      if (match === "any") {
        result = checks.some((check) => check);
      } else {
        result = checks.every((check) => check);
      }

      setIsMobile(result);
    };

    checkMobile();
  }, [options]);

  return isMobile;
};

export default useMobileDetection;
