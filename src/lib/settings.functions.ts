import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sectionSettingsSchema = z.object({
  collection: z.boolean().default(true),
});

export type SectionSettings = z.infer<typeof sectionSettingsSchema>;

export const DEFAULT_SECTIONS: SectionSettings = { collection: true };

/** Public: which storefront sections are visible. */
export const getSectionSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicServerClient } = await import("./supabase-public.server");
  const supabase = createPublicServerClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "sections")
    .maybeSingle();

  if (error) throw new Error(error.message);
  const parsed = sectionSettingsSchema.safeParse(data?.value ?? {});
  return parsed.success ? parsed.data : DEFAULT_SECTIONS;
});

/** Admin-only: update section visibility (RLS enforces the admin role). */
export const saveSectionSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sectionSettingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "sections", value: data, updated_at: new Date().toISOString() });

    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
