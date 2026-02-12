/**
 * MCP Agent Model
 * MongoDB schema for persisting agent definitions
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IMCPAgent extends Document {
  agentId: string;
  name: string;
  description?: string;
  allowedTools: string[];
  attachedServers: string[];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const MCPAgentSchema = new Schema<IMCPAgent>(
  {
    agentId: {
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
    allowedTools: {
      type: [String],
      default: [],
    },
    attachedServers: {
      type: [String],
      default: [],
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying by owner
MCPAgentSchema.index({ ownerId: 1, createdAt: -1 });

const MCPAgent = mongoose.model<IMCPAgent>("MCPAgent", MCPAgentSchema);

export default MCPAgent;
