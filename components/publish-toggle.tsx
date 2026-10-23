"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setCompanyPublished, setPublished } from "@/app/actions";

type Props = { slug: string; published: boolean; kind?: "role" | "company" };

export function PublishToggle({ slug, published, kind = "role" }: Props) {
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      const res = kind === "company" ? await setCompanyPublished(slug, !published) : await setPublished(slug, !published);
      if (res.ok) toast.success(published ? "Unpublished" : "Published");
      else toast.error(res.error);
    });

  return (
    <div className="glass flex items-center justify-between gap-3 rounded-2xl p-3 pl-4">
      <p className="text-sm">
        <span className="font-medium">Admin:</span> {published ? "Everyone can see this." : "Only admins can see this."}
      </p>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium disabled:opacity-60 ${published ? "glass" : "bg-nu-blue text-white"}`}
      >
        {pending ? "Saving..." : published ? "Unpublish" : "Publish"}
      </button>
    </div>
  );
}
