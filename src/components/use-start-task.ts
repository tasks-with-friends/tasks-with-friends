import { gql, MutationResult, useMutation } from '@apollo/client';
import { Maybe } from 'graphql/jsutils/Maybe';
import { useCallback, useMemo } from 'react';
import { TaskStatus, UserStatus } from '../../__generated__/globalTypes';
import { useProfile } from '../profile-provider';
import {
  StartTaskMutation,
  StartTaskMutationVariables,
} from './__generated__/StartTaskMutation';

export const START_TASK = gql`
  mutation StartTaskMutation($input: StartTaskInput!) {
    startTask(input: $input) {
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

export function useStartTask(taskId: Maybe<string>) {
  const [mutation, result] = useMutation<
    StartTaskMutation,
    StartTaskMutationVariables
  >(START_TASK);

  const profile = useProfile();

  const startTask = useCallback(() => {
    if (taskId) {
      mutation({
        variables: {
          input: {
            taskId,
          },
        },
        optimisticResponse: {
          startTask: {
            __typename: 'StartTaskPayload',
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
  }, [taskId, mutation, profile.id]);

  return useMemo<[() => void, MutationResult<StartTaskMutation>]>(
    () => [startTask, result],
    [startTask, result],
  );
}
