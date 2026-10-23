import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";

// The exact PDF each send attached, kept so the send log can show what a
// client received even after the document is edited. Private Vercel Blob
// in deployments; a folder under .data/ locally.

const localDir = path.join(process.cwd(), ".data/snapshots");
const blobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function saveSnapshot(pathname: string, pdf: Buffer) {
  if (blobConfigured()) {
    const blob = await put(pathname, pdf, {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: true,
    });
    return blob.pathname;
  }
  const file = path.join(localDir, pathname);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, pdf);
  return pathname;
}

export async function readSnapshot(
  pathname: string,
): Promise<ReadableStream | Buffer | null> {
  if (blobConfigured()) {
    const result = await get(pathname, { access: "private" });
    return result?.stream ?? null;
  }
  try {
    return await readFile(
      path.join(
        localDir,
        path.normalize(pathname).replace(/^(\.\.[/\\])+/, ""),
      ),
    );
  } catch {
    return null;
  }
}
