import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // In the Lovable preview the editor session is brokered in asynchronously,
    // so the first getUser() can race it. Retry briefly before giving up.
    let user = null;
    for (let attempt = 0; attempt < 5 && !user; attempt++) {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        user = data.user;
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    if (!user) {
      throw redirect({ to: "/auth", search: { next: location.href } });
    }
    const data = { user };

    if (location.pathname !== "/welcome") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!profile?.onboarded_at) {
        throw redirect({ to: "/welcome", search: { next: location.href } });
      }
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
