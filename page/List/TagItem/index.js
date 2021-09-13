import React, { Component, createRef } from "react";
import { observer } from "mobx-react";
import PropTypes from "prop-types";

import { tagStore, endpointStore } from "stores";

import { jumpToEndpoint, getListEndpointId, getListTagId } from "utils/helper";
import stopPropagation from "utils/stopPropagation";

import SubMenu from "components/SubMenu";
import Text from "components/Text";
import Input from "components/Input";

require("./index.scss");

@observer
export default class ListTagItem extends Component {
  static propTypes = {
    tagId: PropTypes.string.isRequired,
    selectedEndpointIds: PropTypes.array,
    focusInput: PropTypes.func,
    addNewAPI: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      isDefaultTag: props.tagId === tagStore.getDefaultTagId()
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

  focusInput(ref, count = 0) {
    if (count > 10) return;
    if (!ref.current) return setTimeout(() => this.focusInput(ref, count + 1), 200);
    ref.current.focus();
  }

  onChangeAddAPI(value) {
    if (value === "tag") {
      this.focusInput(this.myRefs.addTagInput);
      return {
        customerComponent: (closeFn) => (
          <div
            className="py-3 px-6 flex flex-col items-center"
            onClick={::this.stopPropagation}>
            <Input
              placeholder="New tag name"
              className="w-48"
              onKeyUp={this.onKeyUpNewTag.bind(this, closeFn)}
              ref={this.myRefs.addTagInput} />
            <div className="flex items-center justify-center mt-4 text-sm">
              <button
                className="btn secondary py-1 w-20 mx-2"
                onClick={closeFn}>
                Cancel
              </button>
              <button
                className="btn primary py-1 w-20 mx-2"
                onClick={this.saveNewTag.bind(this, closeFn)}>
                Save
              </button>
            </div>
          </div>
        )
      };
    }
    if (value === "api") {
      this.focusInput(this.myRefs.addDefaultAPI);
      return {
        customerComponent: (closeFn) => (
          <div
            className="py-3 px-6 flex flex-col items-center"
            onClick={::this.stopPropagation}>
            <Input
              placeholder="New default API name"
              className="w-48"
              onKeyUp={this.onKeyUpNewDefaultAPI.bind(this, closeFn)}
              ref={this.myRefs.addDefaultAPI} />
            <div className="flex items-center justify-center mt-4 text-sm">
              <button
                className="btn secondary py-1 w-20 mx-2"
                onClick={closeFn}>
                Cancel
              </button>
              <button
                className="btn primary py-1 w-20 mx-2"
                onClick={this.saveNewDefaultAPI.bind(this, closeFn)}>
                Save
              </button>
            </div>
          </div>
        )
      };
    }
  }

  onKeyUpNewAPI(closeFn, e) {
    if (e.keyCode === 13) {
      this.saveNewAPI(closeFn);
    }
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

  async saveNewAPI(closeFn) {
    const { addNewAPI, tagId } = this.props;
    const apiName = this.myRefs.addAPIInputName.current.value;
    if (!apiName) return;
    await addNewAPI(apiName, tagId);
    closeFn();
    this.myRefs.addAPIInputName.current.clean();
  }

  render() {
    const { tagId, selectedEndpointIds, focusInput } = this.props;
    const { isDefaultTag } = this.state;
    const tag = tagStore.observerTrigger && tagStore.data[tagId];

    // More action options
    const moreOpts = [];
    if (!isDefaultTag) {
      moreOpts.push({
        value: "remove",
        label: "Remove Tag"
      });
    }
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
          <div className="flex items-center opacity-0 headerHoverShow transition-20">
            {moreOpts.length > 0 &&
              <SubMenu
                className="flex align-center"
                options={moreOpts}
                onChange={::this.moreAction}
                align="right">
                <i
                  className="iconfont iconelipsis font-bold grey hover:blue-purple cursor-pointer" />
              </SubMenu>
            }
            <SubMenu
              className="flex align-center"
              optClassName="mt-1"
              onOpen={focusInput.bind(this, this.myRefs.addAPIInputName, 0)}
              customerComponent={(closeFn) => (
                <div
                  className="py-3 px-6 flex flex-col items-center"
                  onClick={stopPropagation}>
                  <Input
                    placeholder="New API name"
                    className="w-48"
                    onKeyUp={this.onKeyUpNewAPI.bind(this, closeFn)}
                    ref={this.myRefs.addAPIInputName} />
                  <div className="flex items-center justify-center mt-4 text-sm">
                    <button
                      className="btn secondary py-1 w-20 mx-2"
                      onClick={closeFn}>
                      Cancel
                    </button>
                    <button
                      className="btn primary py-1 w-20 mx-2"
                      onClick={this.saveNewAPI.bind(this, closeFn)}>
                      Save
                    </button>
                  </div>
                </div>
              )}
              align="right">
              <i className="iconfont icon-add text-lg font-bold grey hover:blue-purple cursor-pointer opacity-0 headerHoverShow ml-2 transition-20" />
            </SubMenu>
          </div>
        </div>

        {/* API list */}
        {endpointStore.observerTrigger && endpointStore.tags[tagId] && endpointStore.tags[tagId].data
          .filter((endpointId) => {
            if (!selectedEndpointIds) return false;
            if (selectedEndpointIds.length === 0) return true;
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
