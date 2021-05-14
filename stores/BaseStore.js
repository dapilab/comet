import { observable } from "mobx";

export default class BaseStore {
  @observable observerTrigger = 1;

  triggerObserver() {
    const deg = this.observerTrigger < 2 && 1 || -1;
    this.observerTrigger += deg;
  }
}
