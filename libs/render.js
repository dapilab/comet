import React, { Fragment, Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import cloneDeep from "lodash.clonedeep";
import ReactToolTip from "react-tooltip";
import qs from "qs";
import { v4 as uuidv4 } from "uuid";

import { componentStore } from "stores";

require("./render.scss");

/**
 * Common used
 */
const insertSeperatorBetweenElement = (elements, seperator = ", ") => elements
  .reduce((acc, cur, idx) => {
    acc.push(<Fragment key={idx * 2}>{cur}</Fragment>);
    acc.push(<span key={idx * 2 + 1}>{seperator}</span>);
    return acc;
  }, [])
  .slice(0, -1);

const genValueElement = (value, type, { withColor = true, withQuatation = true } = {}) => {
  switch (type) {
    case "string": {
      if (Array.isArray(value)) {
        value = value
          .map((v) => {
            if (withQuatation) return `"${v}"`;
            return v;
          })
          .join(", ");
      } else if (withQuatation) value = `"${value}"`;
      break;
    }
    case "boolean": {
      value = String(value);
      break;
    }
  }
  return (
    <span
      className={classnames("break-all", { [`type-${type}`]: withColor })}>
      {value}
    </span>
  );
};

const genDescription = (schema) => {
  const hiddenAttrs = [
    "required",
    "type",
    "properties",
    "items",
    "$ref",
    "not",
    "allOf",
    "oneOf",
    "anyOf",
    "isHidden"
  ];
  const genValueElementWithFormat = (value, type) => genValueElement(value, type, { withColor: false, withQuatation: false });
  const descElements = Object.keys(schema)
    .filter((key) => !hiddenAttrs.includes(key) && Object.prototype.toString.call(schema[key]) !== "[object Object]")
    .map((key, idx) => {
      switch (key) {
        case "enum": {
          let enumValues = schema.enum.map((item) => genValueElementWithFormat(item, schema.type));
          enumValues = insertSeperatorBetweenElement(enumValues);
          return (
            <span key={idx}>Accepted values [{enumValues}]</span>
          );
        }
        case "description": {
          return <span key={idx}>{schema.description}</span>;
        }
        case "minimum":
        case "maximum": {
          if (schema.minimum != null && schema.maximum != null) {
            if (key === "minimum") return;
            return (
              <span key={idx}>
                The value should between {genValueElementWithFormat(`[${schema.minimum}, ${schema.maximum}]`, "number")}
              </span>
            );
          }
          const display = key === "minimum" && "Min" || "Max";
          return (
            <span key={idx}>
              {display} as {genValueElementWithFormat(schema[key], schema.type)}
            </span>
          );
        }
        default: {
          const isBool = typeof schema[key] === "boolean";
          const value = schema[key];
          if (isBool && key !== "default") {
            const myValue = value && key || `Not ${key}`;
            return (
              <span key={idx}>
                It is {genValueElementWithFormat(myValue, "boolean")}
              </span>
            );
          }
          return (
            <span key={idx}>
              The {key} is {genValueElementWithFormat(schema[key], schema.type)}
            </span>
          );
        }
      }
    })
    .filter((item) => item !== undefined);

  return insertSeperatorBetweenElement(descElements, ". ");
};

export const convertComponentToSchema = (component, hide = []) => {
  const componentProperty = cloneDeep(component.property);
  if (componentProperty.properties) {
    hide.forEach((attr) => {
      delete componentProperty.properties[attr];
    });
  }

  if (!componentProperty.hide) return componentProperty;
  if (componentProperty.properties) {
    componentProperty.hide.forEach((attr) => {
      delete componentProperty.properties[attr];
    });
  }
  return componentProperty;
};

const getSchemaByRef = (ref, hide = []) => {
  const componentId = componentStore.findByName(ref);
  if (!componentId) return;

  const component = componentStore.data[componentId];
  if (!component) return;
  return convertComponentToSchema(component, hide);
};

const translateFromAllOf = (schema) => {
  if (!schema.allOf) return;
  schema = cloneDeep(schema);
  const propertiesArray = [];

  schema.allOf.forEach((item, idx) => {
    if (item.$ref) {
      item = getSchemaByRef(item.$ref, item.hide);
      if (!item) return;
      schema.allOf[idx] = item;
    }
    if (item && item.properties) propertiesArray.push(item.properties);
  });

  const appendData = {
    properties: Object.assign({}, ...propertiesArray)
  };
  if (schema.required) appendData.required = schema.required;
  if (schema.hide) appendData.hide = schema.hide;
  return Object.assign(...[{}].concat(schema.allOf).concat([appendData]));
};

/**
 *  Model render
 */
const renderModelProperties = (properties, prefixName, { onClickHideIcon = null } = {}) => {
  if (!properties) return;
  return Object
    .keys(properties)
    .map((attrName, idx) => {
      const elem = renderModelAttribute(attrName, properties[attrName], { prefixName, onClickHideIcon });
      return (
        <Fragment key={idx}>
          {elem}
        </Fragment>
      );
    });
};

const renderModelItems = (items) => renderModelAttribute("item", items, {});

export const renderModelAttribute = (
  name,
  schema = {},
  {
    alwaysShowCurrent = false,
    greyOutForHidden = false,
    onClickHideIcon = null
  }
) => {
  schema = cloneDeep(schema);

  if (schema.$ref) {
    schema = getSchemaByRef(schema.$ref, schema.hide);
    if (!schema) return;
    return renderModelAttribute(name, schema, {});
  }

  if (schema.allOf && Array.isArray(schema.allOf)) {
    schema = translateFromAllOf(schema);
  }

  const { type, required } = schema;
  const descriptionElem = genDescription(schema);
  const currentElement = (
    <div
      className={classnames("ModelRender py-2 attributeBorderBottom", {
        isHidden: schema.isHidden
      })}>
      {/* Name */}
      <div className="flex items-center mb-1 nameWrapper">
        {name &&
          <p className="mr-1 text-sm leading-none attributeName grey-dark font-mont">
            {name}
          </p>
        }
        <p className="grey-light text-sm leading-none">
          <span>{type}</span>
          {type === "array" && schema.items && schema.items.type &&
            <span>[{schema.items.type}]</span>
          }
        </p>
        {required === true &&
          <p className="grey-light text-sm leading-none">
            <span className="inline-block mr-1">,</span>
            <span>required</span>
          </p>
        }
      </div>

      {/* Description */}
      <p className="text-xs grey mt-1">{descriptionElem}</p>

      {name &&
        <div
          className="flex items-center justify-end pl-5 hover:text-gray-500 cursor-pointer"
          onClick={onClickHideIcon && onClickHideIcon.bind(null, name) || function () {}}>
          <i className={classnames("iconfont attrHideIcon", {
            iconbrowse: !schema.isHidden,
            "iconhide grey-lighter": schema.isHidden
          })} />
        </div>
      }
    </div>
  );

  let extraElement;
  // Render extra attributes for object and array
  if (type) {
    switch (type) {
      case "object": {
        if (schema.required && Array.isArray(schema.required)) {
          schema.required.forEach((key) => {
            schema.properties[key].required = true;
          });
        }
        if (schema.hide && Array.isArray(schema.hide)) {
          schema.hide.forEach((key) => {
            if (greyOutForHidden) {
              schema.properties[key].isHidden = true;
            } else {
              delete schema.properties[key];
            }
          });
        }

        extraElement = renderModelProperties(schema.properties, name, { onClickHideIcon });
        break;
      }
      case "array": {
        extraElement = renderModelItems(schema.items, name);
        break;
      }
    }
  }

  // Render extra attributes for oneOf, anyOf
  if (schema.oneOf || schema.anyOf) {
    const itemsSchema = schema.oneOf || schema.anyOf;
    const itemsElements = itemsSchema.map((itemSchema, idx) => {
      if (itemSchema.$ref) {
        itemSchema = getSchemaByRef(itemSchema.$ref, itemSchema.hide);
        if (!itemSchema) return;
      }
      const attributeElem = renderModelAttribute("", itemSchema, { alwaysShowCurrent: true });
      return (
        <div className="relative" key={idx}>
          <label className="absolute left-0 -ml-5 py-2 orange leading-none">{idx + 1}.</label>
          {attributeElem}
        </div>
      );
    });
    extraElement = (
      <Fragment>
        <p className="pt-1 orange">{schema.oneOf && "One Of" || "Any Of"}</p>
        {itemsElements}
      </Fragment>
    );
  }

  return (
    <Fragment>
      {(alwaysShowCurrent || name) && currentElement}
      {extraElement &&
        <div className={classnames({
          "pl-6": alwaysShowCurrent || name,
          showHideIconWhenHover: greyOutForHidden
        })}>
          {extraElement}
        </div>
      }
    </Fragment>
  );
};

/**
 *  Example render
 */
export const renderExampleSchema = (schema) => {
  switch (schema.type) {
    case "object": {
      const properties = renderExampleProperties(schema.properties, schema.required, schema.hide);
      return (
        <div className="leading-relaxed py-2">
          <p className="exampleKey">{"{"}</p>
          <div className="pl-4">{properties}</div>
          <p className="exampleKey">{"}"}</p>
        </div>
      );
    }

    case "array": {
      const itemElement = renderExampleAttribute("", schema.items);
      return (
        <div className="leading-relaxed py-2">
          <p className="exampleKey">[</p>
          <div className="pl-4">{itemElement}</div>
          <p className="exampleKey">]</p>
        </div>
      );
    }

    default: {
      return (
        <div className="leading-relaxed py-2">
          {renderExampleAttribute("", schema)}
        </div>
      );
    }
  }
};

const renderExampleAttribute = (key, value, required = false) => {
  value = cloneDeep(value);
  if (value.$ref) {
    value = getSchemaByRef(value.$ref, value.hide);
    if (!value) return;
  }

  if (value.oneOf || value.anyOf) {
    return (
      <OfItem
        attrKey={key}
        attrItems={value.oneOf || value.anyOf} />
    );
  }
  if (value.allOf && Array.isArray(value.allOf)) {
    value = translateFromAllOf(value);
  }

  switch (value.type) {
    case "object": {
      const properties = renderExampleProperties(value.properties, value.required, value.hide);
      return (
        <Fragment>
          <p className="flex">
            {key && <span className="exampleKey">{key}</span>}
            {key && required && <span className="blue-purple font-bold">*</span>}
            {key && <span className="inline-block mr-1 exampleKey">:</span>}
            <span>{"{"}</span>
          </p>
          <div className="pl-4">{properties}</div>
          <p>{"}"}</p>
        </Fragment>
      );
    }
    case "array": {
      const items = renderExampleAttribute(null, value.items);
      return (
        <Fragment>
          <p className="flex">
            {key && <span className="exampleKey">{key}</span>}
            {key && required && <span className="blue-purple font-bold">*</span>}
            {key && <span className="inline-block mr-1 exampleKey">:</span>}
            <span>[</span>
          </p>
          <div className="pl-4">{items}</div>
          <p>]</p>
        </Fragment>
      );
    }
    default: {
      return (
        <div className="flex">
          {key && <span className="exampleKey">{key}</span>}
          {key && required && <span className="blue-purple font-bold">*</span>}
          {key && <span className="inline-block mr-1 exampleKey">:</span>}
          {
            genValueElement(
              value.default || value.example || value.type || (value.enum && value.enum[0]),
              value.type,
              { withColor: false }
            )
          }
        </div>
      );
    }
  }
};

const renderExampleProperties = (properties, required = [], hide = []) => {
  if (!properties) return;
  const requiredSet = new Set(required);
  const hideSet = new Set(hide);
  const centerContent = Object.entries(properties)
    .filter(([key]) => !hideSet.has(key))
    .map(([key, value], idx) => {
      const required = requiredSet.has(key);
      const attributeElem = renderExampleAttribute(key, value, required);
      return (
        <Fragment key={idx}>{attributeElem}</Fragment>
      );
    });
  return centerContent;
};

class OfItem extends Component {
  static propTypes = {
    attrKey: PropTypes.string,
    attrItems: PropTypes.array
  }

  constructor(props) {
    super(props);
    this.state = {
      currentIdx: 0
    };
  }

  nextExample() {
    const { attrItems } = this.props;
    const { currentIdx } = this.state;
    const nextIdx = currentIdx === attrItems.length - 1 ? 0 : currentIdx + 1;
    this.setState({
      currentIdx: nextIdx
    });
  }

  render() {
    const { attrKey, attrItems } = this.props;
    const { currentIdx } = this.state;
    const item = attrItems[currentIdx];
    const id = uuidv4();
    return (
      <Fragment>
        <div
          className="cursor-pointer transition-35 hover:blue-purple"
          onClick={::this.nextExample}
          data-for={id}
          data-tip="Click to check other examples">
          {renderExampleAttribute(attrKey, item)}
        </div>
        <ReactToolTip
          id={id}
          type="light"
          place="left"
          effect="solid"
          className="text-sm" />
      </Fragment>
    );
  }
}

/**
 * Curl render
 */
const schemaToJS = (schema) => {
  if (!schema) return;
  schema = cloneDeep(schema);
  if (schema.$ref) return schemaToJS(getSchemaByRef(schema.$ref, schema.hide));
  if (schema.oneOf) return schemaToJS(schema.oneOf[0]);
  if (schema.allOf && Array.isArray(schema.allOf)) {
    schema = translateFromAllOf(schema);
  }

  switch (schema.type) {
    case "object":
      if (!schema.properties) return {};
      if (schema.hide) {
        schema.hide.forEach((item) => {
          delete schema.properties[item];
        });
      }
      return Object.keys(schema.properties).reduce((acc, curr) => {
        acc[curr] = schemaToJS(schema.properties[curr]);
        return acc;
      }, {});
    case "array":
      if (!schema.items) return [];
      return schemaToJS(schema.items);
    default:
      return schema.default || schema.type || "";
  }
};

export const toCurl = (endpoint, { host } = {}) => {
  host = host || "";
  const { parameters, requestBody, method } = endpoint;
  let { url } = endpoint;

  if (!url) return;

  let curlHeader = "";
  if (parameters) {
    parameters.filter((param) => param.in === "header").forEach((param) => {
      const key = param.name;
      const value = param.example || param.schema.default || param.schema.example || param.schema.type;
      curlHeader += `-H "${key}: ${value}" `;
    });

    parameters.filter((param) => param.in === "path").forEach((param) => {
      if (param.schema && param.schema.default) {
        const pathRegexp = new RegExp(`{${param.name}}`);
        url.replace(pathRegexp, param.schema.default);
      }
    });

    let curlQuery = parameters.filter((param) => param.in === "query").reduce((acc, curr) => {
      acc[curr.name] = schemaToJS(curr.schema);
      return acc;
    }, {});
    curlQuery = qs.stringify(curlQuery, { encode: false });
    if (curlQuery) url += `\?${curlQuery}`;
  }

  const curlMethod = method !== "get"
    ? ` -X ${method.toUpperCase()}`
    : "";

  let curlRequest = "";
  if (requestBody && requestBody.content) {
    const requestSchemaName = Object.keys(requestBody.content)[0];
    switch (requestSchemaName) {
      case "application/json": {
        // Check if content-type exist in the header
        const contentTypeRegExp = new RegExp("content-type:\s*application/json", "i");
        if (!contentTypeRegExp.test(curlHeader)) {
          curlHeader += "-H \"Content-Type: application/json\" ";
        }

        curlRequest = schemaToJS(requestBody.content[requestSchemaName].schema);
        curlRequest = `-d '${JSON.stringify(curlRequest)}' `;
        break;
      }

      case "multipart/form-data": {
        if (requestBody.content[requestSchemaName].schema && requestBody.content[requestSchemaName].schema.properties) {
          Object.keys(requestBody.content[requestSchemaName].schema.properties).forEach((key) => {
            const valueSchema = requestBody.content[requestSchemaName].schema.properties[key];
            const value = valueSchema.default || valueSchema.example || valueSchema.type;
            curlRequest += `-F ${key}=${value} `;
          });
          curlRequest += "-F upload=@pathToYourFile ";
        }
        break;
      }

      default:
        return;
    }
  }

  return `curl${curlMethod} ${curlHeader}${curlRequest}${host}${url}`;
};
