import React, { Component } from "react";
import PropTypes from "prop-types";
import CodeMirror from "codemirror";
import YAML from "js-yaml";

import "codemirror/mode/yaml/yaml";
import "codemirror/mode/yaml-frontmatter/yaml-frontmatter";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/lint/lint";

import { appStore, componentStore } from "stores";

import openapiLint from "libs/codeMirror/openapiLint";

require("codemirror/lib/codemirror.css");
require("codemirror/addon/hint/show-hint.css");
require("codemirror/addon/lint/lint.css");

export default class CodeMirrorComponet extends Component {
  static propTypes = {
    className: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.codeMirrorId = "CodeMirror-full-schema";
    this.myCodeMirror = null;
    this.codeMirrorFirstLint = false;
  }

  async componentDidMount() {
    const schema = appStore.toOPENAPI();
    const yamlString = YAML.dump(schema);
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
        getAnnotations: openapiLint("full")
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

  getValue() {
    const yaml = this.myCodeMirror.getValue().trim();
    if (!yaml) return;
    const json = YAML.load(yaml, {
      schema: YAML.CORE_SCHEMA
    });
    return json;
  }

  render() {
    const { className } = this.props;
    return (
      <div
        id={this.codeMirrorId}
        className={className} />
    );
  }
}
