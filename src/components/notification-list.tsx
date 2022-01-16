import { SpeakerphoneIcon } from '@heroicons/react/solid';
import React, { useCallback } from 'react';
import {
  TaskNotification,
  TaskNotificationType,
  useNotifications,
} from './notification-provider';
import { useJoinTask } from './use-join-task';
import { useTask } from './use-task';

export const NotificationList: React.VFC = () => {
  const { notifications } = useNotifications();
  if (!notifications.length) return null;
  return (
    <ul className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {notifications.map((n) => (
        <TaskNotificationItem key={n.id} notification={n} />
      ))}
    </ul>
  );
};

const TaskNotificationItem: React.VFC<{ notification: TaskNotification }> = ({
  notification,
}) => {
  const [joinTask] = useJoinTask(notification.taskId);
  const { data, loading } = useTask(notification.taskId);

  if (loading || !data?.task) return null;

  if (notification.type === 'started') {
    return (
      <NotificationItem
        id={notification.id}
        title="Task Started"
        Icon={SpeakerphoneIcon}
        color="green"
        action="A task just started!"
        onAction={joinTask}
      >
        <p>
          Do you want to join the task{' '}
          <span className="font-medium">{data.task.name}</span>? Joining now
          will help you and your friends stay productive.
        </p>
      </NotificationItem>
    );
  }

  return null;
};

interface NotificationPropTypes {
  id: string;
  title: string;
  color: 'green' | 'indigo';
  action: string;
  onAction?: React.MouseEventHandler<HTMLButtonElement>;
  Icon: React.VFC<React.ComponentProps<'svg'>>;
}

const NotificationItem: React.FC<NotificationPropTypes> = ({
  id,
  title,
  color,
  onAction,
  Icon,
  children,
}) => {
  const { pop } = useNotifications();
  const colorStyles = {
    bg: '',
    icon: '',
    header: '',
    children: '',
  };

  const handleDismiss = useCallback(() => {
    pop(id);
  }, [pop, id]);

  switch (color) {
    case 'green':
      colorStyles.bg = 'bg-green-50';
      colorStyles.icon = 'text-green-400';
      colorStyles.header = 'text-green-800';
      colorStyles.children = 'text-green-700';
      break;
    case 'indigo':
      colorStyles.bg = 'bg-indigo-50';
      colorStyles.icon = 'text-indigo-400';
      colorStyles.header = 'text-indigo-800';
      colorStyles.children = 'text-indigo-700';
      break;
  }

  return (
    <li className={`rounded-md p-4 ${colorStyles.bg}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${colorStyles.icon}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${colorStyles.header}`}>
            {title}
          </h3>
          <div className={`mt-2 text-sm ${colorStyles.children}`}>
            {children}
          </div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex">
              <NotificationButton color={color} onClick={onAction}>
                Join task
              </NotificationButton>
              <NotificationButton color={color} onClick={handleDismiss}>
                Dismiss
              </NotificationButton>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

interface NotificationButtonPropTypes {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  color: 'indigo' | 'green';
}

const NotificationButton: React.FC<NotificationButtonPropTypes> = ({
  onClick,
  color,
  children,
}) => {
  let colorStyle = '';

  switch (color) {
    case 'green':
      colorStyle =
        'bg-green-50 text-green-800 hover:bg-green-100 focus:ring-offset-green-50 focus:ring-green-600';
      break;
    case 'indigo':
      colorStyle = '';
      break;
  }

  return (
    <button
      type="button"
      className={`ml-3 px-2 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${colorStyle}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
