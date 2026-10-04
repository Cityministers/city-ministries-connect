import { createFileRoute, redirect } from "@tanstack/react-router";

// Old Review Center link — the owner CMS replaced it.
export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: () => {
    throw redirect({ to: "/cms", replace: true });
  },
});
