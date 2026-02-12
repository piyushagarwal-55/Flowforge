import mongoose from "mongoose";

const WorkflowSchema = new mongoose.Schema(
  {
    workflowId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },

    steps: { type: Array, required: true },
    edges: { type: Array, default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Workflow ||
  mongoose.model("Workflow", WorkflowSchema);
