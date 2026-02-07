/**
 * Clean up old workflow to start fresh
 */

import { config } from "dotenv";
import { connectMongo } from "../src/lib/mongo";
import Workflow from "../src/models/workflow.model";

// Load environment variables
config();

const WORKFLOW_ID = "workflow_1770466821035_010bea99";
const OWNER_ID = "user_default";

async function cleanWorkflow() {
  console.log("🧹 Cleaning up old workflow...\n");

  await connectMongo();

  const result = await Workflow.deleteOne({
    workflowId: WORKFLOW_ID,
    ownerId: OWNER_ID,
  });

  if (result.deletedCount > 0) {
    console.log(`✅ Deleted workflow: ${WORKFLOW_ID}`);
  } else {
    console.log(`ℹ️  Workflow not found: ${WORKFLOW_ID}`);
  }

  console.log("\n✅ Cleanup complete! You can now create a fresh workflow.");
  process.exit(0);
}

cleanWorkflow().catch((error) => {
  console.error("❌ Cleanup failed:", error);
  process.exit(1);
});
