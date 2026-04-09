/**
 * monday.com board metadata (groups + columns) for Supabase secrets.
 *
 * Token + board id: .env.monday.local (copy monday.env.example) — never commit.
 *
 *   npm run monday:list-boards     → list board IDs (token only)
 *   npm run monday:list-board      → groups + columns (token + MONDAY_BOARD_ID)
 */

import { loadMondayCredentials, mondayEnvFile } from "./monday-env-shared.mjs";

const listBoardsOnly =
  process.argv.includes("--boards") || process.argv.includes("--list-boards");

const { token, boardId } = loadMondayCredentials();

async function mondayFetch(body) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      "API-Version": "2024-10",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

if (!token) {
  console.error(
    "Missing MONDAY_API_TOKEN.\n\n" +
      `Add it to ${mondayEnvFile} (see monday.env.example) or set the env var.`,
  );
  process.exit(1);
}

if (listBoardsOnly || !boardId) {
  const json = await mondayFetch({
    query: `{ boards (limit: 100) { id name } }`,
  });

  if (json.errors?.length) {
    console.error("Monday API errors:", JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }

  const boards = json.data?.boards || [];
  if (!boards.length) {
    console.log("No boards returned (check token permissions / workspace).");
    process.exit(0);
  }

  console.log("Your boards (copy the id for MONDAY_BOARD_ID):\n");
  for (const b of boards) {
    console.log(`  ${b.id}  ${b.name}`);
  }
  console.log(`
Add to .env.monday.local:
  MONDAY_BOARD_ID=<id above>

Then run: npm run monday:list-board
`);
  process.exit(0);
}

const query = `
  query ($ids: [ID!]) {
    boards(ids: $ids) {
      id
      name
      groups {
        id
        title
      }
      columns {
        id
        title
        type
      }
    }
  }
`;

const json = await mondayFetch({
  query,
  variables: { ids: [boardId] },
});

if (json.errors?.length) {
  console.error("Monday API errors:", JSON.stringify(json.errors, null, 2));
  process.exit(1);
}

const board = json.data?.boards?.[0];
if (!board) {
  console.error("No board found for id:", boardId);
  process.exit(1);
}

console.log("Board:", board.name, `(${board.id})\n`);

console.log("=== Groups (use title match → id as MONDAY_GROUP_ID) ===\n");
for (const g of board.groups || []) {
  console.log(`  ${g.id}`);
  console.log(`    ${g.title}\n`);
}

console.log("=== Columns (map titles to MONDAY_COLUMN_MAP) ===\n");
for (const c of board.columns || []) {
  console.log(`  ${c.id}  [${c.type}]  ${c.title}`);
}

console.log(`
Example MONDAY_COLUMN_MAP for Direct Sales + your "power seller" group:
  Replace IDs below with values from above (Email = email type, City = text, Comment = long_text).

  {"email":"<EMAIL_COL_ID>","country":"<CITY_COL_ID>","__details":"<COMMENT_COL_ID>"}
`);
