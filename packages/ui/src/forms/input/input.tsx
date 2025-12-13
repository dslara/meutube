export const Input = <MODEL = any>(type = 'text', model: MODEL) => {
  return (
    <input
      type={type}
      x-model={model} />
  );
}