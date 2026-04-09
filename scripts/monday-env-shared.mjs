import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const mondayRootDir = join(__dirname, "..");
export const mondayEnvFile = join(mondayRootDir, ".env.monday.local");

export function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const text = readFileSync(path, "utf8");
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}

export function loadMondayCredentials() {
  const fileEnv = parseEnvFile(mondayEnvFile);
  const token = process.env.MONDAY_API_TOKEN || fileEnv.MONDAY_API_TOKEN;
  const boardId = process.env.MONDAY_BOARD_ID || fileEnv.MONDAY_BOARD_ID;
  return { token, boardId, envFile: mondayEnvFile };
}
