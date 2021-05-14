import React, { Component } from "react";
import PropTypes from "prop-types";
import CodeMirror from "codemirror";
import YAML from "js-yaml";

import "codemirror/mode/yaml/yaml";
import "codemirror/mode/yaml-frontmatter/yaml-frontmatter";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/lint/lint";

import { endpointStore, componentStore } from "stores";

import openapiLint from "libs/codeMirror/openapiLint";

require("codemirror/lib/codemirror.css");
require("codemirror/addon/hint/show-hint.css");
require("codemirror/addon/lint/lint.css");
require("./index.scss");

export default class CodeMirrorComponet extends Component {
  static propTypes = {
    id: PropTypes.string,
    type: PropTypes.oneOf(["endpoint", "component"])
  }

  constructor(props) {
    super(props);
    this.codeMirrorId = `CodeMirror-${props.id}`;
    this.myCodeMirror = null;
    this.codeMirrorFirstLint = false;
  }

  async componentDidMount() {
    const { id, type } = this.props;

    let openAPIJSON;
    switch (type) {
      case "endpoint":
        openAPIJSON = endpointStore.toOpenAPIFormat(id);
        break;
      case "component":
        openAPIJSON = componentStore.data[id].property;
        break;
    }

    const yamlString = YAML.dump(openAPIJSON);

    // Initial code mirror
    const htmlElem = document.getElementById(this.codeMirrorId);
    this.myCodeMirror = CodeMirror(htmlElem, {
      value: yamlString,
      mode: "yaml",
      tabSize: 2,
      indentUnit: 2,
      indentWithTabs: false,
      smartIndent: true,
      matchBrackets: true,
      viewportMargin: Infinity,
      lineWrapping: true,
      gutters: ["CodeMirror-lint-markers"],
      extraKeys: {
        Tab(cm) {
          if (cm.somethingSelected()) cm.indentSelection("add");
          else cm.replaceSelection("  ");
        }
      },
      lint: {
        getAnnotations: openapiLint(type),
        onUpdateLinting: async (errors) => {
          if (!this.codeMirrorFirstLint) {
            this.codeMirrorFirstLint = true;
            return;
          }

          const hasError = errors.length > 0;
          if (!hasError) {
            try {
              const yaml = this.myCodeMirror.getValue().trim();
              if (!yaml) return;
              const json = YAML.load(yaml, {
                schema: YAML.CORE_SCHEMA
              });
              await this.parseAndSave(json);
            } catch (err) {
              return err;
            }
          }
        }
      }
    });

    // Show hints
    this.myCodeMirror.on("cursorActivity", (cm) => {
      const { line, ch } = cm.getCursor();
      const matchContent = "$ref:";
      const aroundContent = cm.getRange({
        line, ch: ch - matchContent.length
      }, {
        line, ch: ch + matchContent.length
      });
      const matched = aroundContent.match(/\$ref:/);
      if (matched) {
        const hintCol = ch + matched.index + 1;
        const hasSpaceAfter = aroundContent.match(/\$ref:\s{1}/);
        const textPre = hasSpaceAfter ? "" : " ";
        const hintComponentNames = componentStore.list
          .map((componentId) => {
            const component = componentStore.data[componentId];
            return {
              text: `${textPre}'#/components/schemas/${component.name}'`,
              displayText: component.name
            };
          });

        CodeMirror.showHint(cm, () => ({
          list: hintComponentNames,
          from: CodeMirror.Pos(line, hintCol),
          to: CodeMirror.Pos(line, hintCol)
        }));
      }
    });
  }

  async parseAndSave(json) {
    const { id, type } = this.props;
    switch (type) {
      case "endpoint": {
        const url = Object.keys(json)[0];
        const method = Object.keys(json[url])[0];
        const {
          summary: name,
          description,
          tags,
          parameters,
          requestBody,
          responses
        } = json[url][method];
        const data = {
          url: url || null,
          method: method || null,
          tag: tags && tags[0] || null,
          name: name || "",
          description: description || "",
          parameters: parameters || null,
          requestBody: requestBody || null,
          responses: responses || null
        };
        endpointStore.updateById(id, data);
        break;
      }
      case "component": {
        const data = {
          property: json
        };
        componentStore.updateById(id, data);
        break;
      }
    }
  }

  render() {
    return (
      <div id={this.codeMirrorId} />
    );
  }
}
