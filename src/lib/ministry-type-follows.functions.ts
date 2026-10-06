import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MinistryType = z.object({
  ministryType: z.string().trim().min(1).max(80),
});

export const getMinistryTypeFollowState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => MinistryType.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("ministry_type_follows")
      .select("id")
      .eq("user_id", context.userId)
      .eq("ministry_type", data.ministryType)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return { following: Boolean(row) };
  });

export const toggleMinistryTypeFollow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => MinistryType.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error: readError } = await context.supabase
      .from("ministry_type_follows")
      .select("id")
      .eq("user_id", context.userId)
      .eq("ministry_type", data.ministryType)
      .maybeSingle();

    if (readError) throw new Error(readError.message);

    if (row) {
      const { error } = await context.supabase
        .from("ministry_type_follows")
        .delete()
        .eq("id", row.id);
      if (error) throw new Error(error.message);
      return { following: false };
    }

    const { error } = await context.supabase.from("ministry_type_follows").insert({
      user_id: context.userId,
      ministry_type: data.ministryType,
    });
    if (error) throw new Error(error.message);
    return { following: true };
  });