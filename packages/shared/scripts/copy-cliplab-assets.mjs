import { copyFileSync, mkdirSync } from "node:fs";

const destination = new URL("../dist/cliplab/", import.meta.url);
mkdirSync(destination, { recursive: true });
for (const name of ["LICENSE", "PROVENANCE.md"]) {
  copyFileSync(new URL(`../src/cliplab/${name}`, import.meta.url), new URL(name, destination));
}
