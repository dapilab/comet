import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
// import { DraggableCore } from "react-draggable";
import classnames from "classnames";
import showdown from "showdown";
import DOMPurify from "dompurify";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { endpointStore, componentStore } from "stores";

import { getEndpointBlockId, activeEndpointItem } from "utils/helper";
import { toCurl } from "libs/render";

import Text from "components/Text";
import SubMenu from "components/SubMenu";
import DividerBase from "../DividerBase";
import CodeMirror from "../CodeMirror";
import MethodSelect from "./MethodSelect/index";
import ParameterRender from "./ParameterRender";
import RequestBodyRender from "./RequestBodyRender";
import ResponsesRender from "./ResponsesRender";

require("./index.scss");

const converter = new showdown.Converter({ openLinksInNewWindow: true });

@observer
export default class EndpointItem extends DividerBase {
  static propTypes = {
    endpointId: PropTypes.string,
    nextEndpointId: PropTypes.string,
    idx: PropTypes.number,
    detailId: PropTypes.string,
    headerId: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.state = {
      isAPIExpanded: false,
      isCopied: false
    };

    this.prevIsIntersecting = false;
    this.isInitialObserve = true;
  }

  static getDerivedStateFromProps(props) {
    return {
      nextEndpointId: props.nextEndpointId
    };
  }

  async componentDidMount() {
    const { endpointId, detailId, headerId } = this.props;

    const headerBottom = document.getElementById(headerId).getBoundingClientRect().bottom;
    // Setup intersection observer to activate left endpoint item
    this.observerTimeout = setTimeout(() => {
      this.observer = new IntersectionObserver((entries) => {
        const { nextEndpointId } = this.state;
        const entry = entries[0];

        if (this.isInitialObserve) {
          if (entry.isIntersecting) {
            this.prevIsIntersecting = true;
            activeEndpointItem(endpointId, entry.intersectionRatio);
          }

          this.isInitialObserve = false;
        } else {
          if (endpointStore.isJumpingToPointed || componentStore.isJumpingToPointed) return;
          const isScrollDownAndGoneInTop = entry.isIntersecting === false
            && entry.intersectionRect.top === 0
            && entry.boundingClientRect.bottom <= headerBottom
            && this.prevIsIntersecting === true;
          const isScrollUpAndShowInTop = entry.isIntersecting === true
            && entry.intersectionRect.top === headerBottom
            && entry.boundingClientRect.bottom > headerBottom
            && this.prevIsIntersecting === false;
          if (isScrollDownAndGoneInTop) {
            this.prevIsIntersecting = false;
            if (nextEndpointId) activeEndpointItem(nextEndpointId);
            return;
          }
          if (isScrollUpAndShowInTop) {
            this.prevIsIntersecting = true;
            activeEndpointItem(endpointId);
          }
        }
      }, {
        root: document.getElementById(detailId),
        threshold: [0, 0.5]
      });

      const endpointBlockId = getEndpointBlockId(endpointId);
      this.observer.observe(document.getElementById(endpointBlockId));
    }, 1000);
  }

  componentWillUnmount() {
    const { endpointId } = this.props;
    clearTimeout(this.observerTimeout);
    if (this.observer) {
      const endpointBlockId = getEndpointBlockId(endpointId);
      this.observer.unobserve(document.getElementById(endpointBlockId));
    }
  }

  updateEndpoint(type, value) {
    const { endpointId } = this.props;
    endpointStore.updateById(endpointId, { [type]: value });
  }

  changeMethod(method) {
    const { endpointId } = this.props;
    endpointStore.updateById(endpointId, { method });
  }

  async moreAction(value) {
    const { endpointId } = this.props;
    switch (value) {
      case "remove": {
        return {
          action: "confirm",
          cb: () => {
            endpointStore.removeById(endpointId);
          }
        };
      }
      case "duplicate": {
        endpointStore.duplicate(endpointId);
      }
    }
    return false;
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

  onCopy() {
    this.setState({
      isCopied: true
    }, () => {
      setTimeout(() => {
        this.setState({
          isCopied: false
        });
      }, 3000);
    });
  }

  render() {
    const { endpointId, idx } = this.props;
    const { isAPIExpanded, isCopied } = this.state;

    const endpoint = endpointStore.observerTrigger && endpointStore.data[endpointId];
    const myDescription = endpoint.description && converter.makeHtml(DOMPurify.sanitize(endpoint.description));
    const curlContent = toCurl(endpoint);
    return (
      <div
        id={getEndpointBlockId(endpointId)}
        className={classnames("EndpointBlock ml-5 flex justify-center", { first: idx === 0 })}>
        {/* Left part */}
        <div
          className={this.leftPartClass}
          style={this.leftPartStyle}>
          <div className="relative pr-8 mb-2">
            {/* Name */}
            <Text
              content={endpoint.name}
              placeholder="Name..."
              onSave={this.updateEndpoint.bind(this, "name")}
              className="text-xl leading-tight"
              enterForSave
              trim />
            {/* Description */}
            {myDescription &&
              <div
                className="endpointDesc text-sm grey-light leading-normal cursor-text mt-1"
                dangerouslySetInnerHTML={{ __html: myDescription }} />
            }
            <SubMenu
              className="absolute top-0 right-0"
              options={[{
                value: "duplicate",
                label: "Duplicate"
              }, {
                value: "remove",
                label: "Remove"
              }]}
              onChange={::this.moreAction}
              align="right">
              <i
                className="iconfont icon-elipsis font-bold grey hover:blue-purple cursor-pointer opacity-0 endpointLeftHoverShow transition-20 block" />
            </SubMenu>
          </div>

          {/* Url */}
          <div className="flex items-center pb-3 ">
            <div className="font-medium mr-2">
              <MethodSelect
                method={endpoint.method}
                onChange={::this.changeMethod} />
            </div>

            <Text
              className="tracking-wide"
              content={endpoint.url}
              placeholder="URL..."
              onSave={this.updateEndpoint.bind(this, "url")} />
          </div>
          {/* Parameter and response */}
          <ParameterRender parameters={endpoint.parameters || undefined} />
          <RequestBodyRender requestBody={endpoint.requestBody || undefined} />
          <ResponsesRender responses={endpoint.responses || undefined} />
        </div>

        {/* Center divider */}
        {/* <DraggableCore axis="x" onDrag={::this.handleWidthDrag}>
          <div
            className="self-stretch cursor-ew-resize"
            style={{ flex: this.draggerDefaultFlex }} />
        </DraggableCore> */}

        {/* Right part */}
        <div
          className="flex-1 rightSection"
          style={this.rightPartStyle}>
          {/* Open API */}
          {/* Open API: header */}
          <div className="rounded-t-lg flex items-center justify-between py-2 px-5 openAPIHeader">
            <p className="text-xs font-medium title text-white opacity-75">OpenAPI</p>
            <div
              className="flex items-center text-xs font-medium text-white opacity-50 transition-20 cursor-pointer hover:opacity-100"
              onClick={::this.toggleAPIExpand}>
              <p className="leading-none mr-1">{isAPIExpanded && "Shrink" || "Expand" }</p>
              <i className={classnames("iconfont ", {
                "icon-fullscreen-shrink": isAPIExpanded,
                "icon-fullscreen-expand": !isAPIExpanded
              })} />
            </div>
          </div>
          {/* Open API: body */}
          <div
            className={classnames("overflow-y-auto h-48 rounded-b-lg", {
              "h-auto": isAPIExpanded,
              "h-48": !isAPIExpanded
            })}>
            <CodeMirror
              id={endpointId}
              type="endpoint"
              endpoint={endpoint} />
          </div>

          {/* Curl */}
          {curlContent &&
            <Fragment>
              {/* Curl: header */}
              <div className="rounded-t-lg flex items-center justify-between py-2 px-5 curlHeader mt-5">
                <p className="text-xs font-medium title grey">Curl</p>
                <CopyToClipboard
                  text={curlContent}
                  onCopy={::this.onCopy}>
                  <div
                    className="flex items-center text-xs font-medium grey transition-20 cursor-pointer hover:text-black">
                    <p className="leading-none mr-1">Copy</p>
                    <i className={classnames("iconfont", {
                      "icon-copy": !isCopied,
                      "icon-seleted green": isCopied
                    })} />
                  </div>
                </CopyToClipboard>
              </div>
              {/* Curl: body */}
              <div className="rounded-b-lg curlBody text-sm py-3 px-5">
                <p>
                  <span className="inline-block mr-1 purple">$</span>
                  <span className=" break-all">{curlContent}</span>
                </p>
              </div>
            </Fragment>
          }
        </div>
      </div>
    );
  }
}
