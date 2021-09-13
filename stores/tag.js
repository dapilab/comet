import { observable, action, computed } from "mobx";
import { v4 as uuidv4 } from "uuid";

import BaseStore from "./BaseStore";

class Store extends BaseStore {
  @observable list = []; // [tagId]

  constructor() {
    super();
    this.defaultTagId = uuidv4();
    this.data = { [this.defaultTagId]: { name: "Default" } }; // { id: { name } }
  }

  addTag(tag, { force = false, assign = false } = {}) {
    if (!force && this.data[tag.id] && !assign) return;
    let data = tag;
    if (this.data[tag.id] && assign) {
      const originalData = this.data[tag.id];
      data = { ...originalData, ...data };
    }
    this.data[tag.id] = data;
  }

  @computed get fullList() {
    return this.list.concat([this.defaultTagId]);
  }

  @action reset() {
    this.defaultTagId = uuidv4();
    this.data = { [this.defaultTagId]: { name: "Default" } };
    this.list = [];
  }

  @action findByName(tagName) {
    return this.fullList.find((id) => this.data[id].name === tagName);
  }

  @action findOrCreateByName(tagName, { unshifit = false } = {}) {
    let tagId = this.fullList.find((id) => this.data[id].name === tagName);
    let isNew = false;
    if (!tagId) {
      tagId = uuidv4();
      this.data[tagId] = {
        name: tagName
      };

      if (unshifit) {
        this.list.unshifit(tagId);
      } else {
        this.list.push(tagId);
      }

      isNew = true;
    }
    return [tagId, isNew];
  }

  @action async updateById(id, data) {
    this.addTag({ ...data, id }, { assign: true });
    this.triggerObserver();
    return this.data[id];
  }

  @action async removeById(tagId) {
    const idx = this.list.findIndex((item) => item === tagId);
    this.list.splice(idx, 1);
    delete this.data[tagId];
    this.triggerObserver();
  }

  @action getDefaultTagId() {
    return this.defaultTagId;
  }
}

export default new Store();
