"use client";

import Papa from "papaparse";
import { useState, useTransition } from "react";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import { importHte, importRoles } from "@/app/admin/actions";
import { inputClass } from "@/components/field";

type Mode = "roles" | "hte";
type Row = Record<string, string>;

const columns: Record<Mode, { required: string[]; optional: string[] }> = {
  roles: { required: ["company", "title"], optional: ["apply_url", "city", "setup", "allowance", "notes"] },
  hte: { required: ["no", "company_name_as_listed"], optional: [] },
};

export function CsvImport({ currentVersion }: { currentVersion: string }) {
  const [mode, setMode] = useState<Mode>("roles");
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [version, setVersion] = useState("");
  const [makeCurrent, setMakeCurrent] = useState(true);
  const [pending, start] = useTransition();

  const reset = (m: Mode) => {
    setMode(m);
    setRows([]);
    setFileName("");
    setProblem(null);
  };

  const read = (file: File) => {
    setFileName(file.name);
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (res) => {
        const headers = res.meta.fields ?? [];
        const missing = columns[mode].required.filter((c) => !headers.includes(c));
        setProblem(missing.length ? `Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}` : res.errors[0]?.message ?? null);
        setRows(missing.length ? [] : res.data);
      },
      error: (err) => setProblem(err.message),
    });
  };

  const run = () =>
    start(async () => {
      const res =
        mode === "roles"
          ? await importRoles(rows)
          : await importHte(version, rows.map((r) => ({ no: Number(r.no), name: r.company_name_as_listed })), makeCurrent);
      if (res.ok) {
        toast.success(res.message ?? "Imported");
        reset(mode);
      } else toast.error(res.error);
    });

  const cols = columns[mode];
  const preview = rows.slice(0, 5);
  const shown = [...cols.required, ...cols.optional];

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="What to import" className="glass flex w-full gap-1 rounded-full p-1 sm:w-fit">
        {(["roles", "hte"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => reset(m)}
            className={`h-10 flex-1 rounded-full px-4 text-sm font-medium sm:flex-none ${mode === m ? "bg-nu-blue text-white" : "text-ink-soft"}`}
          >
            {m === "roles" ? "Roles" : "HTE list"}
          </button>
        ))}
      </div>

      <p className="px-1 text-sm text-ink-soft">
        Columns: <span className="font-medium text-ink">{cols.required.join(", ")}</span>
        {cols.optional.length > 0 && <>, optional {cols.optional.join(", ")}</>}.{" "}
        {mode === "roles" ? "Every row becomes a draft you publish later." : `The current list is ${currentVersion}.`}
      </p>

      <label className="glass flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-ink/15 p-5 text-center text-sm">
        <FileUp className="size-5 text-ink-soft" />
        <span>{fileName || "Choose a .csv file"}</span>
        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && read(e.target.files[0])} />
      </label>

      {problem && <p className="rounded-2xl bg-bad/10 px-4 py-3 text-sm text-bad">{problem}</p>}

      {rows.length > 0 && (
        <>
          <div className="glass overflow-x-auto rounded-[22px] p-3">
            <p className="mb-2 px-1 text-sm font-medium">
              {rows.length} rows{rows.length > 5 ? ", first 5 shown" : ""}
            </p>
            <table className="w-full min-w-max text-left text-xs">
              <thead>
                <tr className="text-ink-soft">
                  {shown.map((c) => <th key={c} className="px-2 py-1 font-medium">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="border-t border-ink/8">
                    {shown.map((c) => <td key={c} className="max-w-56 truncate px-2 py-1.5">{r[c]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mode === "hte" && (
            <div className="glass flex flex-col gap-3 rounded-[22px] p-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-soft">Version name</span>
                <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="AY 2027-2028" className={inputClass} />
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" checked={makeCurrent} onChange={(e) => setMakeCurrent(e.target.checked)} className="size-4 accent-[var(--nu-blue)]" />
                Make it the current list (the checker uses it right away)
              </label>
            </div>
          )}

          <button type="button" onClick={run} disabled={pending} className="h-12 rounded-full bg-nu-blue px-6 font-medium text-white disabled:opacity-60 sm:self-end">
            {pending ? "Importing..." : `Import ${rows.length} rows`}
          </button>
        </>
      )}
    </div>
  );
}
