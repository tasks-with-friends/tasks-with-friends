import { ApolloError, gql, useMutation, useQuery } from '@apollo/client';
import { useCallback } from 'react';

import { UserStatus } from '../../__generated__/globalTypes';
import { useProfile } from '../profile-provider';
import { GetUserStatusQuery } from './__generated__/GetUserStatusQuery';
import {
  SetUserStatusMutation,
  SetUserStatusMutationVariables,
} from './__generated__/SetUserStatusMutation';

export const GET_TEMPLATE = gql`
  query GetUserStatusQuery {
    me {
      id
      status
    }
  }
`;

export const SET_USER_STATUS = gql`
  mutation SetUserStatusMutation($input: SetUserStatusInput!) {
    setUserStatus(input: $input) {
      me {
        id
        status
      }
    }
  }
`;

export function useStatus(): {
  status?: UserStatus;
  setStatus: (newStatus: UserStatus) => void;
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
    (newStatus: UserStatus) => {
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
              },
            },
          },
        });
      }
    },
    [data?.me?.status, profile.id, setUserStatus],
  );

  return {
    status: data?.me?.status,
    setStatus,
    loading,
    saving,
    error: loadError || saveError,
  };
}
