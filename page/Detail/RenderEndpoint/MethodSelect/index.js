import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

import { methodToLabelMapping, methodToClassName } from "constant";

require("./index.scss");

export default class MethodSelect extends Component {
  static propTypes = {
    className: PropTypes.string,
    method: PropTypes.oneOf(["get", "post", "patch", "delete", "put", "head"]),
    onChange: PropTypes.func,
    size: PropTypes.oneOf(["base", "small"]),
    isEditable: PropTypes.bool
  };

  static defaultProps = {
    method: "get",
    size: "base",
    isEditable: true
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

  static getDerivedStateFromProps(props) {
    return {
      method: props.method,
      methodColorClass: methodToClassName[props.method]
    };
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
    const { isEditable } = this.props;
    const { isOpen } = this.state;
    if (!isEditable) return;
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
    const { className, size, isEditable } = this.props;
    const { isOpen, method, methodColorClass } = this.state;

    const methodItems = this.genMethodOpts();
    const methodLabel = methodToLabelMapping[method];
    return (
      <div
        className={classnames(
          "MethodSelect black flex item-center relative no-shadow relative",
          className,
          {
            "cursor-pointer": isEditable
          }
        )}
        onClick={::this.toggleOpen}>
        <label
          className={classnames("font-bold", methodColorClass, {
            "cursor-pointer": isEditable
          })}>
          {methodLabel}
        </label>
        {isEditable &&
          <Fragment>
            <i
              className={classnames("iconfont iconarrow-down font-bold cursor-pointer arrowIcon absolute left-0", methodColorClass,
                {
                  "text-sm": size === "small",
                  smallMargin: size === "small",
                  open: isOpen
                })} />
            <div
              className={classnames(
                "options absolute left-0 rounded mt-1 bg-white z-10 py-2 fadeUpHide text-sm",
                { fadeUpShow: isOpen }
              )}
              onClick={(e) => e.stopPropagation()}>
              {methodItems}
            </div>
          </Fragment>
        }
      </div>
    );
  }
}
