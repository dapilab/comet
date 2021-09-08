import React, { Component, createRef } from "react";
import { observer } from "mobx-react";
import PropTypes from "prop-types";

import { tagStore, endpointStore } from "stores";

import { jumpToEndpoint, getListEndpointId, getListTagId } from "utils/helper";

import SubMenu from "components/SubMenu";
import Text from "components/Text";

require("./index.scss");

@observer
export default class ListTagItem extends Component {
  static propTypes = {
    tagId: PropTypes.string.isRequired,
    selectedEndpointIds: PropTypes.array
  };

  constructor(props) {
    super(props);
    this.state = {
      isAddingAPI: false
    };
    this.myRefs = {
      addAPIInputName: createRef()
    };
  }

  changeTagName(value) {
    const { tagId } = this.props;
    if (!value) return;
    return tagStore.updateById(tagId, {
      name: value
    });
  }

  toggleIsAddingAPI() {
    const { myRefs } = this;
    const { closeAddingNew } = this.props;
    const { isAddingAPI } = this.state;
    const isToClose = !isAddingAPI === false;
    this.setState({
      isAddingAPI: !isAddingAPI
    }, () => {
      if (!isToClose) {
        myRefs.addAPIInputName.current.focus();
        return;
      }
      if (closeAddingNew) closeAddingNew();
    });
  }

  closeIsAddingAPI() {
    this.setState({
      isAddingAPI: false
    });
  }

  onKeyUpNewAPI(e) {
    if (e.keyCode === 13) {
      this.saveNewAPI();
    }
  }

  async saveNewAPI() {
    const { myRefs } = this;
    const { tagId } = this.props;
    const nameValue = myRefs.addAPIInputName.current.value;
    if (!nameValue) return;

    const newEndpoint = await endpointStore.create({
      name: nameValue,
      description: "",
      method: "get",
      tagId,
      responses: {
        200: {
          content: {
            "application/json": {
              schema: {
                type: "object"
              }
            }
          }
        }
      }
    }, { unshift: true });
    this.toggleIsAddingAPI();
    setTimeout(() => {
      jumpToEndpoint(newEndpoint.id);
    });
  }

  async moreAction(value) {
    const { tagId } = this.props;
    switch (value) {
      case "remove": {
        return {
          action: "confirm",
          cb: () => {
            endpointStore.moveToDefaultTag(tagId);
            tagStore.removeById(tagId);
            return false;
          }
        };
      }
    }
  }

  render() {
    const { tagId, selectedEndpointIds } = this.props;
    const { isAddingAPI } = this.state;
    const tag = tagStore.observerTrigger && tagStore.data[tagId];
    const isDefaultTag = tagId === tagStore.getDefaultTagId();
    return (
      <div
        id={getListTagId(tagId)}
        className="TagItem">
        <div
          className="tagHeader flex items-center justify-between relative">
          {/* Tag name */}
          <Text
            className="Text cursor-text mr-2 leading-normal font-bold"
            placeholder="Tag name..."
            content={isDefaultTag && "Default" || tag.name}
            onSave={::this.changeTagName}
            enterForSave />
          {/* Actions */}
          <div className="flex items-center">
            {!isDefaultTag &&
              <SubMenu
                className="flex align-center"
                options={[{
                  value: "remove",
                  label: "Remove"
                }]}
                onChange={::this.moreAction}
                align="right">
                <i className="iconfont icon-elipsis font-bold grey hover:blue-purple cursor-pointer opacity-0 headerHoverShow transition-20" />
              </SubMenu>
            }
            <i
              className="iconfont icon-add-select text-lg font-bold grey hover:blue-purple cursor-pointer opacity-0 headerHoverShow ml-2 transition-20"
              onClick={::this.toggleIsAddingAPI} />
          </div>
        </div>

        {/* Add new api */}
        {isAddingAPI &&
          <div className="flex my-1 items-center justify-between showUpFromLeftToRight">
            <input
              placeholder="API name..."
              className="input bottomBorder flex-1 mr-5 text-sm"
              onKeyUp={::this.onKeyUpNewAPI}
              ref={this.myRefs.addAPIInputName} />
            <div className="flex items-center">
              <button
                className="btn secondary text-center py-1 text-xs self-start rounded-full w-12"
                onClick={::this.toggleIsAddingAPI}>
                Cancel
              </button>
              <button
                className="btn primary text-center py-1 text-xs self-start rounded-full w-12 ml-2"
                onClick={::this.saveNewAPI}>
                Save
              </button>
            </div>
          </div>
        }

        {/* API list */}
        {endpointStore.observerTrigger && endpointStore.tags[tagId] && endpointStore.tags[tagId].data
          .filter((endpointId) => {
            if (!selectedEndpointIds) return true;
            return selectedEndpointIds.includes(endpointId);
          })
          .map((endpointId) => {
            const endpoint = endpointStore.data[endpointId];
            return (
              <p
                key={endpointId}
                id={getListEndpointId(endpointId)}
                className="endpointItem text-sm truncate"
                onClick={jumpToEndpoint.bind(this, endpointId)}>
                {endpoint.name || endpoint.description || `${endpoint.method} ${endpoint.url}`}
              </p>
            );
          })
        }
      </div>
    );
  }
}
