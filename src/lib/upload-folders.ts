export const UPLOAD_FOLDERS = [
  "headshots",
  "logos/chapter",
  "logos/charity",
  "logos/venue",
  "venue/photos",
  "icons/core-values",
] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export function isUploadFolder(value: string | null): value is UploadFolder {
  return UPLOAD_FOLDERS.includes(value as UploadFolder);
}

export function buildUploadPathname(folder: UploadFolder, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${folder}/${Date.now()}-${safeName}`;
}
