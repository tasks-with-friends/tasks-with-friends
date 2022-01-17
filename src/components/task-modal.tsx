import { gql, useMutation } from '@apollo/client';
import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ParticipantResponse,
  TaskStatus,
} from '../../__generated__/globalTypes';
import { useProfile } from '../profile-provider';
import { Avatar } from './avatar';
import { ModalPropTypes } from './types';
import { useJoinTask } from './use-join-task';
import { useStartTask } from './use-start-task';
import {
  ClearResponseMutation,
  ClearResponseMutationVariables,
} from './__generated__/ClearResponseMutation';
import {
  SetResponseMutation,
  SetResponseMutationVariables,
} from './__generated__/SetResponseMutation';
import { TaskListItem } from './__generated__/TaskListItem';

const SET_RESPONSE = gql`
  mutation SetResponseMutation($input: SetResponseInput!) {
    setResponse(input: $input) {
      participant {
        id
        response
        task {
          id
          status
        }
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
        task {
          id
          status
        }
      }
    }
  }
`;

export interface TaskModalPropTypes {
  task: TaskListItem;
}

export const useTaskModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);

  const TaskModal: React.VFC<TaskModalPropTypes> = useCallback(
    (props: TaskModalPropTypes) => (
      <TaskModalBase isOpen={isOpen} setIsOpen={setIsOpen} {...props} />
    ),
    [isOpen],
  );

  return { TaskModal, open };
};

const TaskModalBase: React.VFC<TaskModalPropTypes & ModalPropTypes> = ({
  task,
  isOpen,
  setIsOpen,
}) => {
  const cancelButtonRef = useRef(null);
  const profile = useProfile();

  const [handleJoinTask] = useJoinTask(task.id);
  const [handleStartTask] = useStartTask(task.id);

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
                task: {
                  __typename: 'Task',
                  id: taskId,
                  status: task.status,
                },
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
                task: {
                  __typename: 'Task',
                  id: taskId,
                  status: task.status,
                },
              },
            },
          },
        });
      }
    },
    [setResponse, clearResponse, task.status],
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
                        <Avatar
                          key={participant.user.id}
                          size="xs"
                          name={participant.user.name}
                          avatarUrl={participant.user.avatarUrl || undefined}
                          status={participant.user.status}
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
                {task.status === TaskStatus.READY && (
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3  sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={handleStartTask}
                  >
                    Start
                  </button>
                )}
                {task.status === TaskStatus.IN_PROGRESS && (
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3  sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={handleJoinTask}
                  >
                    Join
                  </button>
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
