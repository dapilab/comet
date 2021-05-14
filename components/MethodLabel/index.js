import React from "react";
import PropTypes from "prop-types";
import classnames from "classnames";

import { methodToClassName } from "constant";

require("./index.scss");

export default function MethodLabel(props) {
  const { method, className, active } = props;
  const labelClass = classnames(
    "MethodLabel text-white leading-none transition-35 grey-lighter-bg",
    className,
    methodToClassName[method],
    { active }
  );
  return (
    <span className={labelClass}>
      {method}
    </span>
  );
}

MethodLabel.propTypes = {
  method: PropTypes.string.isRequired,
  active: PropTypes.bool,
  className: PropTypes.string
};
