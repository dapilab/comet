import React from "react";
import { Router, browserHistory } from "react-router";
import { hot } from "react-hot-loader";

import routes from "../routes";

const App = () => <Router key={module.hot && new Date()} history={browserHistory} routes={routes} />;

export default hot(module)(App);
