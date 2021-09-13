import React, { Component } from "react";
import PropTypes from "prop-types";
import YAML from "js-yaml";
import CodeMirror from "codemirror";
import { v4 as uuidv4 } from "uuid";
import classnames from "classnames";

import { componentStore } from "stores";

import "codemirror/mode/yaml/yaml";
import "codemirror/mode/yaml-frontmatter/yaml-frontmatter";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/lint/lint";

import openapiLint from "libs/codeMirror/openapiLint";

require("codemirror/lib/codemirror.css");
require("codemirror/addon/hint/show-hint.css");
require("codemirror/addon/lint/lint.css");
require("./index.scss");

export default class CodeMirrorComponet extends Component {
  static propTypes = {
    id: PropTypes.string,
    className: PropTypes.string,
    projectId: PropTypes.string,
    type: PropTypes.oneOf(["endpoint", "component"]),
    initialJSONValue: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    parseAndSave: PropTypes.func,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.codeMirrorId = `CodeMirror-${props.id || uuidv4()}`;
    this.myCodeMirror = null;
    this.codeMirrorFirstLint = false;

    this.dataForSave = null;
  }

  async componentDidMount() {
    const { codeMirrorId } = this;
    const { initialJSONValue, type } = this.props;
    const yamlString = YAML.dump(initialJSONValue);

    // Initial code mirror
    const htmlElem = document.getElementById(codeMirrorId);

    this.myCodeMirror = CodeMirror(htmlElem, {
      value: yamlString.replace(/\n$/, ""),
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
        getAnnotations: type ? openapiLint(type) : null,
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
      const { type } = this.props;
      if (!type) return;

      const { line, ch } = cm.getCursor();
      const matchContent = "$ref:";
      const aroundContent = cm.getRange({
        line, ch: ch - matchContent.length
      }, {
        line, ch: ch + matchContent.length
      });
      const matched = aroundContent.match(/\$ref:/);
      if (matched) {
        const { projectId } = this.props;
        const hintCol = ch + matched.index + 1;
        const listByRankingInProject = componentStore.listByRanking[projectId];

        const hasSpaceAfter = aroundContent.match(/\$ref:\s{1}/);
        const textPre = hasSpaceAfter ? "" : " ";

        if (listByRankingInProject) {
          const hintModelNames = listByRankingInProject
            .map((item) => (componentStore.data[item.id]
              ? componentStore.data[item.id].name
              : ""))
            .filter((modelName) => modelName.trim())
            .map((modelName) => ({
              text: `${textPre}'#/components/schemas/${modelName}'`,
              displayText: modelName
            }));
          CodeMirror.showHint(cm, () => ({
            list: hintModelNames,
            from: CodeMirror.Pos(line, hintCol),
            to: CodeMirror.Pos(line, hintCol)
          }));
        }
      }
    });

    this.myCodeMirror.on("change", () => {
      const { onChange } = this.props;
      if (onChange) {
        onChange(this.myCodeMirror.getValue().trim());
      }
    });
  }

  parseAndSave(json) {
    const { parseAndSave } = this.props;
    if (parseAndSave) parseAndSave(json);
    this.dataForSave = null;
  }

  // Called by outside update, e.g. update enpoint method directly
  refreshContent(json) {
    const yamlString = YAML.dump(json);
    this.myCodeMirror.setValue(yamlString);
  }

  render() {
    const { className } = this.props;
    return (
      <div
        id={this.codeMirrorId}
        className={classnames("apiDetailCodeMirror", className)} />
    );
  }
}
