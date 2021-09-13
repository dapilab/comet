import { action } from "mobx";
import { v4 as uuidv4 } from "uuid";
import clonedeep from "lodash.clonedeep";

import BaseStore from "./BaseStore";
import tagStore from "./tag";
import componentStore from "./component";

class Store extends BaseStore {
  constructor() {
    super();
    this.data = {}; // { id: { name, description, method, url, parameters, requestBody, responses } }
    this.tags = {}; // { tagId: { data: [endpointId] }, isDefault }

    this._componentUsed = {}; // { endpointId: Set{component.id} }
    this.isJumpingToPointed = false;
    this.justAddedId = null;
  }

  addEndpoint(endpoint, { force = false, assign = false } = {}) {
    if (!force && this.data[endpoint.id] && !assign) return;
    let data = endpoint;
    if (this.data[endpoint.id] && assign) {
      const originalData = this.data[endpoint.id];
      data = { ...originalData, ...data };
    }

    // Update this._componentUsed
    this._componentUsed[endpoint.id] = new Set();
    const matchedRefs = JSON.stringify(data).match(/{"\$ref":\s*"#\/components\/schemas\/[^"]+"}/g) || [];
    matchedRefs.forEach((matchedRef) => {
      const refName = JSON.parse(matchedRef).$ref;
      const componentId = componentStore.findByName(refName);
      if (componentId) {
        this._componentUsed[endpoint.id].add(componentId);
      }
    });

    this.data[endpoint.id] = data;
  }

  @action reset() {
    this.data = {};
    this.tags = {};

    this._componentUsed = {};
    this.isJumpingToPointed = false;
    this.justAddedId = null;
  }

  @action create(endpoint, { unshift = false } = {}) {
    endpoint.id = endpoint.id || uuidv4();

    // Extract the tag when loading from extra file
    if (endpoint.tags) {
      const tagName = endpoint.tags[0]; // TODO: multiple tags?
      let tagId;
      if (tagName) {
        [tagId] = tagStore.findOrCreateByName(tagName);
        this.tags[tagId] = this.tags[tagId] || { data: [] };
      } else {
        tagId = tagStore.getDefaultTagId();
        this.tags[tagId] = this.tags[tagId] || { data: [], isDefault: true };
      }
      endpoint.tagId = tagId;
    }

    // Add into this.tags
    if (endpoint.tagId) {
      this.tags[endpoint.tagId] = this.tags[endpoint.tagId] || {
        data: [],
        isDefault: endpoint.tagId === tagStore.defaultTagId
      };
      if (unshift) {
        this.tags[endpoint.tagId].data.unshift(endpoint.id);
      } else {
        this.tags[endpoint.tagId].data.push(endpoint.id);
      }
    }

    // Add into this.data
    this.addEndpoint(endpoint);

    this.triggerObserver();

    return endpoint;
  }

  @action toOpenAPIFormat(id) {
    const endpoint = this.data[id];
    const tag = tagStore.data[endpoint.tagId];
    const url = endpoint.url || "url...";
    const returnJSON = {
      [url]: {
        [endpoint.method]: {
          summary: endpoint.name || null,
          description: endpoint.description || "",
          tags: tag && [tag.name] || null,
          parameters: endpoint.parameters || null,
          requestBody: endpoint.requestBody || null,
          responses: endpoint.responses || null
        }
      }
    };

    // Remove null fileds, except for description
    Object.keys(returnJSON[url][endpoint.method]).forEach((key) => {
      if (key !== "description" && !returnJSON[url][endpoint.method][key]) {
        delete returnJSON[url][endpoint.method][key];
      }
    });

    return returnJSON;
  }

  @action jumpToPointed() {
    this.isJumpingToPointed = true;
    setTimeout(() => {
      this.isJumpingToPointed = false;
    }, 1500);
  }

  @action searchEndpoint(text) {
    const selectedEndpointIds = Object.keys(this.data)
      .filter((endpointId) => {
        const endpoint = this.data[endpointId];
        if (!endpoint) return false;
        const regExp = new RegExp(`${text}`, "i");
        return regExp.test(`${endpoint.name} ${endpoint.description} ${endpoint.url}`);
      });
    const selectedTagIds = Array.from(new Set(selectedEndpointIds.map((endpointId) => {
      const endpoint = this.data[endpointId];
      return endpoint.tagId || tagStore.getDefaultTagId();
    })));
    return {
      endpointIds: selectedEndpointIds,
      tagIds: selectedTagIds
    };
  }

  @action updateById(id, data) {
    const originalTagId = this.data[id].tagId;
    let newTagId = null;
    if (data.tag) {
      const res = tagStore.findOrCreateByName(data.tag);
      data.tagId = res[0];
      newTagId = res[0];
    }

    this.addEndpoint({ ...data, id }, { assign: true });

    // If tag changed, move the endpoint to the new tag group
    if (newTagId && originalTagId !== newTagId) {
      newTagId = newTagId || tagStore.getDefaultTagId();
      const idxInOriginalTag = this.tags[originalTagId].data.findIndex((endpointId) => endpointId === id);
      this.tags[originalTagId].data.splice(idxInOriginalTag, 1);

      this.tags[newTagId] = this.tags[newTagId] || { data: [], isDefault: newTagId === tagStore.getDefaultTagId() };
      this.tags[newTagId].data.push(id);
    }

    this.triggerObserver();

    return {
      tagChanged: originalTagId !== newTagId,
      endpointId: id
    };
  }

  @action async removeById(id) {
    const endpoint = this.data[id];

    // Remove from this.data
    delete this.data[id];

    // Remove from this.tags
    const tagIdx = this.tags[endpoint.tagId].data.findIndex((eId) => eId === id);
    this.tags[endpoint.tagId].data.splice(tagIdx, 1);

    // Update this._componentUsed
    delete this._componentUsed[id];

    this.triggerObserver();
  }

  @action async duplicate(endpointId) {
    const endpoint = clonedeep(this.data[endpointId]);
    delete endpoint.id;
    const newEndpoint = await this.create(endpoint);
    return newEndpoint;
  }

  @action moveToDefaultTag() {
    const defaultId = tagStore.getDefaultTagId();
    this.tags[defaultId] = this.tags[defaultId] || { data: [], isDefault: true };

    this.tags[defaultId].data.forEach((endpointId) => {
      this.tags[defaultId].data.push(endpointId);
    });
  }
}

export default new Store();
