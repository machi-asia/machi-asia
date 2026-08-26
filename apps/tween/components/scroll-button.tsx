"use client";

import { Button } from "@machi-asia/ui";
import type { ButtonProps } from "@machi-asia/ui";

interface ScrollButtonProps extends ButtonProps {
  targetId: string;
}

export function ScrollButton({ targetId, ...props }: ScrollButtonProps) {
  return (
    <Button
      {...props}
      onClick={() => {
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    />
  );
}
