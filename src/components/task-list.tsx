import { gql } from '@apollo/client';
import { ChevronRightIcon } from '@heroicons/react/solid';
import React, { useMemo } from 'react';
import { ParticipantResponse } from '../../__generated__/globalTypes';
import { useProfile } from '../profile-provider';
import { useTaskModal } from './task-modal';
import { TaskListItem } from './__generated__/TaskListItem';

export const TASK_LIST_ITEM = gql`
  fragment TaskListItem on Task {
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
          email
          avatarUrl
        }
      }
    }
  }
`;

export interface TaskListPropTypes {
  tasks: TaskListItem[];
}

export const TaskList: React.VFC<TaskListPropTypes> = ({ tasks }) => (
  <div className="bg-white shadow overflow-hidden sm:rounded-md">
    <ul role="list" className="divide-y divide-gray-200">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  </div>
);

const TaskItem: React.VFC<{ task: TaskListItem }> = ({ task }) => {
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
