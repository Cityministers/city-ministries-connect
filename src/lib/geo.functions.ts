import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({ query: z.string().trim().min(2).max(120) });

/** Turns a typed city or ZIP into map coordinates so the map can move there. */
export const lookupPlace = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }): Promise<{ lat: number; lng: number } | null> => {
    const { geocodeQuery } = await import("./geocode.server");
    return await geocodeQuery(data.query);
  });

/** Exact street-address lookup for pinning a meetup spot (signed-in only). */
export const lookupAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ query: z.string().trim().min(4).max(200) }).parse(data))
  .handler(async ({ data }): Promise<{ lat: number; lng: number } | null> => {
    const { geocodeAddress } = await import("./geocode.server");
    return await geocodeAddress(data.query, "", "");
  });
