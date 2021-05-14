import React, { Component } from "react";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import classnames from "classnames";

import { tagStore, endpointStore, componentStore } from "stores";

import EndpointItem from "./EndpointItem";
import ComponentItem from "./ComponentItem";

require("./index.scss");

@observer
export default class Detail extends Component {
  static propTypes = {
    selectedEndpointIds: PropTypes.array,
    headerId: PropTypes.string
  };

  static defaultProps = {
    selectedEndpointIds: []
  };

  constructor(props) {
    super(props);
    this.prevTopIsIntersecting = true;
    this.detailTopBarId = "apiDetailTop";
    this.detailId = "apiDetail";
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
        if (selectedEndpointIds.length === 0) return true;
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
        <div className="h-1 -mt-1" id={this.detailTopBarId} />
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
                headerId={headerId} />
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
              componentId={componentId} />
          </div>
        ))}

        {endpointIds.length === 0 && componentStore.list.length === 0 &&
          <div className="w-full h-full flex flex-col items-center grey">
            <div className="w-1/2 text-sm">
              <p className="font-mono text-base text-white">How to start</p>
              <p>Click the `Full Schema` in top-right, copy/paste your openAPI yaml and click `Save`</p>
              <p className="text-white">Or</p>
              <p>Mouse hover to the left `API` and `Component`, click `+` to create your api and component</p>
            </div>

            <div className="w-1/2 text-sm mt-10">
              <p className="font-mono text-base text-white">How to create new project</p>
              <p>Click the `New Project` in top-right</p>
            </div>

            <div className="w-1/2 text-sm mt-10">
              <p className="font-mono text-base text-white">Where is my data saved</p>
              <p>All in your local storage, so don't add too much projects :)</p>
            </div>

            <div className="w-1/2 text-sm mt-10">
              <p className="font-mono text-lg text-white">How to remove my current project</p>
              <p>In the top-right corner, click your project name, a project list will be show up and the first option is removing</p>
            </div>
          </div>
        }
      </div>
    );
  }
}
