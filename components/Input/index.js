import React, { Component, createRef } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

require("./index.scss");

export default class Input extends Component {
  static propTypes = {
    placeholder: PropTypes.string,
    type: PropTypes.string,
    defaultValue: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    className: PropTypes.string,
    noTip: PropTypes.bool,
    onKeyUp: PropTypes.func,
    inputId: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.state = {
      showTip: !!props.defaultValue,
      value: props.defaultValue || "",
      isError: false
    };
    this.inputRef = createRef();
  }

  get value() {
    const { value } = this.state;
    return value;
  }

  getError() {
    this.setState({
      isError: true
    });
  }

  focus() {
    const { onFocus } = this.props;
    const { value } = this.state;
    this.inputRef.current.focus();
    this.inputRef.current.selectionStart = value.length;
    this.inputRef.current.selectionEnd = value.length;
    if (onFocus) onFocus();
  }

  clean() {
    return this.setState({
      isError: false,
      value: ""
    });
  }

  reset() {
    return this.setState({
      showTip: false,
      isError: false,
      value: ""
    });
  }

  onChange(e) {
    const { onChange } = this.props;
    const { value } = e.target;
    const newState = {
      isError: false,
      value
    };
    this.setState(newState, () => {
      if (onChange) onChange(value);
    });
  }

  onFocus() {
    const { onFocus } = this.props;
    this.setState({
      showTip: true
    });
    if (onFocus) onFocus();
  }

  onBlur() {
    const { onBlur } = this.props;
    const { value } = this.state;
    if (!value) {
      this.setState({
        showTip: false
      });
    }
    if (onBlur) onBlur(value);
  }

  render() {
    const { placeholder, type = "text", className, noTip, onKeyUp, inputId } = this.props;
    const { showTip, value, isError } = this.state;
    return (
      <div className={classnames("Input", className, { error: isError })}>
        {!noTip &&
          <div className={classnames("tip", {
            isPlaceholder: !showTip,
            "text-xs": showTip
          })}>
            <p>{placeholder}</p>
          </div>
        }
        <input
          id={inputId || null}
          className="inputElem"
          placeholder={noTip ? placeholder : ""}
          ref={this.inputRef}
          type={type}
          value={value}
          onChange={::this.onChange}
          onKeyUp={onKeyUp}
          onFocus={::this.onFocus}
          onBlur={::this.onBlur} />
      </div>
    );
  }
}
