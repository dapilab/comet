import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

require("./index.scss");

export default class SubMenu extends Component {
  static propTypes = {
    className: PropTypes.string,
    optClassName: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
      tooltip: PropTypes.string,
      description: PropTypes.string,
      color: PropTypes.string
    })).isRequired,
    onChange: PropTypes.func.isRequired,
    align: PropTypes.oneOf(["left", "right"]),
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    childShowWhenOpen: PropTypes.bool,
    eventBubble: PropTypes.bool
  }

  static defaultProps = {
    align: "right",
    childShowWhenOpen: true,
    eventBubble: false
  }

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      optAction: {} // { index: { action: 'confirm', cb: func } }
    };
    this.close = this.close.bind(this);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.close);
  }

  toggle(e) {
    const { eventBubble } = this.props;
    if (e && !eventBubble) {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }
    const { onOpen, onClose } = this.props;
    const { isOpen } = this.state;

    const newState = { isOpen: !isOpen };
    if (!isOpen) { newState.optAction = {}; }
    this.setState(newState, () => {
      const newIsOpen = !isOpen;
      if (newIsOpen) {
        document.addEventListener("click", this.close);
        if (onOpen) onOpen();
      } else {
        document.removeEventListener("click", this.close);
        if (onClose) onClose();
      }
    });
  }

  close(e) {
    e && e.stopPropagation();
    const { onClose } = this.props;
    this.setState({
      isOpen: false
    }, () => {
      document.removeEventListener("click", this.close);
      if (onClose) onClose();
    });
  }

  async onClickOpt(value, idx, e) {
    const { optAction } = this.state;
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    const { onChange } = this.props;
    const handler = await onChange(value);
    switch (typeof handler) {
      case "boolean": {
        if (!handler) this.close();
        break;
      }
      case "object": {
        optAction[idx] = handler; // { action, cb }
        this.setState({ optAction });
        break;
      }
    }
  }

  cancelAction(idx, e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    const { optAction } = this.state;
    delete optAction[idx];
    this.setState({ optAction });
  }

  async confirmAction(idx, e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    const { optAction } = this.state;
    const { cb } = optAction[idx];
    await cb();
  }

  genOptions(options) {
    const { optAction } = this.state;
    return options.map((opt, idx) => {
      if (optAction[idx]) {
        const { action } = optAction[idx];
        switch (action) {
          case "confirm": {
            return (
              <div
                key={opt.value}
                className="whitespace-no-wrap cursor-pointer py-2 px-6 flex items-center justify-between">
                <span
                  className="red transition-20 hover:opacity-75"
                  onClick={this.cancelAction.bind(this, idx)}>
                  Cancel
                </span>
                <span
                  className="ml-3 green transition-20 hover:opacity-75"
                  onClick={this.confirmAction.bind(this, idx)}>
                  Confirm
                </span>
              </div>
            );
          }
        }
      }

      return (
        <div
          key={opt.value}
          className="whitespace-no-wrap cursor-pointer py-2 px-6 transition-35 hover:opacity-50"
          style={{ color: opt.color || "inherit" }}
          onClick={this.onClickOpt.bind(this, opt.value, idx)}>
          <p>{opt.label}</p>
          {opt.description && <p className="text-xs grey-light">{opt.description}</p> || undefined}
        </div>
      );
    });
  }

  render() {
    let { className } = this.props;
    const { optClassName, options, align, childShowWhenOpen } = this.props;
    const { isOpen } = this.state;
    const optionItems = this.genOptions(options);
    if (!/(absolute|relative|fixed|sticky)/.test(className)) className += " relative";
    return (
      <div
        className={classnames("SubMenu inline-block", className, {
          childShow: isOpen && childShowWhenOpen
        })}
        onClick={::this.toggle}>
          {...this.props.children}
        <div
          className={classnames("opts grey-shadow absolute text-sm rounded py-2 z-10", optClassName, {
            active: isOpen,
            "pointer-events-none": !isOpen,
            "left-0": align === "left",
            "right-0": align === "right"
          })}
          onWheel={(e) => e.stopPropagation()}>
          {optionItems}
        </div>
      </div>
    );
  }
}
