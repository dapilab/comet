import React, { Component, createRef } from "react";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import classnames from "classnames";

import { tagStore, componentStore, endpointStore } from "stores";

import { jumpToComponent, getListComponentId } from "utils/helper";

import SubMenu from "components/SubMenu";
import TagItem from "./TagItem";

require("./index.scss");

@observer
export default class List extends Component {
  static propTypes = {
    selectedEndpointIds: PropTypes.array,
    selectedTagIds: PropTypes.array,
    style: PropTypes.object
  };

  static defaultProps = {
    selectedEndpointIds: [],
    selectedTagIds: [],
    style: {}
  };

  constructor(props) {
    super(props);

    this.state = {
      isAddingTag: false,
      isAddingDefaultAPI: false,
      isAddingComponent: false
    };

    this.myRefs = {
      addTagInput: createRef(),
      addComponentInput: createRef(),
      defaultTag: createRef()
    };
  }

  onChangeAddAPI(value) {
    if (value === "tag") {
      return this.toggleIsAddingTag();
    }
    if (value === "api") {
      return this.openAddingDefaultAPI();
    }
  }

  /**
   * Adding tag
   */
  toggleIsAddingTag() {
    const { myRefs } = this;
    const { isAddingTag } = this.state;
    const isToClose = !isAddingTag === false;
    this.setState({
      isAddingTag: !isAddingTag,
      isAddingDefaultAPI: false
    }, () => {
      if (!isToClose) {
        myRefs.addTagInput.current.focus();
      }
      this.closeAddingDefaultAPI();
    });
    return false;
  }

  onKeyUpNewTag(e) {
    if (e.keyCode === 13) {
      this.saveNewTag();
    }
  }

  async saveNewTag() {
    const { myRefs } = this;
    const { value } = myRefs.addTagInput.current;
    if (!value) return;

    await tagStore.findOrCreateByName(value, { unshift: true });
    this.toggleIsAddingTag();
  }

  /**
   * Adding API
   */
  openAddingDefaultAPI() {
    const { myRefs } = this;
    this.setState({
      isAddingTag: false,
      isAddingDefaultAPI: true
    }, () => {
      myRefs.defaultTag.current.toggleIsAddingAPI();
    });
    return false;
  }

  closeAddingDefaultAPI() {
    this.setState({
      isAddingDefaultAPI: false
    }, () => {
      if (this.myRefs.defaultTag.current) {
        this.myRefs.defaultTag.current.closeIsAddingAPI();
      }
    });
  }

  /**
   * Adding component
   */
  toggleAddNewComponent() {
    const { isAddingComponent } = this.state;
    this.setState({
      isAddingComponent: !isAddingComponent
    }, () => {
      if (!isAddingComponent) {
        this.myRefs.addComponentInput.current.focus();
      }
    });
  }

  onKeyUpNewComponent(e) {
    if (e.keyCode === 13) {
      this.saveNewComponent();
    }
  }

  async saveNewComponent() {
    const nameValue = this.myRefs.addComponentInput.current.value;
    if (!nameValue) return;

    const newComponent = componentStore.create({
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
    });
    this.toggleAddNewComponent();
    setTimeout(() => {
      jumpToComponent(newComponent.id);
    }, 100);
  }

  render() {
    const { selectedTagIds, selectedEndpointIds, style } = this.props;
    const { isAddingTag, isAddingComponent, isAddingDefaultAPI } = this.state;
    return (
      <div
        className="List h-full overflow-y-auto pb-10"
        style={style}>
        {/* API header */}
        <div className="apiHeader flex items-center justify-between relative ">
          <p className="mr-2 cursor-default leading-none text-xl tracking-wider font-bold">
            API
          </p>
          <SubMenu
            className="flex align-center"
            options={[
              { value: "tag", label: "Add New Tag" },
              { value: "api", label: "Add New API" }
            ]}
            onChange={::this.onChangeAddAPI}
            align="right">
            <i className="iconfont icon-add-select text-xl font-bold grey hover:blue-purple leading-none cursor-pointer opacity-0 transition-20 headerHoverShow" />
          </SubMenu>
        </div>

        {/* Adding tag */}
        {isAddingTag &&
          <div className="flex mt-3 mb-4 showUpFromLeftToRight items-center">
            <input
              placeholder="Tag name..."
              className="input bottomBorder flex-1 mr-5 text-sm"
              onKeyUp={::this.onKeyUpNewTag}
              ref={this.myRefs.addTagInput} />
            <div className="flex items-center">
              <button
                className="btn primary text-center py-1 text-xs self-start rounded-full w-16 mr-1"
                onClick={::this.saveNewTag}>
                Save
              </button>
              <button
                className="btn secondary text-center py-1 text-xs self-start rounded-full pl-2"
                onClick={::this.toggleIsAddingTag}>
                Cancel
              </button>
            </div>
          </div>
        }

        {/* Tag list with apis */}
        {tagStore.observerTrigger && tagStore.getList()
          .filter((tagId) => {
            if (isAddingDefaultAPI) return true;
            if (selectedTagIds.length > 0) {
              return selectedTagIds.includes(tagId);
            }
            if (tagId !== tagStore.getDefaultTagId()) return true;

            // If Default tag is empty, hide it
            if (!endpointStore.tags[tagId] || endpointStore.tags[tagId].data.length === 0) {
              return false;
            }

            return true;
          })
          .map((tagId, idx) => {
            const isDefaultTag = tagId === tagStore.getDefaultTagId();
            return (
              (
                <div
                  key={tagId}
                  className={classnames({ "mt-8": idx !== 0 })}>
                  <TagItem
                    tagId={tagId}
                    selectedEndpointIds={selectedEndpointIds}
                    ref={isDefaultTag && this.myRefs.defaultTag || null} />
                </div>
              )
            );
          })
        }

        {/* Component header */}
        <div className="apiHeader flex items-center justify-between mt-10 relative pl-7 -ml-7">
          <label className="mr-2 cursor-default leading-snug text-xl tracking-wider font-bold">
            Components
          </label>
          <i
            className="headerIcon iconfont icon-add-select leading-tight text-xl grey z-10 cursor-pointer opacity-0 transition-20 headerHoverShow"
            onClick={::this.toggleAddNewComponent} />
        </div>

        {/* Adding component  */}
        {isAddingComponent &&
          <div className="flex mb-4 items-center justify-between showUpFromLeftToRight">
            <input
              placeholder="Name..."
              className="input bottomBorder flex-1 mr-5 text-sm"
              onKeyUp={::this.onKeyUpNewComponent}
              ref={this.myRefs.addComponentInput} />
            <div className="flex items-center">
              <button
                className="btn primary text-xs text-center py-1 text-xs self-start rounded-full w-16 mr-1"
                onClick={::this.saveNewComponent}>
                Save
              </button>
              <button
                className="btn secondary text-xs text-center py-1 text-xs self-start rounded-full pl-2"
                onClick={::this.toggleAddNewComponent}>
                Cancel
              </button>
            </div>
          </div>
        }

        {/* Component list */}
        {componentStore.observerTrigger && componentStore.list.map((componentId, idx) => {
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
    );
  }
}
