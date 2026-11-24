"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { confirmImport, previewImport } from "@/actions/crm";
import {
  CSV_COLUMNS,
  MAX_IMPORT_ROWS,
  buildCsvTemplate,
} from "@/lib/crm/csv";
import type { ImportPlan } from "@/lib/crm/import";

/**
 * Bringing a spreadsheet in.
 *
 * Three steps, and the middle one is the reason this is a page rather than a
 * button: pick the file, read what it is about to do, then say yes. Nothing
 * is written before that yes. The text of the file is held here and sent
 * again on confirm, so the server plans it twice and the browser never gets
 * to hand it a list of rows to trust.
 */
export function ImportView() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [done, setDone] = useState<{ added: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function downloadTemplate() {
    const blob = new Blob([buildCsvTemplate()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dabbers-visitor-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setDone(null);
    setPlan(null);
    setFileName(file.name);

    file
      .text()
      .then((contents) => {
        setText(contents);
        startTransition(async () => {
          const result = await previewImport(contents);
          if (result.ok) setPlan(result.data);
          else setError(result.error);
        });
      })
      .catch(() => setError("Couldn't read that file."));
  }

  function commit() {
    if (!text) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmImport(text, skipDuplicates);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone({ added: result.data.added });
      setPlan(null);
      setText(null);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    });
  }

  const adding = plan
    ? plan.rows.filter(
        (row) =>
          row.action === "add" && (!skipDuplicates || row.duplicateOf === null),
      ).length
    : 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-foreground">
            Import a spreadsheet
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            A list of people from anywhere - a show, an old spreadsheet, a
            phone export. You will see exactly what it is going to do before
            anything is added.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-white p-4">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
            1. The columns
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Only <strong className="text-foreground">Name</strong> is needed.
            The first row has to name the columns, but the order does not
            matter and common spellings are understood, so a file from another
            system usually works untouched.
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {CSV_COLUMNS.map((column) => (
              <li
                key={column.key}
                className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                  column.required
                    ? "bg-bni text-white"
                    : "bg-surface-muted text-ink-muted"
                }`}
              >
                {column.label}
                {column.required ? " (needed)" : ""}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={downloadTemplate}
            className="mt-3 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground"
          >
            Download the template
          </button>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-white p-4">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
            2. The file
          </h2>
          <p className="mt-1 text-xs text-muted">
            A .csv file, up to {MAX_IMPORT_ROWS} people at a time. In Excel or
            Numbers, &ldquo;Save as&rdquo; or &ldquo;Export&rdquo; and choose CSV.
          </p>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => onFile(event.target.files?.[0])}
            className="mt-2 block w-full text-sm text-foreground file:mr-3 file:rounded-xl file:border-0 file:bg-bni file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white"
          />
          {fileName ? (
            <p className="mt-1.5 text-xs text-muted">
              {fileName}
              {pending ? " - reading it" : ""}
            </p>
          ) : null}
        </section>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-2xl border border-border bg-surface-muted p-3 text-sm font-semibold text-bni"
          >
            {error}
          </p>
        ) : null}

        {done ? (
          <section className="mt-4 rounded-2xl border border-border bg-surface-muted p-4">
            <p className="text-sm font-bold text-foreground">
              {done.added} {done.added === 1 ? "person" : "people"} added to the
              pipeline.
            </p>
            <p className="mt-1 text-xs text-muted">
              They are unclaimed, so anyone can take them on. Each one has a
              timeline entry saying it came from a spreadsheet.
            </p>
            <Link
              href="/crm"
              className="mt-2 inline-block rounded-xl bg-bni px-4 py-2.5 text-sm font-bold text-white"
            >
              Back to the pipeline
            </Link>
          </section>
        ) : null}

        {plan ? (
          <section className="mt-4 rounded-2xl border border-border bg-white p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              3. What this will do
            </h2>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <Figure value={adding} label="to add" />
              <Figure value={plan.duplicates} label="already here" />
              <Figure value={plan.willSkip} label="unusable" />
            </div>

            {plan.ignoredColumns.length > 0 ? (
              <p className="mt-2 text-xs text-muted">
                Columns ignored: {plan.ignoredColumns.join(", ")}.
              </p>
            ) : null}

            {plan.duplicates > 0 ? (
              <label className="mt-3 flex items-start gap-2 rounded-xl bg-surface-muted p-3">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(event) => setSkipDuplicates(event.target.checked)}
                  className="mt-0.5 size-4"
                />
                <span className="text-xs leading-relaxed text-foreground">
                  <strong className="font-bold">
                    Skip the {plan.duplicates} already in the chapter.
                  </strong>{" "}
                  Untick to add them anyway. Records are never merged, so
                  adding one makes a second, separate person with its own
                  history.
                </span>
              </label>
            ) : null}

            <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface-muted">
                  <tr>
                    <th className="px-2 py-1.5 font-bold text-ink-muted">Row</th>
                    <th className="px-2 py-1.5 font-bold text-ink-muted">Name</th>
                    <th className="px-2 py-1.5 font-bold text-ink-muted">
                      Company
                    </th>
                    <th className="px-2 py-1.5 font-bold text-ink-muted">
                      What happens
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plan.rows.map((row) => {
                    const skipped =
                      row.action === "skip" ||
                      (skipDuplicates && row.duplicateOf !== null);
                    return (
                      <tr key={row.line} className="border-t border-border">
                        <td className="px-2 py-1.5 tabular-nums text-ink-muted">
                          {row.line}
                        </td>
                        <td className="px-2 py-1.5 font-semibold text-foreground">
                          {row.name || <em className="text-muted">blank</em>}
                        </td>
                        <td className="px-2 py-1.5 text-muted">
                          {row.company ?? ""}
                        </td>
                        <td
                          className={`px-2 py-1.5 ${
                            skipped ? "text-bni" : "text-muted"
                          }`}
                        >
                          {row.problem
                            ? row.problem
                            : row.duplicateOf
                              ? skipped
                                ? `Skipped - ${row.duplicateOf} is already here`
                                : `Added anyway - ${row.duplicateOf} is already here`
                              : "Added"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              disabled={pending || adding === 0}
              onClick={commit}
              className="mt-3 w-full rounded-xl bg-bni px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {adding === 0
                ? "Nothing to add"
                : `Add ${adding} ${adding === 1 ? "person" : "people"}`}
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <p className="text-xl font-bold tabular-nums leading-none text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-semibold text-muted">{label}</p>
    </div>
  );
}
