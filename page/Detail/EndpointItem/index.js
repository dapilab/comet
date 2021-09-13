import React, { Component, Fragment, createRef } from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import classnames from "classnames";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { endpointStore, componentStore } from "stores";

import { getEndpointBlockId, activeEndpointItem, jumpToEndpoint } from "utils/helper";
import { toCurl } from "libs/render";

import Snippet from "./Snippet";
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
    headerId: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.state = {
      isAPIExpanded: false,
      isCopied: false,
      isSnippetOpen: false
    };

    this.prevIsIntersecting = false;
    this.isInitialObserve = true;

    this.codemirrorRef = createRef();
    this.snippetRef = createRef();

    this.closeSnippet = this.closeSnippet.bind(this);
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

    document.removeEventListener("click", this.closeSnippet);
  }

  /**
   * Left section
   */
  updateEndpoint(type, value) {
    const { endpointId } = this.props;
    endpointStore.updateById(endpointId, { [type]: value });
    this.codemirrorRef.current.refreshContent(endpointStore.toOpenAPIFormat(endpointId));
  }

  changeMethod(method) {
    const { endpointId } = this.props;
    endpointStore.updateById(endpointId, { method });
    this.codemirrorRef.current.refreshContent(endpointStore.toOpenAPIFormat(endpointId));
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

  async codeMirrorSave(endpointId, json) {
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
    const { tagChanged } = await endpointStore.updateById(endpointId, data);
    if (tagChanged) jumpToEndpoint(endpointId);
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

  /**
   * Toggle snippet
   */
  toggleSnippet(e) {
    const { isSnippetOpen } = this.state;
    if (!isSnippetOpen) {
      this.openSnippet();
    } else {
      this.closeSnippet(e);
    }
  }

  openSnippet() {
    this.setState({
      isSnippetOpen: true
    }, () => {
      document.addEventListener("click", this.closeSnippet);
    });
  }

  closeSnippet(e) {
    if (this.snippetRef && !this.snippetRef.current.contains(e.target)) {
      this.setState({
        isSnippetOpen: false
      }, () => {
        document.removeEventListener("click", this.closeSnippet);
      });
    }
  }

  closeSnippetManually() {
    this.setState({
      isSnippetOpen: false
    }, () => {
      document.removeEventListener("click", this.closeSnippet);
    });
  }

  render() {
    const { endpointId, idx } = this.props;
    const { isAPIExpanded, isCopied, isSnippetOpen } = this.state;

    const endpoint = endpointStore.observerTrigger && endpointStore.data[endpointId];
    const curlContent = toCurl(endpoint);
    return (
      <div
        id={getEndpointBlockId(endpointId)}
        className={classnames("EndpointItem flex justify-end relative", { first: idx === 0 })}>
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
        <div
          className={classnames("rightSection sticky top-0 self-start", {
            "z-10": !isSnippetOpen,
            "z-20": isSnippetOpen
          })}>
          {/* Open API */}
          {/* Open API: header */}
          <div
            className="rounded-t-lg flex items-center py-2 px-5 openAPIHeader relative z-10">
            <p className="text-xs font-medium title text-white opacity-75 flex-1">OpenAPI</p>
            {/* Snippet */}
            <div className="relative mr-4">
              <div
                className="flex items-center text-xs font-medium text-white opacity-50 transition-20 cursor-pointer hover:opacity-100"
                onClick={::this.toggleSnippet}>
                <p className="leading-none mr-1">Snippet</p>
                <i className="iconfont icon-code text-lg leading-none" />
              </div>

              {isSnippetOpen &&
                <div ref={this.snippetRef}>
                  <Snippet
                    className="absolute right-0 top-full mt-2 boxShadow bg-black p-5"
                    close={::this.closeSnippetManually} />
                </div>
              }
            </div>
            {/* Expand */}
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
            className={classnames("overflow-y-auto h-48 rounded-b-lg", {
              "h-auto": isAPIExpanded,
              "max-h-48": !isAPIExpanded
            })}>
            <CodeMirror
              id={endpoint.id}
              type="endpoint"
              initialJSONValue={endpointStore.toOpenAPIFormat(endpointId)}
              parseAndSave={this.codeMirrorSave.bind(this, endpointId)}
              ref={this.codemirrorRef} />
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
