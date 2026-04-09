import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // ── CORS Preflight ────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const form = await req.json();

    const MONDAY_API_TOKEN = Deno.env.get("MONDAY_API_TOKEN");
    const MONDAY_BOARD_ID = Deno.env.get("MONDAY_BOARD_ID");

    if (!MONDAY_API_TOKEN || !MONDAY_BOARD_ID) {
      return new Response(
        JSON.stringify({ error: "Missing Monday configuration" }),
        { status: 500 }
      );
    }

    // ── Step 1: Fetch board columns to map field names → column IDs ──────
    const columnsQuery = `
      query {
        boards(ids: [${MONDAY_BOARD_ID}]) {
          columns {
            id
            title
            type
          }
        }
      }
    `;

    const columnsRes = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Authorization": MONDAY_API_TOKEN,
        "Content-Type": "application/json",
        "API-Version": "2024-01",
      },
      body: JSON.stringify({ query: columnsQuery }),
    });

    const columnsData = await columnsRes.json();

    if (columnsData.errors) {
      console.error("[Monday] Column fetch error:", columnsData.errors);
      return new Response(
        JSON.stringify({ error: "Failed to fetch board columns" }),
        { status: 500 }
      );
    }

    const columns = columnsData.data?.boards?.[0]?.columns || [];
    if (!columns.length) {
      console.error("[Monday] No columns found on board");
      return new Response(
        JSON.stringify({ error: "Board has no columns configured" }),
        { status: 500 }
      );
    }

    // ── Step 2: Build column mapping (title → id) ──────────────────────
    const columnMap: Record<string, string> = {};
    columns.forEach((col: any) => {
      const titleLower = col.title.toLowerCase();
      columnMap[titleLower] = col.id;
    });

    console.log("[Monday] Available columns:", columnMap);

    // ── Step 3: Map form fields to Monday columns ──────────────────────
    const columnValues: Record<string, any> = {};

    // Email → "Email" column
    if (columnMap["email"] && form.email) {
      columnValues[columnMap["email"]] = { email: form.email, text: form.email };
    }

    // Phone → "Phone" column (or fallback to any phone-type column)
    const phoneCol = columnMap["phone"] || columns.find((c: any) => c.type === "phone")?.id;
    if (phoneCol && form.phone) {
      columnValues[phoneCol] = form.phone;
    }

    // Country → "City" column
    if (columnMap["city"] && form.country) {
      columnValues[columnMap["city"]] = form.country;
    }

    // Inventory Type + Message → "Comment" column
    const commentCol = columnMap["comment"] || columns.find((c: any) => c.type === "long_text")?.id;
    const commentText = form.inventoryType
      ? `Inventory: ${form.inventoryType}\n\n${form.message || ""}`
      : form.message || "";
    if (commentCol && commentText) {
      columnValues[commentCol] = commentText;
    }

    // ── Step 4: Create item (contact row) ────────────────────────────────
    const itemName = form.fullName || "New Lead";
    const subtitleText = form.companyName ? ` — ${form.companyName}` : "";

    const createQuery = `
      mutation CreateItem($itemName: String!, $columnValues: JSON!) {
        create_item(
          board_id: ${MONDAY_BOARD_ID},
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
        }
      }
    `;

    const variables = {
      itemName: itemName + subtitleText,
      columnValues: JSON.stringify(columnValues),
    };

    const createRes = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Authorization": MONDAY_API_TOKEN,
        "Content-Type": "application/json",
        "API-Version": "2024-01",
      },
      body: JSON.stringify({ query: createQuery, variables }),
    });

    const createData = await createRes.json();

    if (createData.errors) {
      console.error("[Monday] Create item error:", createData.errors);
      return new Response(
        JSON.stringify({ error: "Failed to create contact: " + createData.errors[0].message }),
        { status: 500 }
      );
    }

    const itemId = createData.data?.create_item?.id;
    if (!itemId) {
      console.error("[Monday] No item ID returned:", createData);
      return new Response(
        JSON.stringify({ error: "No item created (unknown error)" }),
        { status: 500 }
      );
    }

    console.log(`[Monday] ✅ Created item #${itemId} for ${form.fullName}`);

    return new Response(JSON.stringify({ ok: true, itemId }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });

  } catch (err: any) {
    console.error("[Monday] Function error:", err.message || err);
    return new Response(
      JSON.stringify({ error: "Server error: " + (err.message || "Unknown") }),
      { status: 500 }
    );
  }
});