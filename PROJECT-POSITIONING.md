# FlowForge: Open MCP Control Plane

## What We Actually Built

FlowForge is **not** "a tool that uses Archestra."

FlowForge is an **open MCP orchestration backend** inspired by Archestra that allows developers to:
- Generate MCP servers from natural language
- Attach agents with granular permissions
- Enforce runtime authorization
- Observe execution in real-time

## The Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FlowForge Platform                        │
│                                                              │
│  ┌───────