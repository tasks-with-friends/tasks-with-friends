import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as uuid from 'uuid';
import { useDocumentVisibility } from './use-document-visibility';

export interface NotificationContextPropTypes {
  push(taskId: string, type: TaskNotificationType): void;
  pop(eventId: string): TaskNotification | undefined;
  clearTask(taskId: string | null | undefined): void;
  notifications: TaskNotification[];
}

const defaultProps: NotificationContextPropTypes = {
  push: () => undefined,
  pop: () => undefined,
  clearTask: () => undefined,
  notifications: [],
};

export type TaskNotification = {
  id: string;
  taskId: string;
  type: TaskNotificationType;
  ts: number;
};

export type TaskNotificationType = 'ready' | 'started';

const NotificationContext =
  React.createContext<NotificationContextPropTypes>(defaultProps);

export function useNotifications(): NotificationContextPropTypes {
  return useContext(NotificationContext);
}

export const NotificationProvider: React.FC = ({ children }) => {
  const { hidden } = useDocumentVisibility();
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);

  const push = useCallback(
    (taskId: string, type: TaskNotificationType) => {
      const event: TaskNotification = {
        id: uuid.v4(),
        taskId,
        type,
        ts: new Date().getTime(),
      };
      if (hidden) {
        try {
          const n = new Notification('A task just started!', {
            body: 'Head back to help out!',
            requireInteraction: true,
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
        } catch (ex) {
          console.warn('Browser does not support Notifications', ex);
        }
      }

      setNotifications([...notifications, event]);
    },
    [notifications, hidden],
  );

  const pop = useCallback(
    (eventId: string) => {
      console.log({ eventId });
      const event = notifications.find((e) => e.id === eventId);

      if (event) {
        setNotifications(notifications.filter((e) => e.id !== eventId));
      }

      return event;
    },
    [notifications],
  );

  const clearTask = useCallback(
    (taskId: string) => {
      const without = notifications.filter((e) => e.taskId !== taskId);

      if (without.length !== notifications.length) {
        setNotifications(without);
      }
    },
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      push,
      pop,
      clearTask,
    }),
    [notifications, push, pop, clearTask],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
