import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, gql, useMutation } from '@apollo/client';
import { ChevronRightIcon, PlusIcon } from '@heroicons/react/solid';
import { Link } from 'react-router-dom';

import { Page } from '../../templates/page';
import {
  GetTasksQuery,
  GetTasksQuery_tasks_nodes,
} from './__generated__/GetTasksQuery';
import { Dialog, Transition } from '@headlessui/react';
import { useProfile } from '../../profile-provider';
import { ParticipantResponse } from '../../../__generated__/globalTypes';
import {
  ClearResponseMutation,
  ClearResponseMutationVariables,
} from './__generated__/ClearResponseMutation';
import {
  SetResponseMutation,
  SetResponseMutationVariables,
} from './__generated__/SetResponseMutation';

export const GET_TASKS = gql`
  query GetTasksQuery {
    tasks(filter: ALL) {
      nodes {
        id
        name
        description
        status
        durationMinutes
        groupSize
        owner {
          id
          name
          avatarUrl
        }
        participants(first: 100) {
          nodes {
            id
            response
            user {
              id
              name
              avatarUrl
            }
          }
        }
      }
    }
  }
`;

const SET_RESPONSE = gql`
  mutation SetResponseMutation($input: SetResponseInput!) {
    setResponse(input: $input) {
      participant {
        id
        response
      }
    }
  }
`;

const CLEAR_RESPONSE = gql`
  mutation ClearResponseMutation($input: ClearResponseInput!) {
    clearResponse(input: $input) {
      participant {
        id
        response
      }
    }
  }
`;

const CreateTaskButton: React.VFC<{ className?: string }> = ({ className }) => (
  <Link
    to="/tasks/new"
    className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
      !!className ? className : ''
    }`}
  >
    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
    New Task
  </Link>
);

const TaskItem: React.VFC<{ task: GetTasksQuery_tasks_nodes }> = ({ task }) => {
  const { TaskModal, open } = useTaskModal();

  const profile = useProfile();

  const me = useMemo(
    () => task.participants.nodes.find((p) => p.user.id === profile.id),
    [profile.id, task.participants.nodes],
  );

  return (
    <>
      <li key={task.id}>
        <a onClick={open} className="cursor-pointer block hover:bg-gray-50">
          <div className="px-4 py-4 flex items-center sm:px-6">
            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="truncate">
                <div className="flex text-sm">
                  <p className="font-medium text-indigo-600 truncate">
                    {task.name}
                    {!!me?.response && (
                      <span
                        className={`uppercase ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  ${
                          me.response === ParticipantResponse.YES
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {me.response}
                      </span>
                    )}
                  </p>
                  <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                    {task.groupSize === 1
                      ? 'Just me'
                      : `${task.groupSize} of us`}{' '}
                    for {task.durationMinutes}m
                  </p>
                </div>
                <div className="mt-2 flex">
                  <div className="flex items-center text-sm text-gray-500">
                    <p>{task.description}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                <div className="flex overflow-hidden -space-x-1">
                  {task.participants.nodes.map((node) => (
                    <img
                      key={node.user.id}
                      className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
                      src={node.user.avatarUrl || ''}
                      alt={node.user.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="ml-5 flex-shrink-0">
              <ChevronRightIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
          </div>
        </a>
      </li>
      <TaskModal task={task} />
    </>
  );
};

const TasksGuts: React.VFC = () => {
  const { loading, error, data } = useQuery<GetTasksQuery>(GET_TASKS);

  if (loading) return <>Loading...</>;
  if (error) return <>Error loading.</>;

  if (!data?.tasks?.nodes?.length) {
    return (
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 mt-12 md:mt-24 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new task.
        </p>
        <div className="mt-6">
          <CreateTaskButton />
        </div>
      </div>
    );
  }

  return (
    <>
      <CreateTaskButton className="mb-4" />
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {data?.tasks?.nodes.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      </div>
    </>
  );
};

export const Tasks: React.VFC = () => {
  return (
    <Page title="Tasks">
      <TasksGuts />
    </Page>
  );
};

interface TaskModalPropTypes {
  task: GetTasksQuery_tasks_nodes;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const useTaskModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);

  const TaskModal: React.VFC<Omit<TaskModalPropTypes, 'isOpen' | 'setIsOpen'>> =
    useCallback(
      (props: Omit<TaskModalPropTypes, 'isOpen' | 'setIsOpen'>) => (
        <TaskModalBase isOpen={isOpen} setIsOpen={setIsOpen} {...props} />
      ),
      [isOpen],
    );

  return { TaskModal, open };
};

const TaskModalBase: React.VFC<TaskModalPropTypes> = ({
  task,
  isOpen,
  setIsOpen,
}) => {
  const cancelButtonRef = useRef(null);
  const profile = useProfile();

  const [setResponse, { loading: setting }] = useMutation<
    SetResponseMutation,
    SetResponseMutationVariables
  >(SET_RESPONSE);

  const [clearResponse, { loading: clearing }] = useMutation<
    ClearResponseMutation,
    ClearResponseMutationVariables
  >(CLEAR_RESPONSE);

  const handleResponse = useCallback(
    (
      taskId: string,
      participantId: string,
      response: ParticipantResponse | null,
    ) => {
      if (response === null) {
        clearResponse({
          variables: { input: { taskId, participantId } },
          optimisticResponse: {
            clearResponse: {
              __typename: 'ClearResponsePayload',
              participant: {
                __typename: 'Participant',
                id: participantId,
                response: null,
              },
            },
          },
        });
      } else {
        setResponse({
          variables: { input: { taskId, participantId, response } },
          optimisticResponse: {
            setResponse: {
              __typename: 'SetResponsePayload',
              participant: {
                __typename: 'Participant',
                id: participantId,
                response,
              },
            },
          },
        });
      }
    },
    [setResponse, clearResponse],
  );

  const me = useMemo(
    () => task.participants.nodes.find((p) => p.user.id === profile.id),
    [profile.id, task.participants.nodes],
  );

  const handleClickYes = useCallback(() => {
    if (me?.id) {
      if (me?.response === ParticipantResponse.YES) {
        handleResponse(task.id, me.id, null);
      } else {
        handleResponse(task.id, me.id, ParticipantResponse.YES);
      }
    }
  }, [me?.id, me?.response, task.id, handleResponse]);

  const handleClickNo = useCallback(() => {
    if (me?.id) {
      if (me?.response === ParticipantResponse.NO) {
        handleResponse(task.id, me.id, null);
      } else {
        handleResponse(task.id, me.id, ParticipantResponse.NO);
      }
    }
  }, [me?.id, me?.response, task.id, handleResponse]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        onClose={setIsOpen}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 sm:mt-0 mx-4 text-left">
                  <Dialog.Title
                    as="h3"
                    className="text-lg leading-6 font-medium text-gray-900"
                  >
                    {task.name}
                  </Dialog.Title>
                  {profile.id !== task.owner.id && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400">
                        {task.owner.name} needs you for {task.durationMinutes}{' '}
                        minutes
                      </p>
                    </div>
                  )}
                  {!!task.description && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {task.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <span className="relative z-0 inline-flex shadow-sm rounded-md ml-4 mt-4">
                <button
                  type="button"
                  onClick={handleClickYes}
                  // className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium text-gray-700 focus:z-20 focus:outline-none focus:ring-1 ${
                    me?.response === ParticipantResponse.YES
                      ? 'hover:bg-green-50 bg-green-200 focus:ring-green-500 border-green-500 z-10'
                      : 'hover:bg-gray-50 border-gray-300 bg-white focus:ring-indigo-500 focus:border-indigo-500 '
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={handleClickNo}
                  className={`-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium text-gray-700 focus:z-20 focus:outline-none focus:ring-1 ${
                    me?.response === ParticipantResponse.NO
                      ? 'hover:bg-red-50 bg-red-200 focus:ring-red-500 border-red-500 z-10'
                      : 'hover:bg-gray-50 border-gray-300 bg-white focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                >
                  No
                </button>
              </span>
              <div className="w-full mx-4 mt-4">
                <p className="text-md font-medium text-gray-700">
                  Waiting for any {task.groupSize}{' '}
                  {task.groupSize === 1 ? 'participant' : 'participants'}
                </p>
              </div>
              <ul role="list" className="divide-y divide-gray-200 sm:mx-4">
                {task.participants.nodes.map((participant) => (
                  <li key={participant.user.id} className="px-4 py-2 sm:px-0">
                    <div className="flex items-center">
                      <div>
                        <img
                          className="inline-block h-6 w-6 rounded-full"
                          src={participant.user.avatarUrl || ''}
                          alt={participant.user.name}
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          {participant.user.name}
                        </p>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 capitalize">
                          {participant.response}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                {profile.id === task.owner.id && (
                  <Link
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                    to={`/tasks/edit/${task.id}`}
                  >
                    Edit
                  </Link>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setIsOpen(false)}
                  ref={cancelButtonRef}
                >
                  Close
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
