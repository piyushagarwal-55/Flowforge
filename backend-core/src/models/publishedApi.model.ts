import mongoose from "mongoose";

const PublishApiSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true,
      unique: true,
    },

    workflowId: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      required: true,
    },

    ownerId: {
      type: String,
      required: true,
      index: true,
    },

    method: {
      type: String,
      default: "POST",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PublishedApi ||
  mongoose.model("PublishedApi", PublishApiSchema);
