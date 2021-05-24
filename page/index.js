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

const petstoreYAML = require("../examples/petstore.yaml");

@observer
export default class Application extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isExample: false,
      // Searching
      selectedEndpointIds: null,
      selectedTagIds: null,
      // Full schema
      isFullSchemaOpen: false
    };

    this.isExample = false;
    this.headerId = "header";
    this.mainId = "main";
    this.storageKeyForWidth = "__api_list_width__";

    this.saveCurrentSchema = this.saveCurrentSchema.bind(this);
  }

  componentDidMount() {
    // Check if is example
    let isExample = false;
    let example = null;
    if (/\/\?/.test(window.location.href)) {
      const query = window.location.href.replace(/\S*\/\?/, " ").trim();
      const res = query.split("=");
      if (res[0] === "example") {
        isExample = true;
        example = res[1];
      }
    }

    // Setup main height
    const headerHeight = document.getElementById(this.headerId).clientHeight;
    const mainHTML = document.getElementById(this.mainId);
    mainHTML.style.height = `calc(100vh - ${headerHeight}px)`;

    // Setup list width
    const listWidth = localStorage.get(this.storageKeyForWidth, "float") || 16;

    this.setState({
      isExample,
      listWidth
    });

    // Load example
    if (isExample) {
      switch (example) {
        case "petstore": {
          appStore.loadFromSchema(petstoreYAML);
          appStore.load(appStore.id, petstoreYAML);
          return;
        }
      }
    }

    // Load latest project
    if (!isExample) {
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
    }

    if (!isExample) {
      window.addEventListener("beforeunload", this.saveCurrentSchema);
    }
  }

  componentWillUnmount() {
    const { isExample } = this.state;
    if (!isExample) {
      window.removeEventListener("beforeunload", this.saveCurrentSchema);
    }
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
    const { selectedEndpointIds, selectedTagIds, isFullSchemaOpen, listWidth, isExample } = this.state;
    return (
      <div className="app">
        {/* Header */}
        <Header
          id={this.headerId}
          updateState={::this.updateState}
          toggleFullSchmea={::this.toggleFullSchmea}
          isExample={isExample} />

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
