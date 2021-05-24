import React, { Component } from "react";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import classnames from "classnames";

import { tagStore, endpointStore, componentStore } from "stores";

import localStorage from "libs/localStorage";

import EndpointItem from "./EndpointItem";
import ComponentItem from "./ComponentItem";

require("./index.scss");

@observer
export default class Detail extends Component {
  static propTypes = {
    selectedEndpointIds: PropTypes.array,
    headerId: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.prevTopIsIntersecting = true;
    this.detailTopBarId = "apiDetailTop";
    this.detailId = "apiDetail";
    this.leftPartClass = "endpointDetailLeft";

    this.storageKeyForRight = "__api_right_width";
    this.rightClass = "rightInfoSection";
    this.rightWidth = localStorage.get(this.storageKeyForRight, "float") || 30;

    this.saveWidthIntoStorage = this.saveWidthIntoStorage.bind(this);
  }

  componentDidMount() {
    this.calcuRightInfoWidth();
    window.addEventListener("beforeunload", this.saveWidthIntoStorage);
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.saveWidthIntoStorage);
    this.saveWidthIntoStorage();
  }

  /**
   * Width related
   */
  calcuRightInfoWidth() {
    document.querySelectorAll(`.${this.rightClass}`).forEach((item) => {
      item.style.flex = `0 0 ${this.rightWidth}vw`;
    });
  }

  handleWidthDrag(e) {
    e.preventDefault();
    const maxWidth = 40;
    const minWidth = 20;
    this.rightWidth = this.rightWidth - e.movementX / 15;
    this.rightWidth = Math.max(Math.min(this.rightWidth, maxWidth), minWidth);
    this.calcuRightInfoWidth();
  }

  saveWidthIntoStorage() {
    localStorage.set(this.storageKeyForRight, this.rightWidth);
  }

  /**
   * Endpoints
   */
  genEndpointIdsFromTags(tagIds) {
    const { selectedEndpointIds } = this.props;
    return tagIds
      .filter((tagId) => endpointStore.tags[tagId])
      .map((tagId) => endpointStore.tags[tagId].data)
      .reduce((acc, endIds) => acc.concat(endIds), [])
      .filter((endpoinId) => {
        if (!selectedEndpointIds) return true;
        return selectedEndpointIds.includes(endpoinId);
      });
  }

  render() {
    const { headerId } = this.props;
    const endpointIds = endpointStore.observerTrigger && this.genEndpointIdsFromTags(tagStore.getList());
    return (
      <div
        id={this.detailId}
        className="Detail flex-1 h-full overflow-y-auto">
        <div
          id={this.detailTopBarId}
          className="h-1 -mt-1" />
        {/* Endpoints */}
        {endpointIds.map((endpointId, idx) => {
          const nextEndpointId = idx !== endpointIds.length - 1
            ? endpointIds[idx + 1]
            : null;
          return (
            <div
              key={endpointId}
              className={classnames({
                "py-48": idx !== 0,
                "pb-48": idx === 0
              })}>
              <EndpointItem
                idx={idx}
                endpointId={endpointId}
                nextEndpointId={nextEndpointId}
                detailId={this.detailId}
                headerId={headerId}
                handleWidthDrag={::this.handleWidthDrag}
                rightClass={this.rightClass} />
            </div>
          );
        })}

        {/* Components */}
        {componentStore.list.map((componentId, idx) => (
          <div
            key={componentId}
            className={classnames({
              "py-16": endpointIds.length !== 0 || idx !== 0,
              "pb-16": endpointIds.length === 0 && idx === 0
            })}>
            <ComponentItem
              componentId={componentId}
              handleWidthDrag={::this.handleWidthDrag}
              rightClass={this.rightClass} />
          </div>
        ))}
      </div>
    );
  }
}
