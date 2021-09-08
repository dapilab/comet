import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import showdown from "showdown";
import DOMPurify from "dompurify";
import classnames from "classnames";

import { componentStore } from "stores";

import { convertComponentToSchema, renderModelAttribute } from "libs/render";
import { getComponentBlockId } from "utils/helper";

import Text from "components/Text";
import SubMenu from "components/SubMenu";
import CodeMirror from "../CodeMirror";

require("./index.scss");

const converter = new showdown.Converter({ openLinksInNewWindow: true });

@observer
export default class ComponentItem extends Component {
  static propTypes = {
    componentId: PropTypes.string,
    rightClass: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.state = {
      isAPIExpanded: false
    };
  }

  moreAction(value) {
    const { componentId } = this.props;
    switch (value) {
      case "remove": {
        return {
          action: "confirm",
          cb: () => {
            componentStore.removeById(componentId);
          }
        };
      }
    }
  }

  async updateComponent(attr, value) {
    const { componentId } = this.props;
    componentStore.updateById(componentId, { [attr]: value });
  }

  /**
   * Right section
   */
  toggleAPIExpand() {
    const { isAPIExpanded } = this.state;
    this.setState({
      isAPIExpanded: !isAPIExpanded
    });
  }

  render() {
    const { componentId, rightClass } = this.props;
    const { isAPIExpanded } = this.state;

    const component = componentStore.observerTrigger && componentStore.data[componentId];

    // Schema for preview
    const schema = convertComponentToSchema(component);
    const schemElem = renderModelAttribute("", schema, {
      alwaysShowCurrent: true,
      greyOutForHidden: false
    });

    // Right info
    // const involvedEndpointIds = endpointStore.observerTrigger && endpointStore.findByComponentUsed(data.id);
    return (
      <div
        id={getComponentBlockId(componentId)}
        className="ComponentItem flex justify-end">
        {/* Left schema */}
        <div className="leftSection">
          <div className="relative pr-8">
            {/* Name */}
            <div className="flex items-center">
              <Text
                content={component.name}
                placeholder="Name..."
                onSave={this.updateComponent.bind(this, "name")}
                className="text-xl"
                enterForSave
                trim />
            </div>
            {/* Description */}
            {component.property && component.property.description &&
              <div
                className="componentDesc text-sm grey-blue cursor-text"
                dangerouslySetInnerHTML={{
                  __html: converter.makeHtml(DOMPurify.sanitize(component.property.description))
                }} />
            }
            <SubMenu
              className="absolute top-0 right-0"
              options={[{
                value: "remove",
                label: "Remove"
              }]}
              onChange={::this.moreAction}
              align="right">
              <i
                className="iconfont icon-elipsis font-bold grey hover:blue-purple cursor-pointer opacity-0 endpointLeftHoverShow transition-20 block"
                style={{ transform: "rotate(90deg)" }} />
            </SubMenu>
          </div>

          <div className="-mt-2 text-sm">
            {schemElem}
          </div>
        </div>

        {/* Right part */}
        <div className={classnames("rightSection", rightClass)}>
          {/* Open API */}
          <Fragment>
            {/* Open API: header */}
            <div className="rounded-t-lg flex items-center justify-between py-2 px-5 openAPIHeader">
              <p className="text-xs font-medium title text-white opacity-75">OpenAPI</p>
              <div
                className="flex items-center text-xs font-medium text-white opacity-50 transition-20 cursor-pointer hover:opacity-100"
                onClick={::this.toggleAPIExpand}>
                <p className="leading-none mr-1">{isAPIExpanded && "Shrink" || "Expand" }</p>
                <i className={classnames("iconfont text-sm", {
                  "icon-fullscreen-shrink": isAPIExpanded,
                  "icon-fullscreen-expand": !isAPIExpanded
                })} />
              </div>
            </div>
            {/* Open API: body */}
            <div
              className={classnames("overflow-y-auto rounded-b-lg", {
                "h-auto": isAPIExpanded,
                "h-48": !isAPIExpanded
              })}>
              <CodeMirror
                id={component.id}
                component={component}
                type="component" />
            </div>
          </Fragment>

          {/* Used in APIs */}
          {/* involvedEndpointIds.length > 0 &&
            <div className="mt-5">
              <div className="rounded-t-lg flex items-center justify-between py-2 px-5 curlHeader">
                <p className="text-xs font-medium title grey-light">Used In APIs</p>
              </div>
              <div
                className="overflow-y-auto max-h-48 rounded-b-lg curlBody text-sm py-3 px-5">
                {involvedEndpointIds.map((endpointId) => {
                  const endpoint = endpointStore.data[endpointId];
                  return (
                    <div
                      key={endpointId}
                      className="mb-2 endpointItem cursor-pointer"
                      onClick={jumpToEndpoint.bind(this, endpointId)}>
                      <p className="leading-tight name transition-20">{endpoint.name}</p>
                      <p className="grey-light text-xs transition-20 url">{endpoint.method.toUpperCase()} {endpoint.url}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          */}
        </div>
      </div>
    );
  }
}
