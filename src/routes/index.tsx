import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { RegistrationForm } from "@/components/form/RegistrationForm";
import { CENTER_NAME, CENTER_LOCATION } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${CENTER_NAME} — Online Admission Registration` },
      {
        name: "description",
        content: `Official student admission registration portal for ${CENTER_NAME}, ${CENTER_LOCATION}. Apply online for Engineering, Nursing, Pharmacy, Agriculture & Medical courses.`,
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-br from-primary to-primary-glow py-10 text-primary-foreground">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <div className="inline-block rounded-full border border-accent/40 bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
              2025–26 Admissions Open
            </div>
            <h1 className="mt-3 text-2xl font-bold sm:text-4xl">
              Student Admission Registration
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm opacity-90 sm:text-base">
              Fill in your details below to register for admission counseling.
              Verified by OTP. Application receipt sent instantly.
            </p>
          </div>
        </section>
        <section className="px-4 py-8">
          <RegistrationForm />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
