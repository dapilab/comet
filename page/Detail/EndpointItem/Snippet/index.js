import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import { CopyToClipboard } from "react-copy-to-clipboard";
import YAML from "js-yaml";

import codes from "./codes";
import CodeMirror from "../../CodeMirror";

require("./index.scss");

export default class Snippet extends Component {
  static propTypes = {
    className: PropTypes.string,
    close: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.state = {
      text: [],
      copied: new Set()
    };
  }

  componentWillUnmount() {
    this.unmount = true;
  }

  changeText(idx, str) {
    const { text } = this.state;
    text[idx] = str;
    this.setState({ text });
  }

  onCopy(idx) {
    const { close } = this.props;
    const { copied } = this.state;
    copied.add(idx);
    this.setState({ copied }, () => {
      setTimeout(() => {
        if (close) return close();
        if (this.unmount) return;
        const { copied } = this.state;
        copied.delete(idx);
        this.setState({
          copied
        });
      }, 100);
    });
  }

  render() {
    const { className } = this.props;
    const { text, copied } = this.state;
    return (
      <div className={classnames("Snippet overflow-y-auto", className)}>
        {codes.map((code, idx) => (
          <div key={idx} className="flex items-center snippetItem">
            {/* Code mirror */}
            <CodeMirror
              className="codeMirror fullRounded dark self-baseline"
              initialJSONValue={code.snippet}
              onChange={this.changeText.bind(this, idx)} />

            {/* Name and copy button */}
            <div className="flex flex-col justify-center whitespace-pre items-center ml-5 w-48">
              <p className="font-bold font-sf text-white leading-loose">{code.name}</p>
              <CopyToClipboard
                text={text[idx] || YAML.dump(code.snippet)}
                onCopy={this.onCopy.bind(this, idx)}>
                <button className="flex items-center justify-center btn green-border text-xs font-bold font-sf py-1 w-28 leading-none">
                  <i className="iconfont iconsuggest mr-1" />
                  <p>{copied.has(idx) ? "Copied" : "Copy"}</p>
                </button>
              </CopyToClipboard>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
