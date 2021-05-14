import React from "react";
import PropTypes from "prop-types";

require("./index.scss");

const Loader = (props) => {
  const { className } = props;
  return <div className={`Loader ${className}`} />;
};

Loader.propTypes = {
  className: PropTypes.string
};

Loader.defaultProps = {
  className: ""
};

export default Loader;
