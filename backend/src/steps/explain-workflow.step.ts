import { ApiRouteConfig, StepHandler } from "motia";
import { connectMongo } from "../lib/mongo";
import Workflow from "../models/workflow.model";

export const config: ApiRouteConfig = {
  name: "explainWorkflow",
  type: "api",
  path: "/workflow/explain",
  method: "POST",
  emits: [],
};

interface ExplainRequest {
  workflowId: string;
  ownerId: string;
  correlationId?: string;
}

interface WorkflowStep {
  order: number;
  type: string;
  label: string;
  description: string;
  icon: string;
}

interface SecurityNote {
  type: "authentication" | "validation" | "database" | "email" | "security";
  message: string;
  severity: "info" | "warning" | "success";
}

interface ExplainResponse {
  workflowId: string;
  summary: string;
  steps: WorkflowStep[];
  dataFlow: string[];
  securityNotes: SecurityNote[];
  nodeCount: number;
  correlationId: string;
}

/**
 * EXPLAIN WORKFLOW ENDPOINT
 * 
 * Generates human-readable explanation of what a workflow does.
 * Analyzes nodes, edges, and generates step-by-step description.
 */

export const handler: StepHandler<typeof config> = async (req, ctx) => {
  const { workflowId, ownerId, correlationId } = req.body as ExplainRequest;
  const finalCorrelationId = correlationId || `explain-${Date.now()}`;

  ctx.logger.info(`[explainWorkflow] 📥 EXPLAIN_REQUESTED`, {
    correlationId: finalCorrelationId,
    workflowId,
    ownerId,
  });

  if (!workflowId || !ownerId) {
    return {
      status: 400,
      body: { error: "workflowId and ownerId are required" },
    };
  }

  try {
    await connectMongo();

    // Load workflow
    const workflowDoc = await Workflow.findOne({ workflowId, ownerId });

    if (!workflowDoc) {
      ctx.logger.error(`[explainWorkflow] ❌ Workflow not found`, {
        correlationId: finalCorrelationId,
        workflowId,
      });
      return {
        status: 404,
        body: { error: "Workflow not found" },
      };
    }

    const nodes = workflowDoc.steps || [];
    const nodeCount = nodes.length;

    ctx.logger.info(`[explainWorkflow] 📊 WORKFLOW_SUMMARY`, {
      correlationId: finalCorrelationId,
      nodeCount,
      nodeTypes: nodes.map((n: any) => n.type),
    });

    // Generate steps explanation
    const steps: WorkflowStep[] = nodes.map((node: any, index: number) => {
      const step = generateStepDescription(node, index);
      return step;
    });

    // Generate data flow summary
    const dataFlow = generateDataFlow(nodes);

    // Generate security notes
    const securityNotes = generateSecurityNotes(nodes);

    // Generate overall summary
    const summary = generateSummary(nodes);

    const response: ExplainResponse = {
      workflowId,
      summary,
      steps,
      dataFlow,
      securityNotes,
      nodeCount,
      correlationId: finalCorrelationId,
    };

    ctx.logger.info(`[explainWorkflow] ✅ EXPLANATION_OUTPUT`, {
      correlationId: finalCorrelationId,
      stepCount: steps.length,
      securityNoteCount: securityNotes.length,
      dataFlowCount: dataFlow.length,
    });

    return {
      status: 200,
      body: response,
    };
  } catch (error: any) {
    ctx.logger.error(`[explainWorkflow] ❌ Explanation failed`, {
      correlationId: finalCorrelationId,
      error: error.message,
      stack: error.stack,
    });

    return {
      status: 500,
      body: {
        error: "Failed to explain workflow",
        details: error.message,
      },
    };
  }
};

/* ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================ */

function generateStepDescription(node: any, index: number): WorkflowStep {
  const type = node.type;
  const label = node.data?.label || type;
  const fields = node.data?.fields || {};

  let description = "";
  let icon = "circle";

  switch (type) {
    case "input":
      description = "User provides input data to start the workflow";
      icon = "user";
      break;

    case "inputValidation":
      description = "Input data is validated to ensure it meets requirements";
      icon = "shield-check";
      break;

    case "authMiddleware":
      description = "User authentication is verified using JWT tokens";
      icon = "lock";
      break;

    case "userLogin":
      description = "User credentials are checked and login session is created";
      icon = "log-in";
      break;

    case "dbFind":
      const findCollection = fields.collection || "database";
      description = `Search for existing records in ${findCollection}`;
      icon = "search";
      break;

    case "dbInsert":
      const insertCollection = fields.collection || "database";
      description = `Create new record in ${insertCollection} collection`;
      icon = "database";
      break;

    case "dbUpdate":
      const updateCollection = fields.collection || "database";
      description = `Update existing record in ${updateCollection} collection`;
      icon = "edit";
      break;

    case "dbDelete":
      const deleteCollection = fields.collection || "database";
      description = `Delete record from ${deleteCollection} collection`;
      icon = "trash";
      break;

    case "emailSend":
      description = "Send email notification to user";
      icon = "mail";
      break;

    case "delay":
      const duration = fields.duration || "specified time";
      description = `Wait for ${duration} before continuing`;
      icon = "clock";
      break;

    case "response":
      description = "Send response back to the user";
      icon = "send";
      break;

    default:
      description = `Execute ${type} operation`;
      icon = "zap";
  }

  return {
    order: index + 1,
    type,
    label,
    description,
    icon,
  };
}

function generateDataFlow(nodes: any[]): string[] {
  const flow: string[] = [];

  const hasInput = nodes.some((n) => n.type === "input");
  const hasValidation = nodes.some((n) => n.type === "inputValidation");
  const hasAuth = nodes.some((n) => n.type === "authMiddleware" || n.type === "userLogin");
  const hasDbWrite = nodes.some((n) => n.type === "dbInsert" || n.type === "dbUpdate");
  const hasDbRead = nodes.some((n) => n.type === "dbFind");
  const hasEmail = nodes.some((n) => n.type === "emailSend");

  if (hasInput) {
    flow.push("User input is received");
  }

  if (hasValidation) {
    flow.push("Input is validated for correctness");
  }

  if (hasAuth) {
    flow.push("User authentication is verified");
  }

  if (hasDbRead) {
    flow.push("Data is retrieved from database");
  }

  if (hasDbWrite) {
    flow.push("Data is stored in database");
  }

  if (hasEmail) {
    flow.push("Email notification is sent");
  }

  flow.push("Response is returned to user");

  return flow;
}

function generateSecurityNotes(nodes: any[]): SecurityNote[] {
  const notes: SecurityNote[] = [];

  // Check for authentication
  const hasAuth = nodes.some((n) => n.type === "authMiddleware" || n.type === "userLogin");
  if (hasAuth) {
    notes.push({
      type: "authentication",
      message: "JWT authentication is enabled for secure access",
      severity: "success",
    });
  } else {
    const hasDbWrite = nodes.some((n) => n.type === "dbInsert" || n.type === "dbUpdate" || n.type === "dbDelete");
    if (hasDbWrite) {
      notes.push({
        type: "authentication",
        message: "No authentication detected - consider adding auth middleware",
        severity: "warning",
      });
    }
  }

  // Check for validation
  const hasValidation = nodes.some((n) => n.type === "inputValidation");
  if (hasValidation) {
    notes.push({
      type: "validation",
      message: "Input validation is active to prevent invalid data",
      severity: "success",
    });
  } else {
    const hasInput = nodes.some((n) => n.type === "input");
    if (hasInput) {
      notes.push({
        type: "validation",
        message: "No input validation detected - consider adding validation",
        severity: "warning",
      });
    }
  }

  // Check for database operations
  const dbWrites = nodes.filter((n) => n.type === "dbInsert" || n.type === "dbUpdate" || n.type === "dbDelete");
  if (dbWrites.length > 0) {
    notes.push({
      type: "database",
      message: `${dbWrites.length} database write operation(s) detected`,
      severity: "info",
    });
  }

  // Check for email
  const hasEmail = nodes.some((n) => n.type === "emailSend");
  if (hasEmail) {
    notes.push({
      type: "email",
      message: "Email notifications are configured",
      severity: "info",
    });
  }

  return notes;
}

function generateSummary(nodes: any[]): string {
  const nodeTypes = nodes.map((n) => n.type);
  
  const hasAuth = nodeTypes.includes("authMiddleware") || nodeTypes.includes("userLogin");
  const hasDb = nodeTypes.some((t) => t.startsWith("db"));
  const hasEmail = nodeTypes.includes("emailSend");
  
  let summary = "This workflow ";
  
  if (hasAuth) {
    summary += "authenticates users, ";
  }
  
  if (hasDb) {
    summary += "manages data in the database, ";
  }
  
  if (hasEmail) {
    summary += "sends email notifications, ";
  }
  
  summary += `and processes requests through ${nodes.length} steps.`;
  
  return summary;
}
