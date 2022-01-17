import { ApolloError, gql, useMutation } from '@apollo/client';
import { useCallback, useMemo } from 'react';
import {
  SetResponseMutation,
  SetResponseMutationVariables,
} from './__generated__/SetResponseMutation';
import { ParticipantResponse } from '../../__generated__/globalTypes';
import { TaskListItem } from './__generated__/TaskListItem';
import { useProfile } from '../profile-provider';
import {
  ClearResponseMutation,
  ClearResponseMutationVariables,
} from './__generated__/ClearResponseMutation';
import { Maybe } from 'graphql/jsutils/Maybe';

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

export function useSetResponse(
  task: Maybe<TaskListItem>,
): [
  (response: ParticipantResponse | null) => void,
  { error?: ApolloError; loading: boolean },
] {
  const profile = useProfile();

  const participant = useMemo(
    () => task?.participants.nodes.find((p) => p.user.id === profile.id),
    [profile, task?.participants.nodes],
  );

  const [setResponse, setResponseResult] = useMutation<
    SetResponseMutation,
    SetResponseMutationVariables
  >(SET_RESPONSE);

  const [clearResponse, clearResponseResult] = useMutation<
    ClearResponseMutation,
    ClearResponseMutationVariables
  >(CLEAR_RESPONSE);

  const mutation = useCallback(
    (response: ParticipantResponse | null) => {
      if (task && participant) {
        if (response) {
          setResponse({
            variables: {
              input: {
                taskId: task.id,
                participantId: participant.id,
                response,
              },
            },
            optimisticResponse: {
              setResponse: {
                __typename: 'SetResponsePayload',
                participant: {
                  __typename: 'Participant',
                  id: participant.id,
                  response,
                  task: {
                    __typename: 'Task',
                    id: task.id,
                    status: task.status,
                  },
                },
              },
            },
          });
        } else {
          clearResponse({
            variables: {
              input: {
                taskId: task.id,
                participantId: participant.id,
              },
            },
            optimisticResponse: {
              clearResponse: {
                __typename: 'ClearResponsePayload',
                participant: {
                  __typename: 'Participant',
                  id: participant.id,
                  response,
                  task: {
                    __typename: 'Task',
                    id: task.id,
                    status: task.status,
                  },
                },
              },
            },
          });
        }
      }
    },
    [task, participant, setResponse, clearResponse],
  );

  return [
    mutation,
    {
      loading: setResponseResult.loading || clearResponseResult.loading,
      error: setResponseResult.error || clearResponseResult.error,
    },
  ];
}
