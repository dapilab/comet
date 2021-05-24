import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import cloneDeep from "lodash.clonedeep";

import { renderModelAttribute } from "libs/render";

require("./index.scss");

export default class ParameterRender extends Component {
  static propTypes = {
    parameters: PropTypes.array
  };

  static defaultProps = {
    parameters: []
  }

  genParameter(parameter, idx) {
    if (!parameter.schema) return;
    const schema = cloneDeep(parameter.schema);
    Object.keys(parameter)
      .filter((key) => !["in", "name", "schema"].includes(key))
      .forEach((key) => { schema[key] = parameter[key]; });
    const element = renderModelAttribute(parameter.name, schema, {});
    return (
      <Fragment key={idx}>{element}</Fragment>
    );
  }

  render() {
    const { parameters } = this.props;
    const header = [];
    const path = [];
    const query = [];
    parameters.forEach((parameter, idx) => {
      if (!parameter) return;
      const paramterElem = this.genParameter(parameter, idx);
      if (parameter.in === "header") header.push(paramterElem);
      if (parameter.in === "path") path.push(paramterElem);
      if (parameter.in === "query") query.push(paramterElem);
    });

    return (
      <div className="ParameterRender">
        {header.length > 0 &&
          <div className="flex flex-col mt-5">
            <div className="gradientBorder mb-2">
              <p className="text-sm relative leading-none">Header</p>
            </div>
            <div className="text-sm">
              {header}
            </div>
          </div>
        }
        {path.length > 0 &&
          <div className="flex flex-col mt-5">
            <div className="gradientBorder mb-2">
              <p className="text-sm relative leading-none">Path</p>
            </div>
            <div className="text-sm">
              {path}
            </div>
          </div>
        }
        {query.length > 0 &&
          <div className="flex flex-col mt-5">
            <div className="gradientBorder mb-2">
              <p className="text-sm relative leading-none">Query</p>
            </div>
            <div className="text-sm">
              {query}
            </div>
          </div>
        }
      </div>
    );
  }
}
