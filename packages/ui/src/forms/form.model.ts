import { JSX } from "react";

export interface FormModel<VALUE = any> {
  value?: VALUE;
  isDisabled?: boolean;
  isRequired?: boolean;
  errors?: Record<string, string>[];
}

export interface FormPros {
  name: string;
  label?: string;
  attributes?: Record<string, any>;
  model?: FormModel;
}

export interface FormConfig {
  props?: FormPros;
  element: JSX.Element;
}