import type { ReactNode } from "react";
import { Reveal } from "./reveal";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 inline-flex items-center gap-2 font-sb text-xs font-bold uppercase tracking-[0.16em]">
      <span className="bg-gradient-to-r from-sb-violet to-fuchsia-500 bg-clip-text text-transparent">
        {children}
      </span>
    </p>
  );
}

export function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
}) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
      <Reveal delay={1}>
        <h2 className="font-sb text-4xl font-extrabold tracking-tight text-sb-ink sm:text-5xl">
          {title}
        </h2>
      </Reveal>
      {sub ? (
        <Reveal delay={2}>
          <p className="mt-4 font-sb text-lg text-sb-ink2">{sub}</p>
        </Reveal>
      ) : null}
    </div>
  );
}

/** Gradient text for one or two headline words. */
export function Grad({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-sb-violet via-fuchsia-500 to-sb-coral bg-clip-text text-transparent">
      {children}
    </span>
  );
}
