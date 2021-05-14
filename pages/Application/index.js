import React, { Component } from "react";
import { observer } from "mobx-react";
import PropTypes from "prop-types";

import { appStore } from "../../stores";

require("../../shared-style/basic.scss");

@observer
class Application extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  };

  render() {
    const { children } = this.props;
    return (
      <div className="app">
        <p>{(appStore.isLogin && "logged in") || "unlogged in"}</p>
        {children}
      </div>
    );
  }
}

export default Application;
