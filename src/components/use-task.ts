import { gql, useQuery } from '@apollo/client';
import { TASK_LIST_ITEM } from './task-list';
import {
  GetTaskQuery,
  GetTaskQueryVariables,
} from './__generated__/GetTaskQuery';

export const GET_TASK = gql`
  ${TASK_LIST_ITEM}
  query GetTaskQuery($taskId: ID!) {
    task(id: $taskId) {
      ...TaskListItem
    }
  }
`;

export const useTask = (taskId?: string) => {
  return useQuery<GetTaskQuery, GetTaskQueryVariables>(GET_TASK, {
    skip: !taskId,
    variables: { taskId: taskId || '' },
  });
};
