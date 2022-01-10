import { gql, useMutation } from '@apollo/client';
import React, { useCallback, useEffect } from 'react';
import { TaskStatus, UserStatus } from '../../__generated__/globalTypes';
import { useStatus } from '../components/use-status';
import { useTask } from '../components/use-task';
import { TaskListItem } from '../components/__generated__/TaskListItem';
import { useProfile } from '../profile-provider';
import { GET_DASHBOARD } from './app';
import {
  EndTaskMutation,
  EndTaskMutationVariables,
} from './__generated__/EndTaskMutation';
import {
  LeaveTaskMutation,
  LeaveTaskMutationVariables,
} from './__generated__/LeaveTaskMutation';

const END_TASK = gql`
  mutation EndTaskMutation($input: EndTaskInput!) {
    endTask(input: $input) {
      me {
        id
        status
        currentTask {
          id
          status
        }
      }
      task {
        id
        status
      }
    }
  }
`;

const LEAVE_TASK = gql`
  mutation LeaveTaskMutation($input: LeaveTaskInput!) {
    leaveTask(input: $input) {
      me {
        id
        status
        currentTask {
          id
          status
        }
      }
      task {
        id
        status
      }
    }
  }
`;

const TaskDisplay: React.VFC<{
  currentTask: TaskListItem;
  className?: string;
}> = ({ currentTask, className }) => {
  const profile = useProfile();

  const [endTask] = useMutation<EndTaskMutation, EndTaskMutationVariables>(
    END_TASK,
  );
  const handleEndTask = useCallback(() => {
    if (!currentTask?.id) return;
    endTask({
      variables: {
        input: {
          taskId: currentTask.id,
        },
      },
      optimisticResponse: {
        endTask: {
          __typename: 'EndTaskPayload',
          me: {
            __typename: 'User',
            id: profile.id,
            status: UserStatus.IDLE,
            currentTask: null,
          },
          task: {
            __typename: 'Task',
            id: currentTask.id,
            status: TaskStatus.READY,
          },
        },
      },
      refetchQueries: [{ query: GET_DASHBOARD }],
    });
  }, [endTask, currentTask?.id, profile.id]);

  const [leaveTask] = useMutation<
    LeaveTaskMutation,
    LeaveTaskMutationVariables
  >(LEAVE_TASK);
  const handleLeaveTask = useCallback(() => {
    if (!currentTask?.id) return;
    leaveTask({
      variables: {
        input: {
          taskId: currentTask.id,
        },
      },
      optimisticResponse: {
        leaveTask: {
          __typename: 'LeaveTaskPayload',
          me: {
            __typename: 'User',
            id: profile.id,
            status: UserStatus.IDLE,
            currentTask: null,
          },
          task: {
            __typename: 'Task',
            id: currentTask.id,
            status: TaskStatus.READY,
          },
        },
      },
      refetchQueries: [{ query: GET_DASHBOARD }],
    });
  }, [leaveTask, currentTask?.id, profile.id]);

  return (
    <div className={`${className || ''} flex flex-col items-center`}>
      <ul className="flex flex-row flex-wrap justify-center">
        {currentTask.participants.nodes.map((participant) => (
          <li key={participant.id}>
            <img
              className="inline-block h-14 w-14 rounded-full m-3 border border-gray-300/75 drop-shadow-xl"
              src={participant.user.avatarUrl || ''}
              alt={participant.user.name}
            />
          </li>
        ))}
      </ul>

      <div className="mt-4 px-8 py-4 border border-gray-300/75 shadow-sm text-base font-medium rounded-md text-gray-700/75 bg-white/75">
        <h2 className="text-lg leading-6 font-medium">{currentTask.name}</h2>
        {!!currentTask.description && (
          <p className="text-sm mt-2">{currentTask.description}</p>
        )}
      </div>

      <div className="mt-5 w-full sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          type="button"
          className="sm:ml-3 mt-3 w-full inline-flex justify-center rounded-md border border-gray-300/75 shadow-sm px-4 py-2 bg-white/50 text-base font-medium text-gray-700 hover:bg-gray-50/75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/75 sm:mt-0 sm:w-auto sm:text-sm"
          onClick={handleEndTask}
        >
          End for all
        </button>
        <button
          type="button"
          className="sm:ml-3 mt-3 w-full inline-flex justify-center rounded-md border border-gray-300/75 shadow-sm px-4 py-2 bg-white/50 text-base font-medium text-gray-700 hover:bg-gray-50/75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/75 sm:mt-0 sm:w-auto sm:text-sm"
          onClick={handleLeaveTask}
        >
          Leave
        </button>
      </div>
    </div>
  );
};

export const Flow: React.VFC = () => {
  const { currentTaskId, setStatus } = useStatus();
  const { data } = useTask(currentTaskId);

  useEffect(() => {
    const body = document.getElementsByTagName('body')[0];
    const original = body.style.background;
    body.style.background =
      'url(https://images.pexels.com/photos/3312569/pexels-photo-3312569.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260) fixed center center/cover';
    return () => {
      body.style.background = original;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="max-w-3xl mx-auto flex flex-col items-center">
        <h1 className="text-7xl sm:text-8xl md:text-9xl text-white/50 mt-36 sm:mt-40 md:mt-44 drop-shadow-xl">
          focusing
        </h1>
        {currentTaskId ? (
          data?.task ? (
            <TaskDisplay className="mt-8" currentTask={data.task} />
          ) : (
            <span>Loading...</span>
          )
        ) : (
          <button
            type="button"
            className="mt-24 drop-shadow-xl inline-flex items-center px-8 py-4 border border-gray-300/75 shadow-sm text-base font-medium rounded-md text-gray-700/75 bg-white/50 hover:bg-gray-50/75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/75"
            onClick={() => setStatus(UserStatus.IDLE)}
          >
            Done for now
          </button>
        )}
      </div>
    </div>
  );
};
