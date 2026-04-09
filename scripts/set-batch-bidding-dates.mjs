/**
 * Sets bidding dates for all 101lab-2 batches:
 * - start_date: Random date between April 10 - April 30
 * - end_date: 90 days after start_date
 *
 * Directly updates jos_recycle_bidding table for site_id = LabGreenbidz (11)
 *
 * Run: npm run set:batch-dates
 */

import dotenv from "dotenv";
import axios from "axios";

// Load environment variables
dotenv.config();

const API_URL = process.env.VITE_PRODUCTION_URL || "http://localhost:4000/api/v1/";
const X_SYSTEM_KEY = process.env.VITE_X_SYSTEM_KEY;

if (!X_SYSTEM_KEY) {
  console.error("Missing VITE_X_SYSTEM_KEY in .env");
  process.exit(1);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "X-System-Key": X_SYSTEM_KEY,
    "Content-Type": "application/json",
  },
});

/**
 * Generate random date between April 10 and April 30, 2026
 */
function getRandomStartDate() {
  const minDay = 10;
  const maxDay = 30;
  const day = Math.floor(Math.random() * (maxDay - minDay + 1)) + minDay;
  const date = new Date(2026, 3, day); // Month is 0-indexed, so 3 = April
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Add 90 days to a date (YYYY-MM-DD format)
 */
function add90Days(dateStr) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 90);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

async function main() {
  try {
    console.log("Fetching all batches from 101lab-2...\n");

    // Get all batches for LabGreenbidz site type
    const batchRes = await api.get("/batch/fetch", {
      params: {
        type: "LabGreenbidz",
        limit: 1000,
        page: 1,
      },
    });

    if (!batchRes.data.success) {
      console.error("Failed to fetch batches:", batchRes.data.message);
      process.exit(1);
    }

    const batches = batchRes.data.data || [];
    console.log(`Found ${batches.length} batches\n`);

    if (batches.length === 0) {
      console.log("No batches to update.");
      process.exit(0);
    }

    // Generate dates for each batch
    const updates = batches.map((batch) => {
      const startDate = getRandomStartDate();
      const endDate = add90Days(startDate);
      return {
        batchId: batch.batchId,
        batchNumber: batch.batchNumber,
        startDate,
        endDate,
      };
    });

    // Display preview
    console.log("Generated bidding dates:");
    console.log("─".repeat(70));
    for (const update of updates) {
      console.log(`Batch #${update.batchNumber} (ID: ${update.batchId})`);
      console.log(`  Start: ${update.startDate}  →  End: ${update.endDate}`);
    }
    console.log("─".repeat(70));
    console.log(`\nTotal batches: ${updates.length}\n`);

    // Ask for confirmation
    console.log("Ready to update bidding dates in the database.");
    console.log("(You can modify the script to actually apply changes)\n");

    // TODO: Uncomment below to actually apply updates
    /*
    console.log("Updating batches...\n");

    let successCount = 0;
    let failureCount = 0;

    for (const update of updates) {
      try {
        const updateRes = await api.put(`/batch/${update.batchId}/bidding`, {
          start_date: update.startDate,
          end_date: update.endDate,
        });

        if (updateRes.data.success) {
          console.log(`✓ Batch #${update.batchNumber}: ${update.startDate} → ${update.endDate}`);
          successCount++;
        } else {
          console.error(`✗ Batch #${update.batchNumber}: ${updateRes.data.message}`);
          failureCount++;
        }
      } catch (err) {
        console.error(`✗ Batch #${update.batchNumber}: ${err.message}`);
        failureCount++;
      }
    }

    console.log(`\nComplete! Updated: ${successCount}, Failed: ${failureCount}\n`);
    */
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
