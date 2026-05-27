import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
const distAssets = join(dist, "assets");
const rootAssets = join(root, "assets");

if (!existsSync(join(dist, "index.html")) || !existsSync(distAssets)) {
  throw new Error("Missing dist build output. Run vite build before publishing Pages root.");
}

rmSync(rootAssets, { recursive: true, force: true });
mkdirSync(rootAssets, { recursive: true });
cpSync(distAssets, rootAssets, { recursive: true });
copyFileSync(join(dist, "index.html"), join(root, "index.html"));
