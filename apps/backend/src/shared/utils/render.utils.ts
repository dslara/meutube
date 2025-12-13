import { FunctionComponent, createElement } from "react";
import { renderToString } from "react-dom/server";

export const renderComponent = <DATA extends {}>(element: FunctionComponent<DATA>, data: DATA) => {
  return renderToString(createElement(element, data));
}

export const renderPage = <DATA extends {}>(element: FunctionComponent<DATA>, data: DATA) => {
  return `<!DOCTYPE html>${renderComponent(element, data)}`;
}