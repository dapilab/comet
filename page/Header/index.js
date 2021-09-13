import React, { Component, Fragment } from "react";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import classnames from "classnames";

import { endpointStore, appStore } from "stores";
import localStorage from "libs/localStorage";
import { STORAGE_KEYS } from "constant";

import SubMenu from "components/SubMenu";

@observer
export default class Header extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    updateState: PropTypes.func.isRequired,
    toggleFullSchmea: PropTypes.func,
    isExample: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = {
      searchValue: ""
    };
  }

  /**
   * Searching
   */
  onChangeSearchValue(e) {
    this.setState({
      searchValue: e.target.value
    });
  }

  searchReset() {
    const { updateState } = this.props;
    this.setState({
      searchValue: ""
    }, () => {
      updateState({
        selectedEndpointIds: null,
        selectedTagIds: null
      });
    });
  }

  onKeyUpSearchInput(e) {
    if (e.keyCode === 13) {
      this.goSearch();
    }
  }

  goSearch() {
    const { updateState } = this.props;
    const { searchValue } = this.state;
    if (!searchValue) return this.searchReset();
    const { endpointIds, tagIds } = endpointStore.searchEndpoint(searchValue);
    updateState({
      selectedEndpointIds: endpointIds,
      selectedTagIds: tagIds
    });
  }

  onCreateNew() {
    appStore.create();
  }

  selectProject(projectId) {
    if (projectId === "remove") {
      localStorage.remove(appStore.id);

      let projectIds = localStorage.get(STORAGE_KEYS.PROJECTS);
      projectIds = projectIds && JSON.parse(projectIds) || [];
      const idx = projectIds.findIndex((id) => id === appStore.id);
      projectIds.splice(idx, 1);
      localStorage.set(STORAGE_KEYS.PROJECTS, projectIds);

      const latestProjectId = projectIds[0];
      const latestProject = latestProjectId && localStorage.get(latestProjectId);
      if (!latestProject) {
        appStore.create();
      } else {
        appStore.unload();
        appStore.loadFromSchema(JSON.parse(latestProject));
        appStore.load(latestProjectId, JSON.parse(latestProject));
      }

      return false;
    }

    const project = localStorage.get(projectId);
    appStore.saveCurrentToStorage();
    appStore.unload();
    appStore.loadFromSchema(JSON.parse(project));
    appStore.load(projectId, JSON.parse(project));
    return false;
  }

  render() {
    const { id, toggleFullSchmea, isExample } = this.props;
    const { searchValue } = this.state;

    let projectIds = localStorage.get(STORAGE_KEYS.PROJECTS);
    projectIds = projectIds && JSON.parse(projectIds) || [];
    const projectOpts = projectIds
      .map((id) => {
        let project = localStorage.get(id);
        project = project && JSON.parse(project) || null;
        if (id === appStore.id) {
          project = appStore.data;
        }
        return project
          ? { value: id, label: project.info && project.info.title || "projectName" }
          : null;
      })
      .filter((item) => item !== null);

    const projectName = appStore.data && appStore.data.info && appStore.data.info.title || "projectName";
    return (
      <header
        id={id}
        className="py-2 wrapper flex items-center justify-between">
        {/* Search input */}
        <div className="flex items-center">
          <i className="iconfont icon-search grey-light mr-2" />
          <input
            className="input text-sm w-48 bg-transparent"
            placeholder="Search API name/url/desc ..."
            value={searchValue}
            onChange={::this.onChangeSearchValue}
            onKeyUp={::this.onKeyUpSearchInput} />
          <div className={classnames("text-xs", {
            fadeRightHide: !searchValue,
            fadeRightShow: searchValue
          })}>
            <button
              className="btn primary py-1.5 px-4 ml-2 mr-3"
              onClick={::this.goSearch}>
              Search
            </button>
            <button
              className="btn secondary-transparent py-1.5 px-1"
              onClick={::this.searchReset}>
              Reset
            </button>
          </div>
        </div>

        {/* Actions */}
        {appStore.isLoaded &&
          <div className="flex items-center text-sm">
            <p
              className="px-5 cursor-pointer hover:opacity-75 transition-20 py-2"
              onClick={toggleFullSchmea}>
              Full Schema
            </p>
            {!isExample &&
              <Fragment>
                <p
                  className="px-5 cursor-pointer hover:opacity-75 transition-20 py-2"
                  onClick={::this.onCreateNew}>
                  New Project
                </p>
                <SubMenu
                  options={[{
                    value: "remove",
                    label: `Remove ${projectName}`,
                    color: "#EE726D"
                  }].concat(projectOpts)}
                  align="right"
                  onChange={::this.selectProject}>
                  <p className="pl-5 cursor-pointer hover:opacity-75 transition-20 py-2">
                    {projectName}
                    <i className="iconfont icon-arrow-down ml-1 font-bold" />
                  </p>
                </SubMenu>
              </Fragment>
            }
            <a
              className="iconfont icon-github transition-20 hover:opacity-50 text-lg ml-6"
              href="https://github.com/chilllab/comet" />
          </div>
        }
      </header>
    );
  }
}
