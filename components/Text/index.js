import React, { Component, createRef } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import { nanoid } from "nanoid";

export default class Text extends Component {
  static propTypes = {
    content: PropTypes.string,
    placeholder: PropTypes.string.isRequired,
    className: PropTypes.string,
    isEditable: PropTypes.bool,
    onSave: PropTypes.func,
    spellCheck: PropTypes.bool,
    onKeyDown: PropTypes.func,
    onKeyUp: PropTypes.func,
    enterForSave: PropTypes.bool,
    onDoubleClick: PropTypes.func,
    trim: PropTypes.bool,
    style: PropTypes.object
  };

  static defaultProps = {
    isEditable: true,
    spellCheck: false,
    enterForSave: false
  };

  constructor(props) {
    super(props);
    this.contentRef = createRef();
    this.saveByEnter = false;
    this.id = `text-${nanoid()}`;
  }

  get value() {
    const { trim } = this.props;
    const value = this.contentRef.current.textContent;
    if (trim) return value.trim();
    return value;
  }

  focus() {
    const { id } = this;

    const elem = document.querySelector(`#${id}`);
    const textNode = elem.firstChild;
    const caret = textNode.length;
    const range = document.createRange();
    const sel = window.getSelection();

    elem.focus();

    range.setStart(textNode, caret);
    range.setEnd(textNode, caret);

    sel.removeAllRanges();
    sel.addRange(range);
  }

  onBlur() {
    const { onSave, content, trim } = this.props;
    if (onSave) {
      let value = this.contentRef.current.textContent;
      if (trim) value = value.trim();
      if (value !== content) {
        try {
          onSave(value, { saveByEnter: this.saveByEnter });
        } catch (err) {
          this.contentRef.current.innerText = content;
          this.focus();
        }
      }
    }
    this.saveByEnter = false;
  }

  onKeyDown(e) {
    const { enterForSave, onKeyDown } = this.props;
    if (e.keyCode === 13) {
      if (enterForSave) e.preventDefault();
    }
    if (onKeyDown) onKeyDown(e);
  }

  onKeyUp(e) {
    const { enterForSave, onKeyUp, trim } = this.props;
    if (e.keyCode === 13) {
      if (enterForSave) {
        this.saveByEnter = true;
        this.contentRef.current.blur();
      }
    }
    if (onKeyUp) {
      const value = this.contentRef.current.textContent;
      onKeyUp(e, trim ? value.trim() : value);
    }
  }

  render() {
    const { id } = this;
    const { content, className, placeholder, isEditable, spellCheck, onDoubleClick, style } = this.props;
    return (
      <div
        id={id}
        className={classnames("Text cursor-text", className)}
        style={style}
        contentEditable={isEditable}
        suppressContentEditableWarning
        spellCheck={spellCheck}
        placeholder={placeholder}
        ref={this.contentRef}
        onBlur={::this.onBlur}
        onKeyDown={::this.onKeyDown}
        onKeyUp={::this.onKeyUp}
        onDoubleClick={onDoubleClick}
        data-type="text">
        {content}
      </div>
    );
  }
}
