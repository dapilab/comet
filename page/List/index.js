import React, { Component, createRef } from "react";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import classnames from "classnames";

import { tagStore, componentStore, endpointStore } from "stores";

import { jumpToEndpoint, jumpToComponent, getListComponentId } from "utils/helper";
import stopPropagation from "utils/stopPropagation";

import TagItem from "./TagItem";
import SubMenu from "components/SubMenu";
import Input from "components/Input";

require("./index.scss");

@observer
export default class List extends Component {
  static propTypes = {
    className: PropTypes.string,
    selectedEndpointIds: PropTypes.array,
    selectedTagIds: PropTypes.array
  };

  constructor(props) {
    super(props);

    this.myRefs = {
      addTagInput: createRef(),
      addComponentInput: createRef(),
      defaultTag: createRef(),
      addDefaultAPI: createRef()
    };
  }

  onChangeAddAPI(value) {
    if (value === "tag") {
      this.focusInput(this.myRefs.addTagInput);
      return {
        customerComponent: (closeFn) => (
          <div
            className="py-3 px-6 flex flex-col items-center"
            onClick={stopPropagation}>
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
            onClick={stopPropagation}>
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

  focusInput(ref, count = 0) {
    if (count > 10) return;
    if (!ref.current) return setTimeout(() => this.focusInput(ref, count + 1), 200);
    ref.current.focus();
  }

  /**
   * Adding tag
   */
  onKeyUpNewTag(closeFn, e) {
    if (e.keyCode === 13) {
      this.saveNewTag(closeFn);
    }
  }

  async saveNewTag(closeFn) {
    const { myRefs } = this;
    const { value } = myRefs.addTagInput.current;
    if (!value) return;
    await tagStore.findOrCreateByName(value, { unshift: true });
    closeFn();
  }

  /**
   * Adding new default API
   */
  onKeyUpNewDefaultAPI(closeFn, e) {
    if (e.keyCode === 13) {
      this.saveNewDefaultAPI(closeFn);
    }
  }

  async saveNewDefaultAPI(closeFn) {
    const apiName = this.myRefs.addDefaultAPI.current.value;
    if (!apiName) return;
    await this.addNewAPI(apiName);
    closeFn();
  }

  /**
   * Adding API
   */
  async addNewAPI(apiName, tagId) {
    try {
      await endpointStore.create({
        name: apiName,
        description: "",
        method: "get",
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
        },
        tagId: tagId || tagStore.defaultTagId
      }, (newEndpointId) => {
        setTimeout(() => {
          jumpToEndpoint(newEndpointId);
        }, 100);
      });
    } catch (err) {
      // notifyStore.notifyError(err.message);
    }
  }

  /**
   * Adding component
   */
  onKeyUpNewComponent(closeFn, e) {
    if (e.keyCode === 13) {
      this.saveNewComponent(closeFn);
    }
  }

  async saveNewComponent(closeFn) {
    const nameValue = this.myRefs.addComponentInput.current.value;
    if (!nameValue) return;

    try {
      await componentStore.create({
        name: nameValue,
        property: {
          type: "object",
          description: "",
          properties: {
            attr: {
              type: "string"
            }
          }
        }
      }, (newComponentId) => {
        setTimeout(() => jumpToComponent(newComponentId), 100);
      });
    } catch (err) {
      // notifyStore.notifyError(err.error);
    }
    closeFn();
    this.myRefs.addComponentInput.current.clean();
  }

  render() {
    const { selectedTagIds, selectedEndpointIds, className } = this.props;

    // Tags
    const tagIds = endpointStore.observerTrigger
      ? tagStore.fullList
      : [];

    // Default tag id
    let defaultTagId = tagStore.defaultTagId;
    if (!selectedTagIds) {
      defaultTagId = null;
    } else if (selectedTagIds.length > 0 && !selectedTagIds.includes(defaultTagId)) {
      defaultTagId = null;
    }
    if (!endpointStore.tags[defaultTagId] || endpointStore.tags[defaultTagId].data.length === 0) {
      defaultTagId = null;
    }
    return (
      <div
        className={classnames("ProjectAPIList h-full sticky top-0", className)}>
        <div className="ProjectAPIListInner h-full overflow-y-auto pb-10 pr-3">
          {/* API header */}
          <div className="apiHeader flex items-center justify-between relative ">
            <p className="mr-2 cursor-default leading-none font-bold font-sf text-xl">
              API
            </p>
            <SubMenu
              className="flex align-center"
              optClassName="mt-1"
              options={[
                { value: "tag", label: "Add New Tag" },
                { value: "api", label: "Add Default API" }
              ]}
              onChange={::this.onChangeAddAPI}
              align="right">
              <i className="iconfont icon-add text-lg font-bold grey hover:blue-purple leading-none cursor-pointer opacity-0 transition-20 headerHoverShow" />
            </SubMenu>
          </div>

          {/* Tag list with apis */}
          {tagIds
            .filter((tagId) => {
              if (tagId === tagStore.defaultTagId) return false;
              if (!selectedTagIds) return false;
              if (selectedTagIds.length > 0) {
                return selectedTagIds.includes(tagId);
              }
              return true;
            })
            .map((tagId, idx) => (
              <div
                key={tagId}
                className={classnames({ "mt-8": idx !== 0 })}>
                <TagItem
                  tagId={tagId}
                  selectedEndpointIds={selectedEndpointIds}
                  focusInput={::this.focusInput}
                  addNewAPI={::this.addNewAPI} />
              </div>
            ))
          }
          {/* Default tag */}
          {defaultTagId &&
            <TagItem
              tagId={defaultTagId}
              selectedEndpointIds={selectedEndpointIds}
              focusInput={::this.focusInput}
              addNewAPI={::this.addNewAPI} />
          }

          {/* Component header */}
          <div className="apiHeader flex items-center justify-between mt-10 relative pl-7 -ml-7">
            <label className="mr-2 cursor-default leading-none font-bold font-sf text-xl">
              Components
            </label>
            <SubMenu
              className="flex align-center"
              optClassName="mt-1"
              onOpen={this.focusInput.bind(this, this.myRefs.addComponentInput, 0)}
              customerComponent={(closeFn) => (
                <div
                  className="py-3 px-6 flex flex-col items-center"
                  onClick={stopPropagation}>
                  <Input
                    placeholder="New component name"
                    className="w-48"
                    onKeyUp={this.onKeyUpNewComponent.bind(this, closeFn)}
                    ref={this.myRefs.addComponentInput} />
                  <div className="flex items-center justify-center mt-4 text-sm">
                    <button
                      className="btn secondary py-1 w-20 mx-2"
                      onClick={closeFn}>
                      Cancel
                    </button>
                    <button
                      className="btn primary py-1 w-20 mx-2"
                      onClick={this.saveNewComponent.bind(this, closeFn)}>
                      Save
                    </button>
                  </div>
                </div>
              )}
              align="right">
              <i className="iconfont icon-add text-lg font-bold grey hover:blue-purple leading-none cursor-pointer opacity-0 transition-20 headerHoverShow" />
            </SubMenu>
          </div>

          {/* Component list */}
          {componentStore.observerTrigger &&
            componentStore.list.map((componentId, idx) => {
              const component = componentStore.data[componentId];
              return (
                <div
                  key={componentId}
                  id={getListComponentId(componentId)}
                  className={classnames("flex items-center componentItem leading-none text-sm", {
                    "py-2": idx !== 0,
                    "pb-2": idx === 0
                  })}
                  onClick={jumpToComponent.bind(this, componentId)}>
                  <p className="leading-tight">{component.name}</p>
                </div>
              );
            })
          }
        </div>
      </div>
    );
  }
}
