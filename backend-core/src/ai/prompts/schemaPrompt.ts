export const schemaPrompt = `
WORKFLOW JSON SCHEMA (STRICT)
=============================

{
  "nodes": [
    {
      "id": "step1",  // MUST be step1, step2, step3, etc.
      "type": "allowed-type",
      "data": {
        "label": "string",
        "fields": {}
      }
    }
  ],
  "edges": [
    {
      "id": "edge1",  // MUST be edge1, edge2, edge3, etc.
      "source": "step1",  // MUST match a node id (step1, step2, etc.)
      "target": "step2"   // MUST match a node id (step1, step2, etc.)
    }
  ]
}

CRITICAL NODE ID RULES:
- Node IDs MUST be: step1, step2, step3, step4, etc.
- Edge IDs MUST be: edge1, edge2, edge3, edge4, etc.
- Edge source/target MUST reference actual node IDs (step1, step2, etc.)
- NEVER use node types as IDs (e.g., "input", "validation")

=====================================================
NODE FIELD DEFINITIONS
=====================================================

INPUT
-----
fields.variables: Array<{ name: string, type?: string }>

INPUT VALIDATION
----------------
fields.rules: Array<{
  field: "{{variable}}",
  required?: boolean,
  type?: string
}>

DB FIND
-------
fields.collection
fields.findType
fields.filters
fields.outputVar

DB INSERT
---------
fields.collection
fields.data
fields.outputVar

DB UPDATE
---------
fields.collection
fields.filters
fields.update
fields.outputVar

DB DELETE
---------
fields.collection
fields.filters
fields.outputVar

EMAIL SEND
----------
fields.to
fields.subject
fields.body
fields.outputVar

USER LOGIN
----------
fields.email
fields.password
fields.outputVar

AUTH MIDDLEWARE
---------------
fields: {}

RESPONSE
--------
fields.statusCode
fields.body

=====================================================
IMPORTANT
=====================================================

- node.data.label is REQUIRED
- NEVER omit label
- NEVER invent fields
`;
