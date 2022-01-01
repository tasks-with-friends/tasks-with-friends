/* This example requires Tailwind CSS v2.0+ */
import { gql, useMutation, useQuery } from '@apollo/client';
import React, { useCallback, useLayoutEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Page } from '../../templates/page';
import { Task, TaskForm, TaskFormSubmitHandler } from './task-form';
import { GET_TASKS } from './tasks';
import {
  EditTaskMutation,
  EditTaskMutationVariables,
} from './__generated__/EditTaskMutation';
import {
  GetTaskQuery,
  GetTaskQueryVariables,
} from './__generated__/GetTaskQuery';

const GET_TASK = gql`
  query GetTaskQuery($id: ID!) {
    task(id: $id) {
      id
      name
      description
      durationMinutes
      groupSize
      status
    }
  }
`;

const EDIT_TASK = gql`
  mutation EditTaskMutation($input: EditTaskInput!) {
    editTask(input: $input) {
      task {
        id
        name
        description
        durationMinutes
        groupSize
      }
    }
  }
`;

const DELETE_TASK = gql`
  mutation RemoveTaskMutation($input: EditTaskInput!) {
    editTask(input: $input) {
      task {
        id
        name
        description
        durationMinutes
        groupSize
      }
    }
  }
`;

const EditTaskGuts: React.VFC = () => {
  const navigate = useNavigate();
  const { taskId } = useParams();

  useLayoutEffect(() => {
    document.getElementById('name')?.focus();
  }, []);

  const {
    data,
    loading,
    error: loadError,
  } = useQuery<GetTaskQuery, GetTaskQueryVariables>(GET_TASK, {
    variables: { id: taskId || '' },
  });

  const [editTask, { loading: saving, error: saveError }] = useMutation<
    EditTaskMutation,
    EditTaskMutationVariables
  >(EDIT_TASK);

  const handleSubmit: TaskFormSubmitHandler = useCallback(
    ({ diffs }) => {
      if (taskId && Object.keys(diffs).length) {
        console.log('saving task...', { id: taskId, ...diffs });
        editTask({
          variables: { input: { id: taskId, ...diffs } },
        }).then(() => navigate('/tasks'));
      } else {
        navigate('/tasks');
      }
    },
    [taskId, editTask, navigate],
  );

  if (loading) return <>Loading...</>;
  if (saving) return <>Saving...</>;
  if (loadError) return <>Error loading.</>;
  if (saveError) return <>Error saving.</>;
  if (!data?.task) return <>Not Found :(</>;

  const { description, ...rest } = data.task;

  const task: Task = {
    description: description === null ? undefined : description,
    ...rest,
  };

  return (
    <TaskForm
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      value={task}
    />
  );
};

export const EditTask: React.VFC = () => {
  return (
    <Page title="Edit task">
      <EditTaskGuts />
    </Page>
  );
};
