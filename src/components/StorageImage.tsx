import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-images";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Extracts the object path when the url points at our (private) storage bucket. */
export function storagePathFrom(url: string): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  let rest = url.slice(idx + marker.length);
  rest = rest.replace(/^(public|sign|authenticated)\//, "");
  if (!rest.startsWith(`${BUCKET}/`)) return null;
  return decodeURIComponent(rest.slice(BUCKET.length + 1).split("?")[0]!);
}

/** Signs private-bucket URLs on demand; passes any other url straight through. */
export function useResolvedImage(url?: string | null) {
  const [resolved, setResolved] = useState<string | undefined>(url ?? undefined);

  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setResolved(undefined);
      return;
    }
    const path = storagePathFrom(url);
    if (!path || url.includes("token=")) {
      setResolved(url);
      return;
    }
    setResolved(undefined);
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, TEN_YEARS)
      .then(({ data }) => {
        if (!cancelled) setResolved(data?.signedUrl ?? url);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return resolved;
}

export function StorageImage({
  src,
  fallbackClassName = "aspect-square w-full bg-sand",
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string | null | undefined;
  fallbackClassName?: string;
}) {
  const resolved = useResolvedImage(src);
  if (!resolved) return <div className={fallbackClassName} />;
  return <img {...props} src={resolved} />;
}
