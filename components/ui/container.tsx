import type { HTMLAttributes } from "react";

/** Centered max-width page container used by marketing and app layouts. */
export function Container({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10 ${className}`}
      {...rest}
    />
  );
}

/** Narrow measure for long-form reading (FAQ answers, legal copy). */
export function NarrowContainer({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mx-auto w-full max-w-3xl px-5 sm:px-8 ${className}`}
      {...rest}
    />
  );
}