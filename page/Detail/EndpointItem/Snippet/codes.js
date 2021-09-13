export default [
  {
    name: "Header parameter",
    snippet: [{
      in: "header",
      name: "Content-Type",
      schema: {
        type: "string",
        example: "application/json"
      }
    }]
  },
  {
    name: "Path parameter",
    snippet: [{
      in: "path",
      name: "id",
      required: true,
      schema: {
        type: "string"
      }
    }]
  },
  {
    name: "Query parameter",
    snippet: [{
      in: "query",
      name: "filter",
      schema: {
        type: "string"
      }
    }]
  },
  {
    name: "Request body",
    snippet: {
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string"
                }
              }
            }
          }
        }
      }
    }
  },
  {
    name: "Response",
    snippet: {
      responses: {
        200: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: {
                    type: "string"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  {
    name: "All Of",
    snippet: {
      allOf: [{
        type: "object",
        properties: {
          name: {
            type: "string"
          }
        }
      }, {
        type: "object",
        properties: {
          age: {
            type: "integer"
          }
        }
      }]
    }
  },
  {
    name: "One Of",
    snippet: {
      oneOf: [{
        type: "string",
        example: "value"
      }, {
        type: "object",
        properties: {
          attr: {
            type: "string",
            example: "value"
          }
        }
      }]
    }
  },
  {
    name: "Object",
    snippet: {
      type: "object",
      required: ["name"],
      properties: {
        name: {
          type: "string"
        }
      }
    }
  },
  {
    name: "Array",
    snippet: {
      type: "array",
      items: {
        type: "string"
      }
    }
  },
  {
    name: "String",
    snippet: {
      type: "string",
      example: "YYYY-MM-DD HH:mm",
      enum: ["value1", "value2"],
      required: true,
      format: "date"
    }
  },
  {
    name: "Integer",
    snippet: {
      type: "integer",
      minimum: 0,
      maximum: 10
    }
  },
  {
    name: "Number",
    snippet: {
      type: "number",
      format: "float"
    }
  },
  {
    name: "Boolean",
    snippet: {
      type: "boolean",
      default: false
    }
  },
  {
    name: "Null",
    snippet: {
      type: "integer",
      nullable: true
    }
  }
];
