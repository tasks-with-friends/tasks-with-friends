/* This example requires Tailwind CSS v2.0+ */
import { gql, useMutation } from '@apollo/client';
import React, { useCallback, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Page } from '../../templates/page';
import { TaskForm, TaskFormSubmitHandler } from './task-form';
import { GET_TASKS } from './tasks';
import {
  AddTaskMutation,
  AddTaskMutationVariables,
} from './__generated__/AddTaskMutation';

const ADD_TASK = gql`
  mutation AddTaskMutation(
    $name: String!
    $description: String
    $durationMinutes: Int!
    $groupSize: Int!
    $userIds: [ID!]
  ) {
    addTask(
      input: {
        name: $name
        description: $description
        durationMinutes: $durationMinutes
        groupSize: $groupSize
        userIds: $userIds
      }
    ) {
      task {
        id
      }
    }
  }
`;

const NewTaskGuts: React.VFC = () => {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    document.getElementById('name')?.focus();
  }, []);

  const [addTask, { data, loading: saving, error }] = useMutation<
    AddTaskMutation,
    AddTaskMutationVariables
  >(ADD_TASK);

  // TODO: cache result
  const handleSubmit: TaskFormSubmitHandler = useCallback(
    ({ value }) => {
      const { participants, ...rest } = value;

      addTask({
        refetchQueries: [
          {
            query: GET_TASKS,
          },
        ],
        awaitRefetchQueries: true,
        variables: { ...rest, userIds: participants.map((p) => p.id) },
      }).then(() => navigate('/tasks'));
    },
    [addTask, navigate],
  );

  if (saving) return <>Saving ...</>;

  return <TaskForm onSubmit={handleSubmit} onCancel={() => navigate(-1)} />;
};

export const NewTask: React.VFC = () => (
  <Page title="New task">
    <NewTaskGuts />
  </Page>
);
