import { RadioGroup } from '@headlessui/react';
import React, { useCallback, useState } from 'react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Field: React.VFC<{
  text: string;
  id: string;
  size: 'narrow' | 'wide';
  defaultValue?: string;
}> = ({ text, id, size, defaultValue }) => (
  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
    >
      {text}
    </label>
    <div className="mt-1 sm:mt-0 sm:col-span-2">
      <input
        type="text"
        name={id}
        id={id}
        autoComplete="given-name"
        defaultValue={defaultValue}
        className={`max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
          size === 'narrow' ? 'sm:max-w-xs' : ''
        } sm:text-sm border-gray-300 rounded-md py-2 px-3 border`}
      />
    </div>
  </div>
);

const TextArea: React.VFC<{
  text: string;
  id: string;
  note?: string;
  defaultValue?: string;
}> = ({ text, id, note, defaultValue }) => (
  <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
    >
      {text}
    </label>
    <div className="mt-1 sm:mt-0 sm:col-span-2">
      <textarea
        id={id}
        name={id}
        rows={3}
        className="max-w-lg shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border border-gray-300 rounded-md"
        defaultValue={defaultValue}
      />
      {!!note && <p className="mt-2 text-sm text-gray-500">{note}</p>}
    </div>
  </div>
);

const durationOptions = [
  { name: '5 min', value: 5 },
  { name: '15 min', value: 15 },
  { name: '30 min', value: 30 },
  { name: '1 hr', value: 60 },
];

const groupSizeOptions = [
  { name: 'Just me', value: 1 },
  { name: '2 of us', value: 2 },
  { name: '5(ish)', value: 5 },
];

const RadioButtons: React.VFC<{
  text: string;
  id: string;
  options: { name: string; value: string | number }[];
  defaultValue?: number;
  defaultIndex?: number;
}> = ({ text, id, options, defaultValue, defaultIndex = 1 }) => {
  const [value, setValue] = useState(
    options.find((opt) => opt.value === defaultValue) || options[defaultIndex],
  );

  return (
    <RadioGroup
      value={value}
      onChange={setValue}
      className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5"
    >
      <RadioGroup.Label className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
        {text}
      </RadioGroup.Label>
      <div className="mt-1 sm:mt-0 sm:col-span-2">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 max-w-lg">
          {options.map((option) => (
            <RadioGroup.Option
              key={option.name}
              value={option}
              className={({ active, checked }) =>
                classNames(
                  'cursor-pointer focus:outline-none',
                  active ? 'ring-2 ring-offset-2 ring-indigo-500' : '',
                  checked
                    ? 'bg-indigo-600 border-transparent text-white hover:bg-indigo-700'
                    : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50',
                  'border rounded-md py-3 px-3 flex items-center justify-center text-sm font-medium uppercase sm:flex-1',
                )
              }
            >
              <RadioGroup.Label as="p">{option.name}</RadioGroup.Label>
            </RadioGroup.Option>
          ))}
        </div>
      </div>
      <input type="hidden" id={id} name={id} value={value.value} />
    </RadioGroup>
  );
};

export type TaskFormSubmitHandler = (formData: {
  value: Task;
  diffs: Partial<Task>;
}) => void;

export type Task = {
  name: string;
  description?: string;
  durationMinutes: number;
  groupSize: number;
};

export interface TaskFormPropTypes {
  onSubmit: TaskFormSubmitHandler;
  onCancel: React.MouseEventHandler<HTMLButtonElement>;
  onDelete?: React.MouseEventHandler<HTMLButtonElement>;
  value?: Task;
}

export const TaskForm: React.VFC<TaskFormPropTypes> = ({
  onSubmit,
  onCancel,
  onDelete,
  value,
}) => {
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const data: Task = {
        name: String(formData.get('name')),
        description: String(formData.get('description')),
        durationMinutes: Number(formData.get('durationMinutes')),
        groupSize: Number(formData.get('groupSize')),
      };

      const diffs: Partial<Task> = {};

      Object.keys(data).forEach((key) => {
        if (!value || data[key] !== value[key]) {
          diffs[key] = data[key];
        }
      });

      onSubmit({ value: data, diffs });

      e.preventDefault();
      return false;
    },
    [onSubmit, value],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 divide-y divide-gray-200"
    >
      <div className="space-y-8 divide-y divide-gray-200 sm:space-y-5">
        <div>
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Basic info
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Tell us a bit about what you need to get done.
            </p>
          </div>

          <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
            <Field
              text="Name"
              id="name"
              size="narrow"
              defaultValue={value?.name}
            />
            <TextArea
              text="Description"
              id="description"
              note="Optional information about the task"
              defaultValue={
                value?.description === null ? '' : value?.description || ''
              }
            />
          </div>
        </div>
      </div>

      <div className="pt-5 space-y-8 divide-y divide-gray-200 sm:space-y-5">
        <div>
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              More options
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              This information is used to prioritize tasks and find friends who
              are ready to help out. You can always change it later.
            </p>
          </div>

          <div className="mt-6 sm:mt-5 space-y-6 sm:space-y-5">
            <RadioButtons
              text="Estimated duration"
              id="durationMinutes"
              options={durationOptions}
              defaultValue={value?.durationMinutes}
            />
            <RadioButtons
              text="Group size"
              id="groupSize"
              options={groupSizeOptions}
              defaultValue={value?.groupSize}
            />
          </div>
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>

          {!!onDelete && (
            <button
              onClick={onDelete}
              type="button"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Delete
            </button>
          )}

          <button
            type="submit"
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
};
