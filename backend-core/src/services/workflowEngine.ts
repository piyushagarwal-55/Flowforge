import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { resolveObject } from "../utils/resolveValue";
import { sendEmail } from "../utils/email";
import { connectMongo } from "../db/mongo";
import { getModel } from "../db/getModel.ts";
import { logger } from "../utils/logger";
import { SocketServer } from "../socket";

export async function runEngine(
  steps: any[],
  input: any,
  headers: any = {},
  executionId: string,
  socketServer: SocketServer
) {
  logger.info("Workflow engine started", {
    executionId,
    stepCount: steps.length,
  });

  await connectMongo();

  const vars: Record<string, any> = {
    input: { ...input },
  };

  const stepResponses: any[] = [];
  const startedAt = Date.now();

  // Emit workflow start event
  socketServer.emitExecutionLog(executionId, {
    type: "step_start",
    timestamp: new Date().toISOString(),
    data: {
      message: "Workflow execution started",
      stepCount: steps.length,
    },
  });

  for (let index = 0; index < steps.length; index++) {
    let step = steps[index];

    // 🔥 FLATTEN step.data.fields into step root
    if (step.data?.fields && typeof step.data.fields === "object") {
      step = {
        ...step,
        ...step.data.fields,
        name: step.data.label || step.id,
      };
    }

    const stepStart = Date.now();
    const stepName = step.name || `${step.type}_${index}`;

    // Emit step_start event
    socketServer.emitExecutionLog(executionId, {
      type: "step_start",
      stepIndex: index,
      stepType: step.type,
      stepName,
      timestamp: new Date().toISOString(),
    });

    logger.debug("Step started", {
      executionId,
      stepIndex: index,
      stepType: step.type,
      stepName,
    });

    const stepLog: any = {
      stepIndex: index,
      stepType: step.type,
      stepName,
      status: "success",
      input: {},
      output: {},
      error: null,
      durationMs: 0,
      startedAt: stepStart,
    };

    try {
      // ------------------------------------------------
      // INPUT
      // ------------------------------------------------
      if (step.type === "input") {
        const variables = step.variables || [];

        // Extract variables from nested input.input to root vars
        const inputData = vars.input?.input || vars.input || {};

        for (const v of variables) {
          const varName = v.name;
          if (varName in inputData) {
            vars[varName] = inputData[varName];
          } else if (v.default !== undefined) {
            vars[varName] = v.default;
          } else {
            // Set to null if not provided and no default
            vars[varName] = null;
          }
        }

        stepLog.input = {
          variablesConfigured: variables.map((v: any) => ({
            name: v.name,
            type: v.type || "any",
            required: v.required || false,
            hasDefault: v.default !== undefined,
          })),
        };

        stepLog.output = {
          variablesSet: variables.map((v: any) => v.name),
          values: variables.reduce((acc: any, v: any) => {
            acc[v.name] = vars[v.name];
            return acc;
          }, {}),
        };

        logger.debug("Input step completed", {
          executionId,
          stepIndex: index,
          variablesSet: variables.map((v: any) => v.name),
        });
      }

      // ------------------------------------------------
      // INPUT VALIDATION
      // ------------------------------------------------
      else if (step.type === "inputValidation") {
        const errors: Record<string, string[]> = {};
        const validationDetails: any[] = [];
        const resolvedValues: Record<string, any> = {};

        for (const rule of step.rules || []) {
          const value = resolveObject(vars, rule.field);
          resolvedValues[rule.field] = value;

          const fieldValidation: any = {
            field: rule.field,
            value: value,
            rules: [],
            passed: true,
          };

          if (
            rule.required &&
            (value === undefined || value === null || value === "")
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Field is required");
            fieldValidation.rules.push({ type: "required", passed: false });
            fieldValidation.passed = false;
          } else if (rule.required) {
            fieldValidation.rules.push({ type: "required", passed: true });
          }

          if (
            rule.type === "number" &&
            value !== undefined &&
            isNaN(Number(value))
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Expected number");
            fieldValidation.rules.push({ type: "number", passed: false });
            fieldValidation.passed = false;
          } else if (rule.type === "number" && value !== undefined) {
            fieldValidation.rules.push({ type: "number", passed: true });
          }

          if (
            rule.type === "string" &&
            value !== undefined &&
            typeof value !== "string"
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Expected string");
            fieldValidation.rules.push({ type: "string", passed: false });
            fieldValidation.passed = false;
          } else if (rule.type === "string" && value !== undefined) {
            fieldValidation.rules.push({ type: "string", passed: true });
          }

          if (
            rule.type === "boolean" &&
            value !== undefined &&
            typeof value !== "boolean"
          ) {
            errors[rule.field] = errors[rule.field] || [];
            errors[rule.field].push("Expected boolean");
            fieldValidation.rules.push({ type: "boolean", passed: false });
            fieldValidation.passed = false;
          } else if (rule.type === "boolean" && value !== undefined) {
            fieldValidation.rules.push({ type: "boolean", passed: true });
          }

          validationDetails.push(fieldValidation);
        }

        stepLog.input = {
          rulesCount: step.rules?.length || 0,
          fieldsValidated: validationDetails,
        };

        if (Object.keys(errors).length > 0) {
          stepLog.output = {
            valid: false,
            errors: errors,
            errorCount: Object.keys(errors).length,
          };
          throw Object.assign(new Error("Input validation failed"), {
            details: errors,
          });
        }

        vars[step.output || "validated"] = true;

        stepLog.output = {
          valid: true,
          allFieldsPassed: true,
        };

        logger.debug("Input validation completed", {
          executionId,
          stepIndex: index,
          valid: true,
        });
      }

      // ------------------------------------------------
      // DB FIND
      // ------------------------------------------------
      else if (step.type === "dbFind") {
        const collectionName = step.collection;
        const Model = getModel(collectionName);

        if (!Model) {
          throw new Error(`Model not found for collection: ${collectionName}`);
        }

        const filters = resolveObject(vars, step.filters || {});

        stepLog.input = {
          collection: collectionName,
          findType: step.findType || "one",
          filters: filters,
        };

        const result =
          step.findType === "many"
            ? await Model.find(filters)
            : await Model.findOne(filters);

        vars[step.output || "found"] = result;

        stepLog.output = {
          found: result !== null,
          resultCount: Array.isArray(result) ? result.length : result ? 1 : 0,
          outputVariable: step.output || "found",
          preview: Array.isArray(result)
            ? result.slice(0, 2).map((r) => ({ _id: r._id }))
            : result
            ? { _id: result._id }
            : null,
        };

        logger.debug("DB find completed", {
          executionId,
          stepIndex: index,
          collection: collectionName,
          found: result !== null,
        });
      }

      // ------------------------------------------------
      // DB INSERT
      // ------------------------------------------------
      else if (step.type === "dbInsert") {
        const collectionName = step.collection;
        const Model = getModel(collectionName);

        if (!Model) {
          throw new Error(`Model not found for collection: ${collectionName}`);
        }

        const resolved = resolveObject(vars, step.data || {});

        // 🔥 UNWRAP DATA LIKE EXECUTION ENGINE
        const data =
          resolved &&
          typeof resolved === "object" &&
          "data" in resolved &&
          typeof resolved.data === "object"
            ? resolved.data
            : resolved;

        const inputData = { ...data };
        const hadPassword = !!data.password;

        if (data.password) {
          data.password = await bcrypt.hash(data.password, 10);
        }

        stepLog.input = {
          collection: collectionName,
          dataFields: Object.keys(inputData),
          passwordHashed: hadPassword,
        };

        const created = await Model.create(data);
        vars[step.output || "created"] = created;

        stepLog.output = {
          success: true,
          documentId: created._id,
          outputVariable: step.output || "created",
          document: created,
        };

        logger.debug("DB insert completed", {
          executionId,
          stepIndex: index,
          collection: collectionName,
          documentId: created._id,
        });
      }

      // ------------------------------------------------
      // DB UPDATE
      // ------------------------------------------------
      else if (step.type === "dbUpdate") {
        const Model = getModel(step.collection);

        if (!Model) {
          throw new Error(`Model not found for collection: ${step.collection}`);
        }

        const filter = resolveObject(vars, step.filter || {});
        const resolved = resolveObject(vars, step.data || {});

        // 🔥 UNWRAP DATA LIKE EXECUTION ENGINE
        const data =
          resolved &&
          typeof resolved === "object" &&
          "data" in resolved &&
          typeof resolved.data === "object"
            ? resolved.data
            : resolved;

        stepLog.input = {
          collection: step.collection,
          filter: filter,
          updateFields: Object.keys(data),
        };

        const updated = await Model.findOneAndUpdate(
          filter,
          { $set: data },
          { new: true }
        );

        vars[step.output || "updated"] = updated;

        stepLog.output = {
          success: true,
          documentFound: updated !== null,
          documentId: updated?._id,
          outputVariable: step.output || "updated",
          document: updated,
        };

        logger.debug("DB update completed", {
          executionId,
          stepIndex: index,
          collection: step.collection,
          documentFound: updated !== null,
        });
      }

      // ------------------------------------------------
      // AUTH
      // ------------------------------------------------
      else if (step.type === "authMiddleware") {
        const auth = headers.authorization || headers.Authorization;

        stepLog.input = {
          hasAuthHeader: !!auth,
          authType: auth?.split(" ")[0],
        };

        if (!auth?.startsWith("Bearer ")) {
          throw new Error("Missing or invalid Authorization header");
        }

        const token = auth.split(" ")[1];

        if (!process.env.JWT_SECRET) {
          throw new Error("JWT_SECRET is not configured");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        vars.currentUser = decoded;

        stepLog.output = {
          authenticated: true,
          userId: (decoded as any).userId || (decoded as any).id,
          outputVariable: "currentUser",
        };

        logger.debug("Auth middleware completed", {
          executionId,
          stepIndex: index,
          userId: (decoded as any).userId || (decoded as any).id,
        });
      }

      // ------------------------------------------------
      // JWT GENERATE
      // ------------------------------------------------
      else if (step.type === "jwtGenerate") {
        if (!process.env.JWT_SECRET) {
          throw new Error("JWT_SECRET is not configured");
        }

        const payload = resolveObject(vars, step.payload || {});
        const expiresIn = step.expiresIn || "7d";
        const algorithm = step.algorithm || "HS256";

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn,
          algorithm: algorithm as any,
        });

        const outputVar = step.outputVar || step.output || "token";
        vars[outputVar] = token;

        stepLog.input = {
          payload,
          expiresIn,
          algorithm,
        };

        stepLog.output = {
          tokenGenerated: true,
          outputVariable: outputVar,
          expiresIn,
        };

        logger.debug("JWT generate completed", {
          executionId,
          stepIndex: index,
          outputVariable: outputVar,
        });
      }

      // ------------------------------------------------
      // EMAIL
      // ------------------------------------------------
      else if (step.type === "emailSend") {
        const to = resolveObject(vars, step.to);
        const subject = resolveObject(vars, step.subject);
        const body = resolveObject(vars, step.body);

        // Validate email inputs
        if (!to || typeof to !== "string") {
          throw new Error(
            "Email recipient (to) is required and must be a valid string"
          );
        }

        if (!subject || typeof subject !== "string") {
          throw new Error(
            "Email subject is required and must be a valid string"
          );
        }

        if (!body) {
          throw new Error("Email body is required");
        }

        stepLog.input = {
          to: to,
          subject: subject,
          bodyLength: body?.length || 0,
          bodyPreview:
            body?.substring(0, 100) + (body?.length > 100 ? "..." : ""),
        };

        try {
          const emailResult = await sendEmail({ to, subject, body });

          stepLog.output = {
            sent: true,
            recipient: to,
            timestamp: new Date().toISOString(),
          };

          logger.debug("Email send completed", {
            executionId,
            stepIndex: index,
            recipient: to,
          });
        } catch (emailError: any) {
          throw new Error(
            `Failed to send email to ${to}: ${
              emailError.message || "Unknown email service error"
            }`
          );
        }
      }

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------
      else if (step.type === "response") {
        const status = step.status || 200;
        const body = resolveObject(vars, step.body || {});

        stepLog.input = {
          status,
          bodyKeys: Object.keys(body),
        };

        stepLog.output = {
          status,
          body,
        };

        // Store the response to be returned
        vars._response = {
          status,
          body,
        };

        logger.debug("Response step completed", {
          executionId,
          stepIndex: index,
          status,
        });
      }

      // ------------------------------------------------
      // UNKNOWN
      // ------------------------------------------------
      else {
        throw new Error(`Unknown step type: ${step.type}`);
      }

      stepLog.durationMs = Date.now() - stepStart;
      stepResponses.push(stepLog);

      // Emit step_complete event
      socketServer.emitExecutionLog(executionId, {
        type: "step_complete",
        stepIndex: index,
        stepType: step.type,
        stepName,
        timestamp: new Date().toISOString(),
        durationMs: stepLog.durationMs,
        output: stepLog.output,
      });
    } catch (err: any) {
      stepLog.status = "failed";
      stepLog.error = {
        message: err.message || "Unknown error occurred",
        code: err.code || null,
        details: err.details || null,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      };
      stepLog.durationMs = Date.now() - stepStart;

      logger.error("Step failed", {
        executionId,
        stepIndex: index,
        stepType: step.type,
        stepName,
        error: err.message,
      });

      stepResponses.push(stepLog);

      // Emit step_error event
      socketServer.emitExecutionLog(executionId, {
        type: "step_error",
        stepIndex: index,
        stepType: step.type,
        stepName,
        timestamp: new Date().toISOString(),
        error: err.message || "Unknown error occurred",
        durationMs: stepLog.durationMs,
      });

      return {
        ok: false,
        failedStep: index,
        failedStepName: stepName,
        error: err.message || "Unknown error occurred",
        errorDetails: err.details || null,
        steps: stepResponses,
        totalDurationMs: Date.now() - startedAt,
      };
    }
  }

  logger.info("Workflow engine completed", {
    executionId,
    stepsExecuted: stepResponses.length,
    totalDurationMs: Date.now() - startedAt,
  });

  // Emit workflow_complete event
  socketServer.emitExecutionLog(executionId, {
    type: "workflow_complete",
    timestamp: new Date().toISOString(),
    data: {
      stepsExecuted: stepResponses.length,
      totalDurationMs: Date.now() - startedAt,
    },
  });

  // If there's a response step, return its value
  if (vars._response) {
    return vars._response.body;
  }

  return {
    ok: true,
    stepsExecuted: stepResponses.length,
    steps: stepResponses,
    output: vars,
    totalDurationMs: Date.now() - startedAt,
  };
}
