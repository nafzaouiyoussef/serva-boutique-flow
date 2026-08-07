import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { useLocaleData } from "@/i18n/useLocale";
import {
  DEFAULT_SECTIONS,
  getSectionSettings,
  saveSectionSettings,
  type SectionSettings,
} from "@/lib/settings.functions";

export function AdminSettings() {
  const { t } = useLocaleData();
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getSectionSettings);
  const persist = useServerFn(saveSectionSettings);

  const { data, isLoading } = useQuery({
    queryKey: ["section-settings"],
    queryFn: () => fetchSettings({}),
  });

  const sections = data ?? DEFAULT_SECTIONS;

  const mutation = useMutation({
    mutationFn: (next: SectionSettings) => persist({ data: next }),
    onSuccess: (_res, next) => {
      queryClient.setQueryData(["section-settings"], next);
      queryClient.invalidateQueries({ queryKey: ["section-settings"] });
      toast.success(t.admin.settings.saved);
    },
    onError: () => toast.error(t.admin.settings.saveError),
  });

  return (
    <section className="rounded-[1.5rem] bg-background p-6">
      <h2 className="font-display text-2xl">{t.admin.settings.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.admin.settings.subtitle}</p>

      {isLoading ? (
        <div className="mt-6 grid place-items-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-brass" />
        </div>
      ) : (
        <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl bg-cream p-4">
          <div>
            <p className="text-sm font-semibold">{t.admin.settings.collection}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.admin.settings.collectionHint}
            </p>
          </div>
          <Switch
            checked={sections.collection}
            disabled={mutation.isPending}
            onCheckedChange={(checked) =>
              mutation.mutate({ ...sections, collection: checked })
            }
          />
        </div>
      )}
    </section>
  );
}
