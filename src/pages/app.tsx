/* This example requires Tailwind CSS v2.0+ */
import { gql, useMutation, useQuery } from '@apollo/client';
import { ClockIcon } from '@heroicons/react/outline';
import React, { useCallback, useState } from 'react';
import { TaskStatus } from '../../__generated__/globalTypes';
import { Avatar } from '../components/avatar';
import { TaskList, TASK_LIST_ITEM } from '../components/task-list';
import { useTaskModal } from '../components/task-modal';
import { useJoinTask } from '../components/use-join-task';
import { useStartTask } from '../components/use-start-task';
import { TaskListItem } from '../components/__generated__/TaskListItem';

import { Page } from '../templates/page';
import { ConfirmationModal } from './confirmation-modal';
import { SuccessModal } from './success-modal';
import {
  AcceptInvitationMutation,
  AcceptInvitationMutationVariables,
} from './__generated__/AcceptInvitationMutation';
import {
  GetDashboardQuery,
  GetDashboardQuery_incomingInvitations_nodes as Invitation,
} from './__generated__/GetDashboardQuery';
import {
  RejectInvitationMutation,
  RejectInvitationMutationVariables,
} from './__generated__/RejectInvitationMutation';

export const GET_DASHBOARD = gql`
  ${TASK_LIST_ITEM}
  query GetDashboardQuery {
    tasks(filter: READY) {
      nodes {
        ...TaskListItem
      }
    }
    incomingInvitations {
      nodes {
        id
        from {
          id
          name
          email
          status
          avatarUrl
        }
      }
    }
  }
`;

const ACCEPT_INVITATION = gql`
  mutation AcceptInvitationMutation($input: AcceptInviteInput!) {
    acceptInvite(input: $input) {
      friend {
        id
      }
    }
  }
`;

const REJECT_INVITATION = gql`
  mutation RejectInvitationMutation($input: RejectInviteInput!) {
    rejectInvite(input: $input) {
      success
    }
  }
`;

const InvitationItem: React.VFC<{ invitation: Invitation }> = ({
  invitation,
}) => {
  const [rejectInvite, { loading: rejecting, error: ignoreError }] =
    useMutation<RejectInvitationMutation, RejectInvitationMutationVariables>(
      REJECT_INVITATION,
    );

  const [acceptInvite, { loading: accepting, error: acceptError }] =
    useMutation<AcceptInvitationMutation, AcceptInvitationMutationVariables>(
      ACCEPT_INVITATION,
    );

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const handleClickAccept = useCallback(() => {
    acceptInvite({
      update: (cache) => {
        if (invitation) {
          cache.evict({
            id: cache.identify(invitation as any),
          });
          cache.gc();
        }
      },
      variables: { input: { id: invitation.id } },
    }).then(() => {
      setIsSuccessOpen(true);
    });
  }, [acceptInvite, invitation]);

  const handleClickIgnore = useCallback(() => {
    setIsConfirmationOpen(true);
  }, []);

  const handleIgnore = useCallback(() => {
    rejectInvite({
      update: (cache) => {
        if (invitation) {
          cache.evict({
            id: cache.identify(invitation as any),
          });
          cache.gc();
        }
      },
      variables: { input: { id: invitation.id } },
    }).then(() => {
      setIsConfirmationOpen(false);
    });
  }, [rejectInvite, invitation]);

  return (
    <li key={invitation.id} className="py-4">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <Avatar
            key={invitation.from.id}
            size="sm"
            name={invitation.from.name}
            avatarUrl={invitation.from.avatarUrl || undefined}
            status={invitation.from.status}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {invitation.from.name}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {invitation.from.email}
          </p>
        </div>
        <div>
          <button
            type="button"
            disabled={rejecting || accepting}
            onClick={handleClickIgnore}
            className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
          >
            {rejecting ? 'Ignoring...' : 'Ignore'}
          </button>
          <button
            type="button"
            disabled={rejecting || accepting}
            onClick={handleClickAccept}
            className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
          >
            {accepting ? 'Accepting...' : 'Accept'}
          </button>
        </div>
      </div>
      <SuccessModal
        title="Success!"
        buttonText="Go back to dashboard"
        isOpen={isSuccessOpen}
        setIsOpen={setIsSuccessOpen}
      >
        You are now friends with {invitation.from.name}! You can now collaborate
        with each other on tasks.
      </SuccessModal>
      <ConfirmationModal
        title="Ignore invitation"
        primaryButtonText="Ignore"
        isOpen={isConfirmationOpen}
        setIsOpen={setIsConfirmationOpen}
        onConfirm={handleIgnore}
      >
        Are you sure you want to ignore this invitation? {invitation.from.name}{' '}
        will not be notified (but they will be able to send you another invite).
        This action cannot be undone.
      </ConfirmationModal>
    </li>
  );
};

const InvitationsList: React.VFC<{
  invitations: Invitation[];
}> = ({ invitations }) => {
  return (
    <div className="flow-root mt-6">
      <ul role="list" className="-my-5 divide-y divide-gray-200">
        {invitations.map((invitation) => (
          <InvitationItem key={invitation.id} invitation={invitation} />
        ))}
      </ul>
    </div>
  );
};

interface TaskCardsPropTypes {
  tasks: TaskListItem[];
}

const TaskCards: React.VFC<TaskCardsPropTypes> = ({ tasks }) => {
  return (
    <>
      <h1 className="text-md font-medium">Let's get started!</h1>
      <ul
        role="list"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </ul>
    </>
  );
};

const TaskCard: React.VFC<{ task: TaskListItem }> = ({ task }) => {
  const { open, TaskModal } = useTaskModal();
  return (
    <>
      <li
        key={task.id}
        className="col-span-1 bg-white rounded-lg drop-shadow-md px-8 py-4 flex flex-col"
      >
        <button className="p-4 -m-4 text-left" type="button" onClick={open}>
          <h2 className="font-medium text-indigo-600 text-lg">{task.name}</h2>
        </button>
        <ul className="flex flex-row w-full justify-start items-center mt-4">
          {task.participants.nodes.map((p) => (
            <li key={p.id} className="mr-1">
              <Avatar
                name={p.user.name}
                avatarUrl={p.user.avatarUrl || undefined}
                size="sm"
              />
            </li>
          ))}
          <li className="ml-1">
            <span className="flex flex-row items-center">
              <ClockIcon className="w-6 h-6 mr-1" />
              {task.durationMinutes}m
            </span>
          </li>
        </ul>
        <div className="grow"></div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <TaskButton taskId={task.id} status={task.status} />
        </div>
      </li>
      <TaskModal task={task} />
    </>
  );
};

const TaskButton: React.VFC<{ taskId: string; status: TaskStatus }> = ({
  taskId,
  status,
}) => {
  const text = status === TaskStatus.IN_PROGRESS ? 'Join' : 'Start';
  const colorStyle =
    status === TaskStatus.IN_PROGRESS
      ? 'border-green-500 bg-green-50 text-green-500 hover:bg-green-100 focus:ring-green-500'
      : 'border-indigo-500 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 focus:ring-indigo-500';

  const [startTask] = useStartTask(taskId);
  const [joinTask] = useJoinTask(taskId);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      if (status === TaskStatus.IN_PROGRESS) {
        joinTask();
      } else {
        startTask();
      }
    },
    [status, joinTask, startTask],
  );

  return (
    <button
      type="button"
      className={`w-full inline-flex justify-center rounded-md border-2 shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition duration-150 ${colorStyle}`}
      onClick={handleClick}
    >
      {text}
    </button>
  );
};

const DashboardGuts: React.VFC = () => {
  const { data, loading, error } = useQuery<GetDashboardQuery>(GET_DASHBOARD);

  if (loading) return <>Loading ...</>;
  if (error) return <>Error loading.</>;

  <div>
    hello
    {!!data?.incomingInvitations?.nodes?.length && (
      <InvitationsList invitations={data?.incomingInvitations?.nodes} />
    )}
    {!!data?.tasks?.nodes?.length && <TaskCards tasks={data.tasks.nodes} />}
  </div>;

  return (
    <div>
      hello
      {!!data?.incomingInvitations?.nodes?.length && (
        <InvitationsList invitations={data?.incomingInvitations?.nodes} />
      )}
      {!!data?.tasks?.nodes?.length && <TaskCards tasks={data.tasks.nodes} />}
    </div>
  );
};

export const App: React.VFC = () => {
  return (
    <Page title="Dashboard">
      <DashboardGuts />
    </Page>
  );
};
