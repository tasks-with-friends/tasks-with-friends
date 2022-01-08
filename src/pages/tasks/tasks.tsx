import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { PlusIcon } from '@heroicons/react/solid';
import { Link } from 'react-router-dom';

import { Page } from '../../templates/page';
import { GetTasksQuery } from './__generated__/GetTasksQuery';
import { TaskList, TASK_LIST_ITEM } from '../../components/task-list';

export const GET_TASKS = gql`
  ${TASK_LIST_ITEM}
  query GetTasksQuery {
    tasks(filter: ALL) {
      nodes {
        ...TaskListItem
      }
    }
  }
`;

const CreateTaskButton: React.VFC<{ className?: string }> = ({ className }) => (
  <Link
    to="/tasks/new"
    className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
      !!className ? className : ''
    }`}
  >
    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
    New Task
  </Link>
);

const TasksGuts: React.VFC = () => {
  const { loading, error, data } = useQuery<GetTasksQuery>(GET_TASKS);

  if (loading) return <>Loading...</>;
  if (error) return <>Error loading.</>;

  if (!data?.tasks?.nodes?.length) {
    return (
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 mt-12 md:mt-24 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new task.
        </p>
        <div className="mt-6">
          <CreateTaskButton />
        </div>
      </div>
    );
  }

  return (
    <>
      <CreateTaskButton className="mb-4" />
      <TaskList tasks={data.tasks.nodes} />
    </>
  );
};

export const Tasks: React.VFC = () => {
  return (
    <Page title="Tasks">
      <TasksGuts />
    </Page>
  );
};
