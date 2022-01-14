import { ApolloError, gql, useMutation, useQuery } from '@apollo/client';
import { useCallback } from 'react';

import { TaskStatus, UserStatus } from '../../__generated__/globalTypes';
import { GET_DASHBOARD } from '../pages/app';
import { useProfile } from '../profile-provider';
import { GetUserStatusQuery } from './__generated__/GetUserStatusQuery';
import {
  SetUserStatusMutation,
  SetUserStatusMutationVariables,
  SetUserStatusMutation_setUserStatus_me_currentTask,
} from './__generated__/SetUserStatusMutation';

export const GET_TEMPLATE = gql`
  query GetUserStatusQuery {
    me {
      id
      status
      currentTask {
        id
        status
      }
    }
  }
`;

export const SET_USER_STATUS = gql`
  mutation SetUserStatusMutation($input: SetUserStatusInput!) {
    setUserStatus(input: $input) {
      me {
        id
        status
        currentTask {
          id
          status
        }
      }
    }
  }
`;

export function useStatus(): {
  status?: UserStatus;
  currentTaskId?: string;
  setStatus: (newStatus: UserStatus, currentTaskId?: string) => void;
  loading: boolean;
  saving: boolean;
  error?: ApolloError;
} {
  const profile = useProfile();

  const {
    data,
    loading,
    error: loadError,
  } = useQuery<GetUserStatusQuery>(GET_TEMPLATE);

  const [setUserStatus, { loading: saving, error: saveError }] = useMutation<
    SetUserStatusMutation,
    SetUserStatusMutationVariables
  >(SET_USER_STATUS);

  const setStatus = useCallback(
    (newStatus: UserStatus, currentTaskId?: string) => {
      const optimisticCurrentTask: SetUserStatusMutation_setUserStatus_me_currentTask | null =
        currentTaskId
          ? {
              __typename: 'Task',
              id: currentTaskId,
              status: TaskStatus.IN_PROGRESS,
            }
          : null;

      if (data?.me?.status !== newStatus) {
        setUserStatus({
          variables: { input: { status: newStatus } },
          optimisticResponse: {
            setUserStatus: {
              __typename: 'SetUserStatusPayload',
              me: {
                __typename: 'User',
                id: profile.id,
                status: newStatus,
                currentTask: optimisticCurrentTask,
              },
            },
          },
          refetchQueries: [{ query: GET_DASHBOARD }],
        });
      }
    },
    [data?.me?.status, profile.id, setUserStatus],
  );

  return {
    status: data?.me?.status,
    currentTaskId: data?.me?.currentTask?.id,
    setStatus,
    loading,
    saving,
    error: loadError || saveError,
  };
}
