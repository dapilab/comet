import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

import { renderModelAttribute, renderExampleSchema } from "libs/render";

require("./index.scss");

export default class ResponsesRender extends Component {
  static propTypes = {
    responses: PropTypes.object
  };

  static defaultProps = {
    responses: {}
  }

  constructor(props) {
    super(props);
    this.state = {
      currentMode: "model",
      statusCodeIdx: 0
    };
  }

  changeMode(mode) {
    const { currentMode } = this.state;
    if (currentMode === mode) return;
    this.setState({ currentMode: mode });
  }

  changeStatusCode(idx) {
    const { statusCodeIdx } = this.state;
    if (statusCodeIdx === idx) return;
    this.setState({
      statusCodeIdx: idx
    });
  }

  render() {
    const { responses } = this.props;
    const { currentMode, statusCodeIdx } = this.state;

    const statusCodes = Object.keys(responses);
    const statusCode = statusCodes[statusCodeIdx];

    const contentType = statusCode && responses[statusCode] && responses[statusCode].content && Object.keys(responses[statusCode].content)[0] || null;
    const contentSchema = contentType && responses[statusCode].content[contentType].schema || null;
    const description = statusCode && responses[statusCode] && responses[statusCode].description || "";

    let schemElem;
    if (contentSchema) {
      if (currentMode === "model") {
        schemElem = renderModelAttribute(null, contentSchema, { alwaysShowCurrent: true });
      }
      if (currentMode === "example") {
        schemElem = renderExampleSchema(contentSchema);
      }
    }
    return (
      <div className="ResponsesRender pt-5">
        {/* Header */}
        <div className="pt-2 flex items-center mb-2">
          {/* Title */}
          <div className="gradientBorder mr-4">
            <p className="text-white text-sm relative leading-none">Response</p>
          </div>
          {/* Statuc code */}
          <div className="flex flex-wrap">
            {statusCodes.map((statusCode, idx) => (
              <span
                key={statusCode}
                onClick={this.changeStatusCode.bind(this, idx)}
                className={classnames("w-8 mr-2 block cursor-pointer transition-20", {
                  "font-bold": idx === statusCodeIdx,
                  "blue-purple": idx === statusCodeIdx && String(statusCode)[0] === "2",
                  purple: idx === statusCodeIdx && String(statusCode)[0] === "3",
                  orange: idx === statusCodeIdx && String(statusCode)[0] === "4",
                  red: idx === statusCodeIdx && String(statusCode)[0] === "5",
                  "grey-light hover:opacity-75": idx !== statusCodeIdx
                })}>
                {statusCode}
              </span>
            ))}
          </div>
        </div>

        {/* Content-type and description */}
        {(contentType || description) &&
          <p className="leading-tight text-sm grey-light pb-1">
            {/* Content type */}
            {contentType && <span>{contentType}</span>}
            {/* Divider */}
            {contentType && description && <span className="inline-block mr-1">,</span>}
            {/* Description */}
            {description && <span>{description}</span>}
          </p>
        }

        {/* Example or schema */}
        <div className="flex items-center">
          <p
            className={classnames("transition-20 cursor-pointer hover:text-white pr-2", {
              "grey-light": currentMode !== "model",
              "text-white": currentMode === "model"
            })}
            onClick={this.changeMode.bind(this, "model")}>
            schema
          </p>
          <p
            className={classnames("transition-20 cursor-pointer hover:text-white", {
              "grey-light": currentMode !== "example",
              "text-white": currentMode === "example"
            })}
            onClick={this.changeMode.bind(this, "example")}>
            example
          </p>
        </div>

        {/* Content */}
        <div className="text-sm grey -mt-1">
          {schemElem}
        </div>
      </div>
    );
  }
}
