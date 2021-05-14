import { observable, action } from "mobx";

class Store {
  @observable isLogin = false;

  @action login() {
    this.isLogin = true;
  }
}

export default new Store();
