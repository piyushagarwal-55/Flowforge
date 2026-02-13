import mongoose, { Schema, Document } from 'mongoose';

export interface IExecutionLog extends Document {
  executionId: string;
  serverId?: string;
  workflowId?: string;
  ownerId: string;
  type: 'step_start' | 'step_complete' | 'step_error' | 'workflow_complete' | 'agent_activity' | 'tool_start' | 'tool_complete' | 'tool_error' | 'permission_denied';
  stepType?: string;
  stepName?: string;
  stepIndex?: number;
  message?: string;
  data?: any;
  error?: string;
  timestamp: Date;
  createdAt: Date;
}

const ExecutionLogSchema = new Schema<IExecutionLog>({
  executionId: { type: String, required: true, index: true },
  serverId: { type: String, index: true },
  workflowId: { type: String, index: true },
  ownerId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    required: true,
    enum: [
      'step_start', 
      'step_complete', 
      'step_error', 
      'workflow_complete', 
      'agent_activity',
      'tool_start',
      'tool_complete',
      'tool_error',
      'permission_denied'
    ]
  },
  stepType: { type: String },
  stepName: { type: String },
  stepIndex: { type: Number },
  message: { type: String },
  data: { type: Schema.Types.Mixed },
  error: { type: String },
  timestamp: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient queries
ExecutionLogSchema.index({ executionId: 1, timestamp: 1 });
ExecutionLogSchema.index({ serverId: 1, timestamp: -1 });
ExecutionLogSchema.index({ workflowId: 1, timestamp: -1 });
ExecutionLogSchema.index({ ownerId: 1, timestamp: -1 });

// TTL index - auto-delete logs older than 7 days
ExecutionLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const ExecutionLog = mongoose.model<IExecutionLog>('ExecutionLog', ExecutionLogSchema);

export default ExecutionLog;
