import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import showdown from "showdown";
import DOMPurify from "dompurify";

import MethodSelect from "./MethodSelect/index";
import ParameterRender from "./ParameterRender";
import RequestBodyRender from "./RequestBodyRender";
import ResponsesRender from "./ResponsesRender";
import SubMenu from "components/SubMenu";
import Text from "components/Text";

const converter = new showdown.Converter({ openLinksInNewWindow: true });

require("./index.scss");

export default class RenderEndpoint extends Component {
  static propTypes = {
    className: PropTypes.string,
    endpoint: PropTypes.object.isRequired,
    updateEndpoint: PropTypes.func,
    changeMethod: PropTypes.func,
    moreAction: PropTypes.func,
    moreOpts: PropTypes.array,
    isEditable: PropTypes.bool
  }

  static defaultProps = {
    isEditable: true
  }

  async updateEndpoint(key, value) {
    const { updateEndpoint } = this.props;
    if (updateEndpoint) await updateEndpoint(key, value);
  }

  moreAction(opt) {
    const { moreAction } = this.props;
    if (moreAction) return moreAction(opt);
  }

  async changeMethod(method) {
    const { changeMethod } = this.props;
    if (changeMethod) await changeMethod(method);
  }

  render() {
    const { className, endpoint, moreOpts, isEditable } = this.props;
    const myDescription = endpoint.description && converter.makeHtml(DOMPurify.sanitize(endpoint.description));
    return (
      <div className={classnames(className, "RenderEndpoint")}>
        {/* Header */}
        <div className="relative pr-8 mb-2">
          {/* Name */}
          <Text
            content={endpoint.name}
            placeholder="Name..."
            onSave={this.updateEndpoint.bind(this, "name")}
            className="font-bold font-sf text-xl leading-tight"
            isEditable={isEditable}
            enterForSave
            trim />
          {/* Description */}
          {myDescription &&
            <div
              className="endpointDesc grey-blue cursor-text mb-2 text-sm"
              dangerouslySetInnerHTML={{ __html: myDescription }} />
          }
          {moreOpts && moreOpts.length > 0 &&
            <SubMenu
              className="absolute top-0 right-0"
              options={moreOpts}
              onChange={::this.moreAction}
              align="right">
              <i
                className="iconfont iconelipsis font-bold grey hover:blue-purple cursor-pointer opacity-0 endpointLeftHoverShow transition-20 block" />
            </SubMenu>
          }
        </div>

        {/* Url */}
        <div className="flex items-center text-sm">
          <div className="mr-2">
            <MethodSelect
              method={endpoint.method}
              onChange={::this.changeMethod}
              isEditable={isEditable} />
          </div>

          <Text
            content={endpoint.url}
            placeholder="URL..."
            onSave={this.updateEndpoint.bind(this, "url")}
            isEditable={isEditable}
            enterForSave
            trim />
        </div>

        {/* Parameter and response */}
        <ParameterRender parameters={endpoint.parameters || undefined} />
        <RequestBodyRender requestBody={endpoint.requestBody || undefined} />
        <ResponsesRender responses={endpoint.responses || undefined} />
      </div>
    );
  }
}
