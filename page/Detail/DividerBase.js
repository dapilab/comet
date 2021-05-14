import { Component } from "react";

// import localStorage from "libs/localStorage";

export default class DividerBase extends Component {
  constructor(props) {
    super(props);
    this.leftPartClass = "endpointDetailLeft";
    this.leftPartWidthKey = "__api_left_width_key__";
    this.leftDefaultFlex = "0 0 500px";
    this.draggerDefaultFlex = "0 0 3vw";

    this.leftPartStyle = { flex: "0 0 41%", maxWidth: "550px", marginRight: "6%" };
    this.rightPartStyle = { flex: "0 0 50%", maxWidth: "700px" };
  }

  componentDidMount() {
    // const endpointParamWidthFromStorage = localStorage.get(this.leftPartWidthKey);
    // if (endpointParamWidthFromStorage) {
    //   this.setEndpointParamWidth(endpointParamWidthFromStorage);
    // }
  }

  handleWidthDrag(e, data) {
    const { deltaX } = data;
    const width = document.querySelectorAll(`.${this.leftPartClass}`)[0].clientWidth;
    this.setEndpointParamWidth(width + deltaX);
  }

  setEndpointParamWidth(width) {
    document.querySelectorAll(`.${this.leftPartClass}`).forEach((item) => {
      item.style.flex = `0 0 ${width}px`;
    });
    // localStorage.set(this.leftPartWidthKey, width);
  }
}
