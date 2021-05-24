import React, { Component, Fragment } from "react";
import { observer } from "mobx-react";
import { DraggableCore } from "react-draggable";

import { appStore } from "stores";

import localStorage from "libs/localStorage";
import { STORAGE_KEYS } from "constant";

import Header from "./Header";
import List from "./List";
import Detail from "./Detail";
import FullSchema from "./FullSchema";

require("../shared-style/basic.scss");
require("./index.scss");

@observer
export default class Application extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Searching
      selectedEndpointIds: [],
      selectedTagIds: [],
      // Full schema
      isFullSchemaOpen: false
    };

    this.headerId = "header";
    this.mainId = "main";
    this.storageKeyForWidth = "__api_list_width__";

    this.saveCurrentSchema = this.saveCurrentSchema.bind(this);
  }

  componentDidMount() {
    // Setup main height
    const headerHeight = document.getElementById(this.headerId).clientHeight;
    const mainHTML = document.getElementById(this.mainId);
    mainHTML.style.height = `calc(100vh - ${headerHeight}px)`;

    // Setup list width
    const listWidth = localStorage.get(this.storageKeyForWidth, "float") || 16;
    this.setState({ listWidth });

    // Load latest project
    let projects = localStorage.get(STORAGE_KEYS.PROJECTS);
    projects = projects && JSON.parse(projects) || [];
    if (projects.length === 0) {
      // No project, create a new default project
      appStore.create();
    } else {
      const latestProjectId = projects[0];
      const latestProject = localStorage.get(latestProjectId);
      if (!latestProject) {
        appStore.create();
      } else {
        appStore.loadFromSchema(JSON.parse(latestProject));
        appStore.load(latestProjectId, JSON.parse(latestProject));
      }
    }

    window.addEventListener("beforeunload", this.saveCurrentSchema);
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.saveCurrentSchema);
  }

  // Width related
  handleWidthDrag(e) {
    e.preventDefault();
    const { listWidth } = this.state;
    const maxListWidth = 30;
    const minListWidth = 10;
    let newListWidth = listWidth + e.movementX / 15;
    newListWidth = Math.max(Math.min(newListWidth, maxListWidth), minListWidth);
    this.setState({
      listWidth: newListWidth
    });
  }

  saveWidthIntoStorage() {
    const { listWidth } = this.state;
    localStorage.set(this.storageKeyForWidth, listWidth);
  }

  updateState(data) {
    this.setState(data);
  }

  toggleFullSchmea() {
    const { isFullSchemaOpen } = this.state;
    this.setState({
      isFullSchemaOpen: !isFullSchemaOpen
    });
  }

  saveCurrentSchema() {
    appStore.saveCurrentToStorage();
  }

  render() {
    const { selectedEndpointIds, selectedTagIds, isFullSchemaOpen, listWidth } = this.state;
    return (
      <div className="app">
        {/* Header */}
        <Header
          id={this.headerId}
          updateState={::this.updateState}
          toggleFullSchmea={::this.toggleFullSchmea} />

        {/* Main */}
        <div id={this.mainId} className="flex wrapper">
          {appStore.isLoaded &&
            <Fragment>
              {/* Left list */}
              <List
                selectedTagIds={selectedTagIds}
                selectedEndpointIds={selectedEndpointIds}
                style={{ flex: `0 0 ${listWidth}rem` }} />

              <DraggableCore axis="x" onDrag={::this.handleWidthDrag}>
                <div
                  className="self-stretch cursor-col-resize w-8"
                  style={{ flex: "0 0 2rem" }} />
              </DraggableCore>

              {/* Right detail content */}
              <Detail
                headerId={this.headerId}
                selectedTagIds={selectedTagIds}
                selectedEndpointIds={selectedEndpointIds} />
            </Fragment>
          }

          {isFullSchemaOpen &&
            <FullSchema
              toggleFullSchmea={::this.toggleFullSchmea} />
          }
        </div>
      </div>
    );
  }
}
