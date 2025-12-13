import { JSX } from "react";

export interface FormProps {
  elements: JSX.Element[];
  url: string;
  target: string;
  swap?: string;
}

export const Form = ({
  elements,
  url,
  target,
  swap = 'innerHTML'
}: FormProps) => {
  return (
    <div>
      <form
        hx-post={url}
        hx-target={target}
        hx-swap={swap}>
        
        <div className="mb-3">
          {elements.map((element) => element)}
        </div>
        
        <button className="bg-amber-400 px-3 py-1 w-full rounded-full cursor-pointer select-none" type="submit">
          Enviar
        </button>
      </form>
    </div>
  );
};