import { endpointStore, componentStore } from "stores";

export const getListTagId = (tagId) => `list-tag-${tagId}`;
export const getListEndpointId = (endpointId) => `list-endpoint-${endpointId}`;
export const getEndpointBlockId = (endpointId) => `endpoint-block-${endpointId}`;
export const getListComponentId = (componentId) => `list-component-${componentId}`;
export const getComponentBlockId = (componentId) => `component-block-${componentId}`;

// Reset active state of left menu
export const resetListItemActiveState = () => {
  document.querySelectorAll(".ProjectAPIList .endpointItem").forEach((item) => {
    item.classList.remove("active");
  });
  document.querySelectorAll(".ProjectAPIList .componentItem").forEach((item) => {
    item.classList.remove("active");
  });
};

// Activate the endpoint item in the left menu
let maxIntersectionRatio = 0;
export const activeEndpointItem = (endpointId, initIntersectionRatio) => {
  // Only for initial trigger
  if (initIntersectionRatio) {
    if (initIntersectionRatio <= maxIntersectionRatio) return;
    maxIntersectionRatio = initIntersectionRatio;
  }

  resetListItemActiveState();
  const listEndpointId = getListEndpointId(endpointId);
  const listEndpointElem = document.getElementById(listEndpointId);
  if (listEndpointElem) listEndpointElem.classList.add("active");
};

// Activate the component item in the left menu
export const activeComponentItem = (componentId) => {
  resetListItemActiveState();
  const listCompondentId = getListComponentId(componentId);
  document.getElementById(listCompondentId).classList.add("active");
};

export const jumpToEndpoint = (endpointId) => {
  const endpointBlockId = getEndpointBlockId(endpointId);
  endpointStore.jumpToPointed();
  document.getElementById(endpointBlockId).scrollIntoView({
    behavior: "smooth"
  });
  activeEndpointItem(endpointId);
};

export const jumpToComponent = (componentId) => {
  const componentBlockId = getComponentBlockId(componentId);
  componentStore.jumpToPointed();
  document.getElementById(componentBlockId).scrollIntoView({
    behavior: "smooth"
  });
  activeComponentItem(componentId);
};

export const endpointToOpenAPIFormat = (endpoint, tagData) => {
  const tag = endpoint.tagId && tagData[endpoint.tagId];
  const url = endpoint.url || "url...";
  const returnJSON = {
    [url]: {
      [endpoint.method]: {
        summary: endpoint.name || null,
        description: endpoint.description,
        tags: tag && [tag.name] || null,
        parameters: endpoint.parameters || null,
        requestBody: endpoint.requestBody || null,
        responses: endpoint.responses || null
      }
    }
  };

  // Remove null fileds, except 'description'
  Object.keys(returnJSON[url][endpoint.method]).forEach((key) => {
    if (key !== "description" && !returnJSON[url][endpoint.method][key]) {
      delete returnJSON[url][endpoint.method][key];
    }
  });

  return returnJSON;
};
