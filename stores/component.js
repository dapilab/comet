import { observable, action } from "mobx";
import { v4 as uuidv4 } from "uuid";

import BaseStore from "./BaseStore";

class Store extends BaseStore {
  @observable list = [];

  constructor() {
    super();
    this.data = {}; // { id: { name, property } }
    this.isJumpingToPointed = false;
    this.justAddedId = null;
  }

  addComponent(component, { force = false, assign = false } = {}) {
    if (!force && this.data[component.id] && !assign) return;
    let data = component;
    if (this.data[component.id] && assign) {
      const originalData = this.data[component.id];
      data = { ...originalData, ...data };
    }
    this.data[component.id] = data;
  }

  @action reset() {
    this.data = {};
    this.isJumpingToPointed = false;
    this.justAddedId = null;
    this.list = [];
  }

  @action create(component, callback) {
    const id = component.id || uuidv4();
    component.id = id;
    this.addComponent(component);
    this.list.push(id);
    if (callback) callback(id);
    return component;
  }

  /**
   * @params
   *  - name | String, e.g. '#/components/schemas/ModelName'
   * @returns
   *  - id
   */
  @action findByName(name) {
    name = name.replace(/^#\/components\/schemas\//, "");
    return Object.keys(this.data).find((id) => this.data[id].name === name);
  }

  @action jumpToPointed() {
    this.isJumpingToPointed = true;
    setTimeout(() => {
      this.isJumpingToPointed = false;
    }, 1500);
  }

  @action updateById(id, data) {
    this.addComponent({ ...data, id }, { assign: true });
    this.triggerObserver();
    return data;
  }

  @action removeById(id) {
    const idx = this.list.findIndex((item) => item === id);
    this.list.splice(idx, 1);
    delete this.data[id];
    this.triggerObserver();
  }
}

export default new Store();
