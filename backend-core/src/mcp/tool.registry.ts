/**
 * MCP Tool Registry
 * Registers and manages MCP tools dynamically
 * Wraps existing workflow node handlers as MCP tools
 */

import { MCPTool } from "./schemas";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { resolveObject } from "../utils/resolveValue";
import { sendEmail } from "../utils/email";
import { getModel } from "../db/getModel";
import { logger } from "../utils/logger";

class ToolRegistry {
  private tools: Map<string, MCPTool> = new Map();

  /**
   * Register a new MCP tool
   */
  registerTool(tool: MCPTool): void {
    if (this.tools.has(tool.toolId)) {
      logger.warn(`Tool ${tool.toolId} already registered, overwriting`);
    }
    this.tools.set(tool.toolId, tool);
    logger.info(`Tool registered: ${tool.toolId} (${tool.name})`);
  }

  /**
   * Get a tool by ID
   */
  getTool(toolId: string): MCPTool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * List all registered tools
   */
  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Check if a tool exists
   */
  hasTool(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  /**
   * Remove a tool
   */
  unregisterTool(toolId: string): boolean {
    return this.tools.delete(toolId);
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();

/**
 * Register built-in tools from existing workflow nodes
 * These wrap the existing business logic handlers
 */
export function registerBuiltInTools(): void {
  // INPUT TOOL
  toolRegistry.registerTool({
    toolId: "input",
    name: "Input",
    description: "Reads user input variables",
    inputSchema: {
      type: "object",
      properties: {
        variables: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string" },
              required: { type: "boolean" },
              default: {},
            },
          },
        },
      },
      required: ["variables"],
    },
    outputSchema: {
      type: "object",
      properties: {
        variables: {
          type: "object",
          description: "Extracted input variables",
        },
      },
    },
    handler: async (input: any, context: any) => {
      // Debug logging
      logger.debug('[input tool] Handler called', {
        hasInput: !!input,
        hasContext: !!context,
        hasVars: !!context?.vars,
        contextKeys: context ? Object.keys(context) : [],
        varsKeys: context?.vars ? Object.keys(context.vars) : [],
      });

      if (!context || !context.vars) {
        throw new Error('Context or context.vars is undefined');
      }

      const { variables } = input;
      const inputData = context.vars.input?.input || context.vars.input || {};
      const result: Record<string, any> = {};

      for (const v of variables) {
        const varName = v.name;
        if (varName in inputData) {
          result[varName] = inputData[varName];
          context.vars[varName] = inputData[varName];
        } else if (v.default !== undefined) {
          result[varName] = v.default;
          context.vars[varName] = v.default;
        } else {
          result[varName] = null;
          context.vars[varName] = null;
        }
      }

      return { variables: result };
    },
  });

  // INPUT VALIDATION TOOL
  toolRegistry.registerTool({
    toolId: "inputValidation",
    name: "Input Validation",
    description: "Validates input fields using rules",
    inputSchema: {
      type: "object",
      properties: {
        rules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              required: { type: "boolean" },
              type: { type: "string" },
              minLength: { type: "number" },
            },
          },
        },
      },
      required: ["rules"],
    },
    outputSchema: {
      type: "object",
      properties: {
        valid: { type: "boolean", description: "Validation result" },
      },
    },
    handler: async (input: any, context: any) => {
      const { rules } = input;
      const errors: Record<string, string[]> = {};

      for (const rule of rules) {
        const value = resolveObject(context.vars, rule.field);

        if (
          rule.required &&
          (value === undefined || value === null || value === "")
        ) {
          errors[rule.field] = errors[rule.field] || [];
          errors[rule.field].push("Field is required");
        }

        if (
          rule.type === "number" &&
          value !== undefined &&
          isNaN(Number(value))
        ) {
          errors[rule.field] = errors[rule.field] || [];
          errors[rule.field].push("Expected number");
        }

        if (
          rule.type === "string" &&
          value !== undefined &&
          typeof value !== "string"
        ) {
          errors[rule.field] = errors[rule.field] || [];
          errors[rule.field].push("Expected string");
        }

        if (
          rule.type === "email" &&
          value !== undefined &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          errors[rule.field] = errors[rule.field] || [];
          errors[rule.field].push("Invalid email format");
        }
      }

      if (Object.keys(errors).length > 0) {
        throw Object.assign(new Error("Input validation failed"), {
          details: errors,
        });
      }

      return { valid: true };
    },
  });

  // DB FIND TOOL
  toolRegistry.registerTool({
    toolId: "dbFind",
    name: "Database Find",
    description: "Finds document(s) in MongoDB collection",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string" },
        findType: { type: "string", enum: ["one", "many"] },
        filters: { type: "object" },
        output: { type: "string" },
      },
      required: ["collection", "filters"],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean", description: "Whether document(s) were found" },
        resultCount: { type: "number", description: "Number of results" },
        data: { type: "object", description: "Found document(s)" },
      },
    },
    handler: async (input: any, context: any) => {
      const { collection, findType = "one", filters, output = "found" } = input;
      const Model = getModel(collection);

      if (!Model) {
        throw new Error(`Model not found for collection: ${collection}`);
      }

      const resolvedFilters = resolveObject(context.vars, filters);
      const result =
        findType === "many"
          ? await Model.find(resolvedFilters)
          : await Model.findOne(resolvedFilters);

      context.vars[output] = result;

      return {
        found: result !== null,
        resultCount: Array.isArray(result) ? result.length : result ? 1 : 0,
        data: result,
      };
    },
  });

  // DB INSERT TOOL
  toolRegistry.registerTool({
    toolId: "dbInsert",
    name: "Database Insert",
    description: "Inserts a new document into MongoDB collection",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string" },
        data: { type: "object" },
        output: { type: "string" },
      },
      required: ["collection", "data"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean", description: "Insert success status" },
        documentId: { type: "string", description: "Created document ID" },
        data: { type: "object", description: "Created document" },
      },
    },
    handler: async (input: any, context: any) => {
      const { collection, data, output = "created" } = input;
      const Model = getModel(collection);

      if (!Model) {
        throw new Error(`Model not found for collection: ${collection}`);
      }

      const resolved = resolveObject(context.vars, data);
      const documentData =
        resolved &&
        typeof resolved === "object" &&
        "data" in resolved &&
        typeof resolved.data === "object"
          ? resolved.data
          : resolved;

      // Hash password if present
      if (documentData.password) {
        documentData.password = await bcrypt.hash(documentData.password, 10);
      }

      const created = await Model.create(documentData);
      context.vars[output] = created;

      return {
        success: true,
        documentId: created._id,
        data: created,
      };
    },
  });

  // DB UPDATE TOOL
  toolRegistry.registerTool({
    toolId: "dbUpdate",
    name: "Database Update",
    description: "Updates document(s) in MongoDB collection",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string" },
        filter: { type: "object" },
        data: { type: "object" },
        output: { type: "string" },
      },
      required: ["collection", "filter", "data"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean", description: "Update success status" },
        documentFound: { type: "boolean", description: "Whether document was found" },
        data: { type: "object", description: "Updated document" },
      },
    },
    handler: async (input: any, context: any) => {
      const { collection, filter, data, output = "updated" } = input;
      const Model = getModel(collection);

      if (!Model) {
        throw new Error(`Model not found for collection: ${collection}`);
      }

      const resolvedFilter = resolveObject(context.vars, filter);
      const resolved = resolveObject(context.vars, data);
      const updateData =
        resolved &&
        typeof resolved === "object" &&
        "data" in resolved &&
        typeof resolved.data === "object"
          ? resolved.data
          : resolved;

      const updated = await Model.findOneAndUpdate(
        resolvedFilter,
        { $set: updateData },
        { new: true }
      );

      context.vars[output] = updated;

      return {
        success: true,
        documentFound: updated !== null,
        data: updated,
      };
    },
  });

  // AUTH MIDDLEWARE TOOL
  toolRegistry.registerTool({
    toolId: "authMiddleware",
    name: "Auth Middleware",
    description: "Verifies JWT token from Authorization header",
    inputSchema: {
      type: "object",
      properties: {
        output: { type: "string" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        authenticated: { type: "boolean", description: "Authentication status" },
        userId: { type: "string", description: "Authenticated user ID" },
        user: { type: "object", description: "Decoded user data" },
      },
    },
    handler: async (input: any, context: any) => {
      const { output = "currentUser" } = input;
      const auth =
        context.headers.authorization || context.headers.Authorization;

      if (!auth?.startsWith("Bearer ")) {
        throw new Error("Missing or invalid Authorization header");
      }

      const token = auth.split(" ")[1];

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      context.vars[output] = decoded;

      return {
        authenticated: true,
        userId: (decoded as any).userId || (decoded as any).id,
        user: decoded,
      };
    },
  });

  // JWT GENERATE TOOL
  toolRegistry.registerTool({
    toolId: "jwtGenerate",
    name: "JWT Generate",
    description: "Generates a JWT token with the provided payload",
    inputSchema: {
      type: "object",
      properties: {
        payload: { type: "object" },
        expiresIn: { type: "string" },
        algorithm: { type: "string" },
        output: { type: "string" },
      },
      required: ["payload"],
    },
    outputSchema: {
      type: "object",
      properties: {
        tokenGenerated: { type: "boolean", description: "Token generation status" },
        token: { type: "string", description: "Generated JWT token" },
      },
    },
    handler: async (input: any, context: any) => {
      const {
        payload,
        expiresIn = "7d",
        algorithm = "HS256",
        output = "token",
      } = input;

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
      }

      const resolvedPayload = resolveObject(context.vars, payload);
      const token = jwt.sign(resolvedPayload, process.env.JWT_SECRET, {
        expiresIn,
        algorithm: algorithm as any,
      });

      context.vars[output] = token;

      return {
        tokenGenerated: true,
        token,
      };
    },
  });

  // EMAIL SEND TOOL
  toolRegistry.registerTool({
    toolId: "emailSend",
    name: "Email Send",
    description: "Sends an email using configured mail service",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["to", "subject", "body"],
    },
    outputSchema: {
      type: "object",
      properties: {
        sent: { type: "boolean", description: "Email send status" },
        recipient: { type: "string", description: "Email recipient" },
        timestamp: { type: "string", description: "Send timestamp" },
      },
    },
    handler: async (input: any, context: any) => {
      const to = resolveObject(context.vars, input.to);
      const subject = resolveObject(context.vars, input.subject);
      const body = resolveObject(context.vars, input.body);

      // Debug logging
      logger.debug('[emailSend] Resolving variables', {
        inputTo: input.to,
        resolvedTo: to,
        inputSubject: input.subject,
        resolvedSubject: subject,
        contextVars: Object.keys(context.vars || {}),
        contextVarsValues: context.vars,
      });

      if (!to || typeof to !== "string") {
        logger.error('[emailSend] Invalid recipient', {
          to,
          typeOfTo: typeof to,
          inputTo: input.to,
          contextVars: Object.keys(context.vars || {}),
        });
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

      // Send email but don't fail the workflow if it fails
      const result = await sendEmail({ to, subject, body });

      return {
        sent: result.success,
        recipient: to,
        timestamp: new Date().toISOString(),
        error: result.success ? undefined : result.error,
      };
    },
  });

  // RESPONSE TOOL
  toolRegistry.registerTool({
    toolId: "response",
    name: "Response",
    description: "Returns a response to the API caller",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "number" },
        body: { type: "object" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        status: { type: "number", description: "HTTP status code" },
        body: { type: "object", description: "Response body" },
      },
    },
    handler: async (input: any, context: any) => {
      const { status = 200, body = {} } = input;
      const resolvedBody = resolveObject(context.vars, body);

      context.vars._response = {
        status,
        body: resolvedBody,
      };

      return {
        status,
        body: resolvedBody,
      };
    },
  });

  // USER LOGIN TOOL
  toolRegistry.registerTool({
    toolId: "userLogin",
    name: "User Login",
    description: "Authenticates user with email and password, returns JWT token",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", default: "users" },
        emailField: { type: "string", default: "email" },
        passwordField: { type: "string", default: "password" },
        email: { type: "string" },
        password: { type: "string" },
        output: { type: "string", default: "user" },
      },
      required: ["email", "password"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean", description: "Login success status" },
        token: { type: "string", description: "JWT token" },
        user: { type: "object", description: "User data (without password)" },
      },
    },
    handler: async (input: any, context: any) => {
      const {
        collection = "users",
        emailField = "email",
        passwordField = "password",
        email,
        password,
        output = "user",
      } = input;

      const Model = getModel(collection);
      if (!Model) {
        throw new Error(`Model not found for collection: ${collection}`);
      }

      // Resolve email and password from context
      const resolvedEmail = resolveObject(context.vars, email);
      const resolvedPassword = resolveObject(context.vars, password);

      // Find user by email
      const user = await Model.findOne({ [emailField]: resolvedEmail });
      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(
        resolvedPassword,
        user[passwordField]
      );
      if (!isValidPassword) {
        throw new Error("Invalid email or password");
      }

      // Generate JWT token
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
      }

      const token = jwt.sign(
        {
          userId: user._id,
          email: user[emailField],
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Remove password from user object
      const userObj = user.toObject();
      delete userObj[passwordField];

      context.vars[output] = userObj;
      context.vars.token = token;

      return {
        success: true,
        token,
        user: userObj,
      };
    },
  });

  logger.info(`Registered ${toolRegistry.listTools().length} built-in tools`);
}
