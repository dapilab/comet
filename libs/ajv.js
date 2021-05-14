import Ajv from "ajv";
import AjvErrors from "ajv-errors";
import AjvKeywords from "ajv-keywords";

const ajv = new Ajv({
  schemaId: "id",
  allErrors: true,
  jsonPointers: true,
  logger: false
});
AjvKeywords(ajv, "switch");
AjvErrors(ajv);

ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"));

export default ajv;
