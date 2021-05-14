import PropTypes from "prop-types";

export default PropTypes.shape({
  url: PropTypes.string,
  method: PropTypes.string,
  summary: PropTypes.string,
  description: PropTypes.string,
  tagId: PropTypes.string,
  parameters: PropTypes.array,
  requestBody: PropTypes.object,
  responses: PropTypes.object
});
