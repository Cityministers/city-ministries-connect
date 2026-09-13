import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({ query: z.string().trim().min(2).max(120) });

/** Turns a typed city or ZIP into map coordinates so the map can move there. */
export const lookupPlace = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }): Promise<{ lat: number; lng: number } | null> => {
    const { geocodeQuery } = await import("./geocode.server");
    return await geocodeQuery(data.query);
  });
