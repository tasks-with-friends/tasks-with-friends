import { Response } from 'node-fetch';
import { Pool } from 'pg';

export interface RealTime {
  trigger<EventName extends keyof EventMap>(
    channel: string | string[],
    event: EventName,
    data: EventMap[EventName],
  ): Promise<Response>;

  // triggerBatch(events: AnyBatchEvent[]): Promise<Response>;
}

// // TODO: make this more specific
// export type AnyBatchEvent = BatchEvent<keyof EventMap>;

// export type BatchEvent<EventName extends keyof EventMap> = {
//   channel: string;
//   name: EventName;
//   data: EventMap[EventName];
// };

export type EventMap = {
  'task-status:v1': {
    taskIds: string[];
  };
  'user-status:v1': {
    userIds: string[];
  };
};

export interface MessageBus {
  onTaskStatusChanged(taskIds: string[]): Promise<void>;
  onUserStatusChanged(userIds: string[]): Promise<void>;
}

export class NullMessageBus implements MessageBus {
  onTaskStatusChanged(): Promise<void> {
    return Promise.resolve();
  }
  onUserStatusChanged(): Promise<void> {
    return Promise.resolve();
  }
}

export class SqlMessageBus implements MessageBus {
  constructor(
    private readonly pool: Pool,
    private readonly schema: string,
    private readonly realTime: RealTime,
  ) {}
  async onTaskStatusChanged(taskIds: string[]): Promise<void> {
    try {
      if (taskIds.length) {
        const userTasks = (
          await this.pool.query<{
            user_external_id: string;
            task_external_id: string;
          }>(
            `SELECT user_external_id, task_external_id FROM ${
              this.schema
            }.participants WHERE task_external_id IN (${taskIds.map(
              (_, i) => `$${i + 1}`,
            )})`,
            taskIds,
          )
        ).rows;

        const usersToUpdate = userTasks.reduce<Record<string, Set<string>>>(
          (acc, item) => {
            acc[item.user_external_id] ||= new Set();
            acc[item.user_external_id].add(item.task_external_id);
            return acc;
          },
          {},
        );

        Object.keys(usersToUpdate).forEach((userId) =>
          this.realTime.trigger(userId, 'task-status:v1', {
            taskIds: Array.from(usersToUpdate[userId]),
          }),
        );
      }
    } catch (ex) {
      console.error('Cannot process onTaskStatusChanged', ex);
    }
  }

  async onUserStatusChanged(userIds: string[]): Promise<void> {
    try {
      const userFriends = (
        await this.pool.query<{
          user_external_id: string;
          friend_user_external_id: string;
        }>(
          `SELECT user_external_id, friend_user_external_id FROM ${
            this.schema
          }.friends WHERE user_external_id IN (${userIds.map(
            (_, i) => `$${i + 1}`,
          )})`,
          userIds,
        )
      ).rows;

      const usersToUpdate = userFriends.reduce<Record<string, Set<string>>>(
        (acc, item) => {
          acc[item.user_external_id] ||= new Set();
          acc[item.user_external_id].add(item.user_external_id);

          acc[item.friend_user_external_id] ||= new Set();
          acc[item.friend_user_external_id].add(item.user_external_id);
          return acc;
        },
        {},
      );

      Object.keys(usersToUpdate).forEach((friendId) =>
        this.realTime.trigger(friendId, 'user-status:v1', {
          userIds: Array.from(usersToUpdate[friendId]),
        }),
      );
    } catch (ex) {
      console.error('Cannot process onUserStatusChanged', ex);
    }
  }
}
