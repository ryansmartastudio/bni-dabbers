"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { uploadImage } from "@/lib/client-upload";
import type { UploadFolder } from "@/lib/upload-folders";
import { cn } from "@/lib/utils";

const DEFAULT_MAX_SIZE_MB = 4;

type ImageUploadProps = {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  folder: UploadFolder;
  aspect?: "square" | "wide";
  maxSizeMB?: number;
  className?: string;
};

export function ImageUpload({
  label,
  description,
  value,
  onChange,
  folder,
  aspect = "square",
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(file: File | null) {
    if (!file) return;

    setError(null);

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(
        `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please use a file under ${maxSizeMB} MB.`,
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose a PNG, JPG, or WebP image.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await uploadImage(file, folder);
        onChange(result.url);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Upload failed. Try a smaller image or check your connection.",
        );
      }
    });
  }

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        ) : null}
        <p className="mt-0.5 text-xs text-muted">
          Max {maxSizeMB} MB. PNG or JPG recommended.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border border-border bg-surface-muted",
            aspect === "square"
              ? "h-28 w-28 shrink-0"
              : "h-32 w-full min-w-0",
          )}
        >
          {value ? (
            <Image
              src={value}
              alt={label}
              fill
              unoptimized
              className="object-contain p-2"
              sizes={aspect === "square" ? "112px" : "320px"}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-muted">
              No image yet
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              handleFileChange(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-medium transition hover:bg-surface-muted disabled:opacity-50 sm:w-auto sm:self-start"
          >
            {isUploading
              ? "Uploading..."
              : value
                ? "Replace image"
                : "Upload image"}
          </button>
          {value ? (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => onChange("")}
              className="text-left text-xs text-muted transition hover:text-bni disabled:opacity-50"
            >
              Remove image
            </button>
          ) : null}
          {error ? <p className="text-xs text-bni">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
