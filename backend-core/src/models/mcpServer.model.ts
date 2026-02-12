/**
 * MCP Server Model
 * MongoDB schema for persisting MCP server definitions
 */

import mongoose, { Schema, Document } from "mongoose";
import { MCPServerDefinition } from "../mcp/schemas";

export interface IMCPServer extends Document {
  serverId: string;
  name: string;
  description: string;
  tools: any[];
  resources: any[];
  agents: any[];
  permissions: any[];
  status: "created" | "running" | "stopped" | "error";
  createdAt: Date;
  updatedAt?: Date;
  ownerId?: string;
}

const MCPServerSchema = new Schema<IMCPServer>(
  {
    serverId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    tools: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    resources: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    agents: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    permissions: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    status: {
      type: String,
      enum: ["created", "running", "stopped", "error"],
      default: "created",
    },
    ownerId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying by owner
MCPServerSchema.index({ ownerId: 1, createdAt: -1 });

const MCPServer = mongoose.model<IMCPServer>("MCPServer", MCPServerSchema);

export default MCPServer;
