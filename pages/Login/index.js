import React, { Component } from "react";

import { appStore } from "../../stores";

export default class Login extends Component {
  onClick() {
    appStore.login();
  }

  render() {
    return (
      <button type="button" onClick={::this.onClick}>
        Login
      </button>
    );
  }
}
