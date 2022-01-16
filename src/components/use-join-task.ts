import { gql, MutationResult, useMutation } from '@apollo/client';
import { Maybe } from 'graphql/jsutils/Maybe';
import { useCallback, useMemo } from 'react';
import { TaskStatus, UserStatus } from '../../__generated__/globalTypes';
import { useProfile } from '../profile-provider';
import { useNotifications } from './notification-provider';
import {
  JoinTaskMutation,
  JoinTaskMutationVariables,
} from './__generated__/JoinTaskMutation';

export const JOIN_TASK = gql`
  mutation JoinTaskMutation($input: JoinTaskInput!) {
    joinTask(input: $input) {
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

export function useJoinTask(taskId: Maybe<string>) {
  const { clearTask } = useNotifications();
  const [mutation, result] = useMutation<
    JoinTaskMutation,
    JoinTaskMutationVariables
  >(JOIN_TASK);

  const profile = useProfile();

  const joinTask = useCallback(() => {
    if (taskId) {
      clearTask(taskId);
      mutation({
        variables: {
          input: {
            taskId,
          },
        },
        optimisticResponse: {
          joinTask: {
            __typename: 'JoinTaskPayload',
            me: {
              __typename: 'User',
              id: profile.id,
              status: UserStatus.FLOW,
              currentTask: {
                __typename: 'Task',
                id: taskId,
                status: TaskStatus.IN_PROGRESS,
              },
            },
            task: {
              __typename: 'Task',
              id: taskId,
              status: TaskStatus.IN_PROGRESS,
            },
          },
        },
      });
    }
  }, [taskId, mutation, profile.id, clearTask]);

  return useMemo<[() => void, MutationResult<JoinTaskMutation>]>(
    () => [joinTask, result],
    [joinTask, result],
  );
}
