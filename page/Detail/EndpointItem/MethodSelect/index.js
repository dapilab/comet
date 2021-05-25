import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

import { methodToLabelMapping, methodToClassName } from "constant";

require("./index.scss");

export default class MethodSelect extends Component {
  static propTypes = {
    className: PropTypes.string,
    method: PropTypes.oneOf(["get", "post", "patch", "delete", "put", "head"]),
    onChange: PropTypes.func,
    size: PropTypes.oneOf(["base", "small"])
  };

  static defaultProps = {
    method: "get",
    size: "base"
  }

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      method: props.method,
      methodColorClass: methodToClassName[props.method]
    };
    this.close = this.close.bind(this);
  }

  onClick(method, e) {
    e.stopPropagation();
    const { onChange } = this.props;
    const methodColorClass = methodToClassName[method];
    this.setState({
      method,
      methodColorClass
    }, () => {
      if (onChange) {
        onChange(method);
      }
    });
  }

  genMethodOpts() {
    return Object.entries(methodToLabelMapping).map(([value, label]) => (
      <div
        key={value}
        className="transition-25 black methodItem px-10 py-2 transition-25"
        onClick={this.onClick.bind(this, value)}>
        {label}
      </div>
    ));
  }

  toggleOpen() {
    const { isOpen } = this.state;
    this.setState({ isOpen: !isOpen }, () => {
      const newIsOpen = !isOpen;
      if (newIsOpen) {
        document.addEventListener("click", this.close);
      } else {
        document.removeEventListener("click", this.close);
      }
    });
  }

  close() {
    this.setState({ isOpen: false }, () => {
      document.removeEventListener("click", this.close);
    });
  }

  render() {
    const { className, size } = this.props;
    const { isOpen, method, methodColorClass } = this.state;

    const methodItems = this.genMethodOpts();
    const methodLabel = methodToLabelMapping[method];
    return (
      <div
        className={classnames(
          "MethodSelect flex item-center cursor-pointer relative no-shadow relative",
          className
        )}
        onClick={::this.toggleOpen}>
        <label className={classnames("cursor-pointer font-bold", methodColorClass, {
          "text-sm": size === "small"
        })}>
          {methodLabel}
        </label>
        <div className="arrowIcon flex items-center justify-center absolute left-0 text-lg top-0 bottom-0">
          <i className={classnames("iconfont icon-arrow-down font-bold cursor-pointer",
            methodColorClass,
            {
              open: isOpen
            })} />
        </div>
        <div
          className={classnames(
            "options absolute left-0 rounded mt-1 bg-white z-10 py-2 fadeUpHide text-sm",
            { fadeUpShow: isOpen }
          )}
          onClick={(e) => e.stopPropagation()}>
          {methodItems}
        </div>
      </div>
    );
  }
}
