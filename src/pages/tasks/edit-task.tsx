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
import {
  RemoveTaskMutation,
  RemoveTaskMutationVariables,
} from './__generated__/RemoveTaskMutation';

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

const REMOVE_TASK = gql`
  mutation RemoveTaskMutation($input: RemoveTaskInput!) {
    removeTask(input: $input) {
      task {
        id
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

  const [removeTask, { loading: removing, error: removeError }] = useMutation<
    RemoveTaskMutation,
    RemoveTaskMutationVariables
  >(REMOVE_TASK);

  const handleSubmit: TaskFormSubmitHandler = useCallback(
    ({ diffs }) => {
      if (taskId && Object.keys(diffs).length) {
        editTask({
          variables: { input: { id: taskId, ...diffs } },
        }).then(() => navigate('/tasks'));
      } else {
        navigate('/tasks');
      }
    },
    [taskId, editTask, navigate],
  );

  const handleDelete = useCallback(() => {
    removeTask({
      update: (cache, result) => {
        if (data?.task) {
          cache.evict({
            id: cache.identify(data?.task as any),
          });
          cache.gc();
        }
      },
      variables: { input: { id: taskId || '' } },
    }).then(() => navigate('/tasks'));
  }, [taskId, removeTask, navigate, data?.task]);

  if (loading) return <>Loading...</>;
  if (saving) return <>Saving...</>;
  if (removing) return <>Deleting...</>;
  if (loadError) return <>Error loading.</>;
  if (saveError) return <>Error saving.</>;
  if (saveError) return <>Error deleting.</>;
  if (!data?.task) return <>Not Found :(</>;

  const { description, ...rest } = data.task;

  const task: Task = {
    description: description === null ? undefined : description,
    ...rest,
  };

  return (
    <TaskForm
      onSubmit={handleSubmit}
      onDelete={handleDelete}
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
