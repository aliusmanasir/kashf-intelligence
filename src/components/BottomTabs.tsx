import { Link } from "@tanstack/react-router";
import { Newspaper, Sparkle, LineChart, Mic, User } from "lucide-react";
import { KashfMarkSvg } from "@/components/KashfLogo";

const tabs = [
  { to: "/daily", label: "Daily", Icon: Newspaper },
  { to: "/lens", label: "Lens", Icon: Sparkle },
  { to: "/pulse", label: "Pulse", Icon: LineChart },
  { to: "/voice", label: "Voice", Icon: Mic },
] as const;

export function BottomTabs() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: true }}
              className="group flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-muted-foreground transition-colors"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              <span className="text-[10px] font-medium tracking-wider uppercase">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AppHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-end justify-between px-5 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div>
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {right}
          <ProfileButton />
        </div>
      </div>
    </header>
  );
}

export function KashfMark({ className }: { className?: string }) {
  return (
    <div
      className={
        "flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-[oklch(0.13_0.01_260)] " +
        (className ?? "")
      }
    >
      <KashfMarkSvg size={20} stroke="var(--primary)" />
    </div>
  );
}

export function ProfileButton() {
  return (
    <Link
      to="/profile"
      aria-label="Profile"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
    >
      <User className="h-4 w-4" strokeWidth={1.75} />
    </Link>
  );
}