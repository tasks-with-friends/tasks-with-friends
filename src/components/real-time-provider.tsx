import React, { useEffect } from 'react';
import Pusher, { Channel } from 'pusher-js';

import { useProfileOrNull } from '../profile-provider';
import { EventMap } from '../services/real-time';
import { gql, useApolloClient } from '@apollo/client';
import {
  RecacheTaskStatusQuery,
  RecacheTaskStatusQueryVariables,
} from './__generated__/RecacheTaskStatusQuery';
import {
  RecacheUserStatusQuery,
  RecacheUserStatusQueryVariables,
} from './__generated__/RecacheUserStatusQuery';
import { GET_DASHBOARD } from '../pages/app';
import { GetDashboardQuery } from '../pages/__generated__/GetDashboardQuery';

Pusher.logToConsole = true;

const RECACHE_TASK_STATUS = gql`
  query RecacheTaskStatusQuery($taskId: ID!) {
    task(id: $taskId) {
      id
      status
    }
  }
`;

const RECACHE_USER_STATUS = gql`
  query RecacheUserStatusQuery($userId: ID!) {
    user(id: $userId) {
      id
      status
    }
  }
`;

export const RealTimeProvider: React.FC = ({ children }) => {
  const profile = useProfileOrNull();
  const client = useApolloClient();

  useEffect(() => {
    if (profile) {
      const pusher = new Pusher('a1aa8e926f8ea7877532', {
        cluster: 'us3',
      });

      const channel = pusher.subscribe(profile.id);
      handleEvent(channel, 'task-status:v1', ({ taskIds }) => {
        for (const taskId of taskIds) {
          client.query<RecacheTaskStatusQuery, RecacheTaskStatusQueryVariables>(
            {
              query: RECACHE_TASK_STATUS,
              fetchPolicy: 'network-only',
              variables: { taskId },
            },
          );
        }
        client.query<GetDashboardQuery>({
          query: GET_DASHBOARD,
          fetchPolicy: 'network-only',
        });
      });

      handleEvent(channel, 'user-status:v1', ({ userIds }) => {
        for (const userId of userIds) {
          client.query<RecacheUserStatusQuery, RecacheUserStatusQueryVariables>(
            {
              query: RECACHE_USER_STATUS,
              fetchPolicy: 'network-only',
              variables: { userId },
            },
          );
        }
      });

      return () => {
        channel.unsubscribe();
      };
    } else {
      return () => {
        // empty
      };
    }
  }, [profile, client]);
  return <>{children}</>;
};

function handleEvent<EventName extends keyof EventMap>(
  channel: Channel,
  eventName: EventName,
  callback: (data: EventMap[EventName]) => void,
) {
  // channel.bind(eventName, callback);
  channel.bind(eventName, (data) => {
    console.log(eventName, data);
    callback(data);
  });
}
