import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import classnames from "classnames";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { endpointStore, componentStore } from "stores";

import { getEndpointBlockId, activeEndpointItem } from "utils/helper";
import { toCurl } from "libs/render";

import CodeMirror from "../CodeMirror";
import RenderEndpoint from "../RenderEndpoint";

require("./index.scss");

@observer
export default class EndpointItem extends Component {
  static propTypes = {
    endpointId: PropTypes.string,
    nextEndpointId: PropTypes.string,
    idx: PropTypes.number,
    detailId: PropTypes.string,
    headerId: PropTypes.string,
    rightClass: PropTypes.string
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
    }, 100);
  }

  componentWillUnmount() {
    const { endpointId } = this.props;
    clearTimeout(this.observerTimeout);
    if (this.observer) {
      const endpointBlockId = getEndpointBlockId(endpointId);
      this.observer.unobserve(document.getElementById(endpointBlockId));
    }
  }

  /**
   * Left section
   */
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
    const { endpointId, idx, rightClass } = this.props;
    const { isAPIExpanded, isCopied } = this.state;

    const endpoint = endpointStore.observerTrigger && endpointStore.data[endpointId];
    const curlContent = toCurl(endpoint);
    return (
      <div
        id={getEndpointBlockId(endpointId)}
        className={classnames("EndpointItem flex justify-end", { first: idx === 0 })}>
        {/* Left part */}
        <div className="leftSection">
          <RenderEndpoint
            endpoint={endpoint}
            moreOpts={[{
              value: "duplicate",
              label: "Deuplicate"
            }, {
              value: "remove",
              label: "Remove"
            }]}
            updateEndpoint={::this.updateEndpoint}
            moreAction={::this.moreAction}
            changeMethod={::this.changeMethod} />
        </div>

        {/* Right part */}
        <div className={classnames("rightSection", rightClass)}>
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
                      "icon-seleted green font-bold": isCopied
                    })} />
                  </div>
                </CopyToClipboard>
              </div>
              {/* Curl: body */}
              <div className="rounded-b-lg curlBody text-sm py-3 px-5">
                <p>
                  <span className="inline-block mr-1 blue-purple">$</span>
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
