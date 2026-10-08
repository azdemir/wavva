import type { HTMLAttributes } from "react";

/** Centered max-width page container used by marketing and app layouts. */
export function Container({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}
      {...rest}
    />
  );
}
