import CodeMirror from "codemirror";
import YAML_JS from "yaml-js";
import JS_YAML from "js-yaml";

import ajv from "libs/ajv";
import openAPIEndpointSchema from "./openAPIEndpoint.yaml";
import openAPIComponentSchema from "./openAPIComponent.yaml";
import openAPIFullSchema from "./openAPI.yaml";

/**
 * "/~1users/get/parameters/0" -> ['/users', 'get'. 'parameters', '0']
 * "/paths/~1api~1blacklists~1/post" -> ['paths','/api/blacklists/', 'post']
 */
const extractDataPath = (dataPath) => dataPath
  .split("/")
  .slice(1)
  .map((item) => item.replace(/~1/g, "/"));

const findLine = (current, pathArray, last) => {
  const isObject = current.tag === "tag:yaml.org,2002:map";
  const isArray = current.tag === "tag:yaml.org,2002:seq";
  const currentPath = pathArray[0];

  if (!current) return 0;

  if (pathArray.length > 0) {
    if (isObject) {
      let result = 0;
      for (const childNode of current.value) {
        const [scalarNode, mappingNode] = childNode;
        // console.log('scalarNode.value', scalarNode.value)
        if (scalarNode.value === currentPath) {
          result = findLine(mappingNode, pathArray.slice(1), current);
          break;
        }
        if (scalarNode.value === currentPath.replace(/\[.*/, "")) {
          // access the array at the index in the path (example: grab the 2 in "tags[2]")
          // var index = parseInt(path[0].match(/\[(.*)\]/)[1])
          // if(value.value.length === 1 && index !== 0 && !!index) {
          //   var nextVal = lodashFind(value.value[0], { value: index.toString() })
          // } else { // eslint-disable-next-line no-redeclare
          //   var nextVal = value.value[index]
          // }
          // return find(nextVal, path.slice(1), value.value)
        }
      }
      return result;
    }

    if (isArray) {
      const sequenceNode = current.value;
      const index = parseInt(currentPath, 10);
      const node = sequenceNode[index];

      if (node && node.tag) {
        return findLine(node, pathArray.slice(1), sequenceNode);
      }
    }
  }

  if (isObject && !Array.isArray(last)) {
    return current.start_mark.line;
  }
  return current.start_mark.line + 1;
};

export default function openapiLint(type = "full") {
  return async (yaml) => {
    try {
      let validator;
      switch (type) {
        case "full": {
          validator = ajv.compile(openAPIFullSchema);
          break;
        }
        case "endpoint": {
          validator = ajv.compile(openAPIEndpointSchema);
          break;
        }
        case "component": {
          validator = ajv.compile(openAPIComponentSchema);
          break;
        }
      }

      let json;
      try {
        json = JS_YAML.load(yaml);
      } catch (err) {
        const linePos = err.mark && err.mark.line && CodeMirror.Pos(err.mark.line) || CodeMirror.Pos(0);
        return [{
          from: linePos,
          to: linePos,
          message: err.reason || "invalid yaml format"
        }];
      }

      const valid = validator(json);
      if (!valid) {
        const ast = YAML_JS.compose(yaml);
        return validator.errors
          .map((error) => {
            const pathArray = extractDataPath(error.dataPath);
            const lineNo = findLine(ast, pathArray);
            return {
              from: CodeMirror.Pos(lineNo),
              to: CodeMirror.Pos(lineNo),
              message: error.message
            };
          });
      }
      return [];
    } catch (err) {
      return [];
    }
  };
}
