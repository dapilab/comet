import React, { Component, createRef } from "react";
import PropTypes from "prop-types";

import { appStore } from "stores";

import CodeMirror from "./CodeMirror";

require("./index.scss");

export default class FullSchema extends Component {
  static propTypes = {
    toggleFullSchmea: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.state = {
      isSaving: false,
      isLoadingCodeMirror: true
    };
    this.codemirrorRef = createRef();
  }

  componentDidMount() {
    // TODO: Code mirror load slow for large file
    setTimeout(() => {
      this.setState({
        isLoadingCodeMirror: false
      });
    }, 10);
  }

  onSave() {
    const { toggleFullSchmea } = this.props;
    const { isSaving } = this.state;
    if (isSaving) return;
    this.setState({
      isSaving: true
    }, () => {
      const schemaJSON = this.codemirrorRef.current.getValue();
      appStore.loadFromSchema(schemaJSON);
      appStore.load(appStore.id, schemaJSON);
      toggleFullSchmea();
    });
  }

  render() {
    const { toggleFullSchmea } = this.props;
    const { isSaving, isLoadingCodeMirror } = this.state;
    return (
      <div className="FullSchema flex flex-col items-center justify-center">
        {isLoadingCodeMirror &&
          <div className="codeMirror flex items-center justify-center">
            <p className="text-sm grey font-mono">Loading...</p>
          </div>
        }
        {!isLoadingCodeMirror &&
          <CodeMirror
            className="codeMirror"
            ref={this.codemirrorRef} />
        }
        <div className="flex justify-between mt-5 bottomBtns">
          <a
            href="https://www.buymeacoffee.com/wwayne"
            target="_blank"
            className="buymeacoffeeBtn"
            rel="noopener noreferrer">
            <img
              alt="buymeacoffee"
              src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=wwayne&button_colour=568ef2&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" />
          </a>

          <div className="flex items-center">
            <button
              className="btn primary w-32 text-sm py-2"
              onClick={::this.onSave}>
              {isSaving && "Saving..." || "Save" }
            </button>
            <button
              className="btn secondary-border w-32 text-sm py-2 ml-5"
              onClick={toggleFullSchmea}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
}
