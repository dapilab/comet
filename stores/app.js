import { observable, action } from "mobx";
import { v4 as uuidv4 } from "uuid";

import localStorage from "libs/localStorage";
import { STORAGE_KEYS } from "constant";

import tagStore from "./tag";
import endpointStore from "./endpoint";
import componentStore from "./component";

class Store {
  @observable isLoaded = false

  constructor() {
    this.id = null;
    this.data = {};
  }

  @action load(id, data) {
    this.isLoaded = true;
    if (id) this.id = id;
    if (data) this.data = data;
  }

  @action unload() {
    this.isLoaded = false;
    this.id = null;
    this.data = {};
    tagStore.reset();
    endpointStore.reset();
    componentStore.reset();
  }

  @action create() {
    this.unload();

    const id = uuidv4();
    const data = {
      openapi: "3.0.1",
      info: {
        title: `Project ${id.slice(0, 8)}`,
        description: "",
        version: "1.0.0"
      }
    };

    // Add into local storage
    localStorage.set(id, JSON.stringify(data));

    // Add into local storage projects
    let projects = localStorage.get(STORAGE_KEYS.PROJECTS);
    projects = projects && JSON.parse(projects) || [];
    projects.unshift(id);
    localStorage.set(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

    this.load(id, data);
  }

  @action loadFromSchema(data) {
    tagStore.reset();
    endpointStore.reset();
    componentStore.reset();

    // Load tags
    if (data.tags) {
      data.tags.forEach((tag) => {
        tagStore.findOrCreateByName(tag.name);
      });
    }

    // Load components
    if (data.components && data.components.schemas) {
      Object.keys(data.components.schemas).forEach((componentName) => {
        const property = data.components.schemas[componentName];
        if (!property.type) property.type = "object";
        componentStore.create({
          name: componentName,
          property
        });
      });
    }

    // Load endpoints
    if (data.paths) {
      Object.keys(data.paths).forEach((url) => {
        Object.keys(data.paths[url]).forEach((method) => {
          const apiSchmea = data.paths[url][method];
          endpointStore.create({
            name: apiSchmea.summary || "",
            description: apiSchmea.description || "",
            method,
            url,
            tags: apiSchmea.tags || [],
            parameters: apiSchmea.parameters || null,
            requestBody: apiSchmea.requestBody || null,
            responses: apiSchmea.responses || null
          });
        });
      });
    }
  }

  @action toOPENAPI({ keepEmptyTag = false } = {}) {
    // tags
    const tags = tagStore.fullList
      .filter((tagId) => {
        if (keepEmptyTag) return true;
        return endpointStore.tags[tagId] && endpointStore.tags[tagId].data.length > 0;
      })
      .map((tagId) => ({
        name: tagStore.data[tagId].name
      }));

    // paths
    const paths = {};
    tagStore.fullList
      .map((tagId) => {
        if (!endpointStore.tags[tagId]) return [];
        return endpointStore.tags[tagId].data;
      })
      .reduce((acc, endIds) => acc.concat(endIds), [])
      .forEach((endpoinId) => {
        const endpoint = endpointStore.data[endpoinId];
        const openAPIFormat = endpointStore.toOpenAPIFormat(endpoinId);
        paths[endpoint.url] = {
          ...paths[endpoint.url],
          ...openAPIFormat[endpoint.url]
        };
      });

    // components
    const components = { schemas: {} };
    componentStore.list.forEach((componentId) => {
      const component = componentStore.data[componentId];
      components.schemas[component.name] = component.property;
    });

    const responses = {
      ...this.data,
      tags,
      paths,
      components
    };
    if (responses.tags.length === 0) delete responses.tags;
    if (Object.keys(responses.paths).length === 0) delete responses.paths;
    if (Object.keys(responses.components.schemas).length === 0) delete responses.components;

    return responses;
  }

  @action saveCurrentToStorage() {
    const data = this.toOPENAPI({ keepEmptyTag: true });
    localStorage.set(this.id, JSON.stringify(data));
  }
}

export default new Store();
