import { FormPros } from '../form.model';

export const Checkbox = ({
  name,
  label,
  attributes = {},
  model = {},
}: FormPros) => {
  return (
    <label
      className="inline-flex items-center px-3 py-1 rounded-full border cursor-pointer select-none"
      x-data="{isChecked: false}"
      x-bind:class="isChecked ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white text-gray-700'"
    >
      <input
        type="checkbox"
        name={name}
        value={model.value}
        disabled={model.isDisabled}
        required={model.isRequired}
        className="select-none sr-only"
        x-model="isChecked"
        { ...attributes }
      />
      {label}
    </label>
  );
};
