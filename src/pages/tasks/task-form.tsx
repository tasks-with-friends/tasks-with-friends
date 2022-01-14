import { Listbox, RadioGroup, Transition } from '@headlessui/react';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ConfirmationModal } from '../confirmation-modal';
import { CheckIcon, SelectorIcon } from '@heroicons/react/solid';
import { gql, useQuery } from '@apollo/client';
import {
  GetFriendPickerQuery,
  GetFriendPickerQuery_friends_nodes as Friend,
} from './__generated__/GetFriendPickerQuery';
import { useProfile } from '../../profile-provider';
import { Avatar } from '../../components/avatar';
import { UserStatus } from '../../../__generated__/globalTypes';

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
  diffs: TaskDiff;
}) => void;

export type Task = {
  name: string;
  description?: string;
  durationMinutes: number;
  groupSize: number;
  participants: Participant[];
};

export type TaskDiff = Partial<
  Omit<Task, 'participants'> & {
    addUserIds: string[];
    removeUserIds: string[];
  }
>;

export type Participant = {
  participantId?: string;
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  avatarUrl?: string;
};

export interface TaskFormPropTypes {
  onSubmit: TaskFormSubmitHandler;
  onCancel: () => void;
  onDelete?: () => void;
  value?: Task;
}

export const TaskForm: React.VFC<TaskFormPropTypes> = ({
  onSubmit,
  onCancel,
  onDelete,
  value,
}) => {
  const [participants, setParticipants] = useState(value?.participants || []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const data: Task = {
        name: String(formData.get('name')),
        description: String(formData.get('description')),
        durationMinutes: Number(formData.get('durationMinutes')),
        groupSize: Number(formData.get('groupSize')),
        participants,
      };

      const diffs: TaskDiff = {};

      Object.keys(data).forEach((key) => {
        if (key === 'participants') return;
        if (!value || data[key] !== value[key]) {
          diffs[key] = data[key];
        }
      });
      const addUserIds = participants
        .filter(
          (currentPartcipant) =>
            !value?.participants?.find(
              (originalParticipant) =>
                currentPartcipant.id === originalParticipant.id,
            ),
        )
        .map((x) => x.id);

      const removeUserIds = value?.participants
        ?.filter(
          (originalParticipant) =>
            !participants.find(
              (currentPartcipant) =>
                currentPartcipant.id === originalParticipant.id,
            ),
        )
        ?.map((x) => x.id);

      if (addUserIds.length) diffs.addUserIds = addUserIds;
      if (removeUserIds?.length) diffs.removeUserIds = removeUserIds;

      onSubmit({ value: data, diffs });

      e.preventDefault();
      return false;
    },
    [onSubmit, value, participants],
  );

  const handleClickDelete = useCallback(() => {
    setIsOpen(true);
  }, []);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setParticipants(value?.participants || []);
  }, [value?.participants]);

  const handleRemovePartcipant = useCallback(
    (userId: string) => {
      setParticipants(participants.filter((p) => p.id !== userId));
    },
    [participants],
  );

  const handleAddParticipant = useCallback(
    (paricipant: Participant) => {
      setParticipants([...participants, paricipant]);
    },
    [participants],
  );

  const profile = useProfile();

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
        <ul>
          {participants.map((person) => (
            <li className="py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <Avatar
                    key={person.id}
                    size="sm"
                    name={person.name}
                    avatarUrl={person.avatarUrl || undefined}
                    status={person.status}
                  />
                  {/* <img
                    className="h-8 w-8 rounded-full"
                    src={person.avatarUrl || ''}
                    alt=""
                  /> */}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {person.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {person.email}
                  </p>
                </div>
                {profile.id !== person.id && (
                  <div>
                    <button
                      type="button"
                      onClick={() => handleRemovePartcipant(person.id)}
                      className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        <UserPicker skip={participants} onSelect={handleAddParticipant} />
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
              onClick={handleClickDelete}
              type="button"
              className="ml-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
      {!!onDelete && (
        <ConfirmationModal
          title="Delete task"
          primaryButtonText="Delete task"
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          onConfirm={onDelete}
        >
          Are you sure you want to delete this task? It will be permanently
          removed. This action cannot be undone.
        </ConfirmationModal>
      )}
    </form>
  );
};

const GET_FRIEND_PICKER = gql`
  query GetFriendPickerQuery {
    friends {
      nodes {
        id
        name
        email
        avatarUrl
        status
      }
    }
  }
`;

export const UserPicker: React.VFC<{
  onSelect: (participant: Participant) => void;
  skip?: { id: string }[];
}> = ({ skip, onSelect }) => {
  const { data, loading, error } =
    useQuery<GetFriendPickerQuery>(GET_FRIEND_PICKER);

  const friends: Friend[] = useMemo(
    () =>
      (data?.friends?.nodes || []).filter(
        (friend) => !skip?.find?.((x) => x.id === friend.id),
      ),
    [data?.friends?.nodes, skip],
  );

  const [selected, setSelected] = useState<Friend | undefined>(undefined);

  const handleChange = useCallback(
    (friend: Friend) => {
      // setSelected(friend);
      onSelect({
        id: friend.id,
        name: friend.name,
        email: friend.email,
        status: friend.status,
        avatarUrl: friend.avatarUrl || undefined,
      });
    },
    [onSelect],
  );

  return (
    <Listbox value={selected} onChange={handleChange}>
      {({ open }) => (
        <>
          <Listbox.Label className="block text-sm font-medium text-gray-700">
            Assigned to
          </Listbox.Label>
          <div className="mt-1 relative">
            <Listbox.Button className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <span className="flex items-center">
                {selected ? (
                  <>
                    <Avatar
                      key={selected.id}
                      size="xs"
                      name={selected.name}
                      avatarUrl={selected.avatarUrl || undefined}
                      status={selected.status}
                    />
                    {/* <img
                      src={selected.avatarUrl || ''}
                      alt=""
                      className="flex-shrink-0 h-6 w-6 rounded-full"
                    /> */}
                    <span className="ml-3 block truncate">{selected.name}</span>
                  </>
                ) : (
                  <span className="ml-3 block truncate">Select a friend</span>
                )}
              </span>
              <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <SelectorIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {friends.map((person) => (
                  <Listbox.Option
                    key={person.id}
                    className={({ active }) =>
                      classNames(
                        active ? 'text-white bg-indigo-600' : 'text-gray-900',
                        'cursor-default select-none relative py-2 pl-3 pr-9',
                      )
                    }
                    value={person}
                  >
                    {({ selected: isSelected, active }) => (
                      <>
                        <div className="flex items-center">
                          <Avatar
                            key={person.id}
                            size="xs"
                            name={person.name}
                            avatarUrl={person.avatarUrl || undefined}
                            status={person.status}
                          />
                          {/* <img
                            src={person.avatarUrl || ''}
                            alt=""
                            className="flex-shrink-0 h-6 w-6 rounded-full"
                          /> */}
                          <span
                            className={classNames(
                              isSelected ? 'font-semibold' : 'font-normal',
                              'ml-3 block truncate',
                            )}
                          >
                            {person.name}
                          </span>
                        </div>

                        {isSelected ? (
                          <span
                            className={classNames(
                              active ? 'text-white' : 'text-indigo-600',
                              'absolute inset-y-0 right-0 flex items-center pr-4',
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
};
