/* This example requires Tailwind CSS v2.0+ */
import { gql, useMutation } from '@apollo/client';
import React, { useCallback, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Page } from '../../templates/page';
import { TaskForm, TaskFormSubmitHandler } from './task-form';
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
  ) {
    addTask(
      input: {
        name: $name
        description: $description
        durationMinutes: $durationMinutes
        groupSize: $groupSize
      }
    ) {
      task {
        id
      }
    }
  }
`;

export const NewTask: React.VFC = () => {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    document.getElementById('name')?.focus();
  }, []);

  const [addTask, { data, loading, error }] = useMutation<
    AddTaskMutation,
    AddTaskMutationVariables
  >(ADD_TASK);

  const handleSubmit: TaskFormSubmitHandler = useCallback(
    ({ value }) => {
      const x = addTask({ variables: value }).then(() => navigate('/tasks'));
    },
    [addTask, navigate],
  );

  return (
    <Page title="New task">
      <TaskForm onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
    </Page>
  );
};
