import {
  ACADEMY_NAME, ACADEMY_TAGLINE, CENTER_NAME, CENTER_LOCATION,
  CONTACT_PHONE, WEBSITE_URL,
} from "@/lib/constants";
import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold sm:text-base">{ACADEMY_NAME}</div>
            <div className="text-[11px] opacity-80">
              {ACADEMY_TAGLINE} · {CENTER_LOCATION}
            </div>
          </div>
        </Link>
        <Link
          to="/admin"
          className="hidden text-xs font-medium opacity-80 transition hover:opacity-100 sm:block"
        >
          Admin Login
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-primary py-6 text-center text-xs text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4">
        <div className="font-semibold">{ACADEMY_NAME} · {CENTER_NAME}</div>
        <div className="opacity-80">
          {CENTER_LOCATION} · Contact: {CONTACT_PHONE} · {WEBSITE_URL}
        </div>
        <div className="mt-2 opacity-60">
          © {new Date().getFullYear()} {ACADEMY_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
