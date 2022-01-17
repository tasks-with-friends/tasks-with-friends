import { Pool } from 'pg';
import { Task, TaskStatus, UserStatus } from '../domain/v1/api.g';
import { MessageBus } from './message-bus';
import { EventMap, RealTime } from './real-time';

export class SqlMessageBus implements MessageBus {
  constructor(
    private readonly pool: Pool,
    private readonly schema: string,
    private readonly realTime: RealTime,
  ) {}

  private readonly taskStatus: Map<string, TaskStatus> = new Map();
  private readonly userStatus: Map<string, UserStatus> = new Map();
  private readonly userCurrentTask: Map<string, Task['id'] | null> = new Map();
  private readonly userAddedToTask: Map<string, Task['id']> = new Map();
  private readonly userRemovedFromTask: Map<string, Task['id']> = new Map();

  onTaskStatusChanged(statusByTaskId: Record<string, TaskStatus>) {
    for (const taskId of Object.keys(statusByTaskId)) {
      this.taskStatus.set(taskId, statusByTaskId[taskId]);
    }
  }

  onUserStatusChanged(statusByUserId: Record<string, UserStatus>) {
    for (const userId of Object.keys(statusByUserId)) {
      this.userStatus.set(userId, statusByUserId[userId]);
    }
  }

  onUserCurrentTaskChanged(
    taskByUserId: Record<string, Task['id'] | null>,
  ): void {
    for (const userId of Object.keys(taskByUserId)) {
      this.userCurrentTask.set(userId, taskByUserId[userId]);
    }
  }
  onAddedToTask(taskByUserId: Record<string, Task['id']>): void {
    for (const userId of Object.keys(taskByUserId)) {
      this.userAddedToTask.set(userId, taskByUserId[userId]);
    }
  }
  onRemovedFromTask(taskByUserId: Record<string, Task['id']>): void {
    for (const userId of Object.keys(taskByUserId)) {
      this.userRemovedFromTask.set(userId, taskByUserId[userId]);
    }
  }

  private async computeTaskMessages(): Promise<
    Map<string, Map<string, TaskStatus>>
  > {
    const statusByTaskByRecipient: Map<
      string,
      Map<string, TaskStatus>
    > = new Map();
    const taskIds = Array.from(this.taskStatus.keys());
    if (!taskIds.length) return statusByTaskByRecipient;

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

    for (const userId of Object.keys(usersToUpdate)) {
      const taskIdsForUser = usersToUpdate[userId];
      if (taskIdsForUser.size) {
        const x: Map<string, TaskStatus> = new Map();
        for (const taskId of taskIdsForUser) {
          const status = this.taskStatus.get(taskId);

          if (status) x.set(taskId, status);
        }
        statusByTaskByRecipient.set(userId, x);
      }
    }
    return statusByTaskByRecipient;
  }

  private async computeUserMessages(): Promise<{
    status: Map<string, Map<string, UserStatus>>;
    currentTask: Map<string, Map<string, Task['id'] | null>>;
  }> {
    const statusByUserByRecipient: Map<
      string,
      Map<string, UserStatus>
    > = new Map();
    const currentTaskByUserByRecipient: Map<
      string,
      Map<string, Task['id'] | null>
    > = new Map();
    const userIds = Array.from(this.userStatus.keys());
    if (!userIds.length) {
      return {
        status: statusByUserByRecipient,
        currentTask: currentTaskByUserByRecipient,
      };
    }

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

    const usersByRecipient = userFriends.reduce<Record<string, Set<string>>>(
      (acc, item) => {
        acc[item.user_external_id] ||= new Set();
        acc[item.user_external_id].add(item.user_external_id);

        acc[item.friend_user_external_id] ||= new Set();
        acc[item.friend_user_external_id].add(item.user_external_id);
        return acc;
      },
      {},
    );

    for (const recipient of Object.keys(usersByRecipient)) {
      const userIdsForRecipient = usersByRecipient[recipient];
      if (userIdsForRecipient.size) {
        const statusByUser: Map<string, UserStatus> = new Map();
        const currentTaskByUser: Map<string, Task['id'] | null> = new Map();
        for (const userId of userIdsForRecipient) {
          const status = this.userStatus.get(userId);
          const currentTask = this.userCurrentTask.get(userId);

          if (status) statusByUser.set(userId, status);
          if (typeof currentTask !== 'undefined') {
            currentTaskByUser.set(userId, currentTask);
          }
        }
        statusByUserByRecipient.set(recipient, statusByUser);
        currentTaskByUserByRecipient.set(recipient, currentTaskByUser);
      }
    }

    return {
      status: statusByUserByRecipient,
      currentTask: currentTaskByUserByRecipient,
    };
  }

  async drain(): Promise<void> {
    const [taskMessages, userMessages] = await Promise.all([
      this.computeTaskMessages(),
      this.computeUserMessages(),
    ]);

    const recipients: Set<string> = new Set([
      ...taskMessages.keys(),
      ...userMessages.status.keys(),
      ...userMessages.currentTask.keys(),
      ...this.userAddedToTask.keys(),
    ]);

    for (const recipient of recipients) {
      const message: EventMap['multi-payload:v1'] = {};

      const t = taskMessages.get(recipient);
      if (t) message.taskStatus = toRecord(t);

      const u = userMessages.status.get(recipient);
      if (u) message.userStatus = toRecord(u);

      const c = userMessages.currentTask.get(recipient);
      if (c) message.userCurrentTask = toRecord(c);

      const a = this.userAddedToTask.get(recipient);
      if (a) message.addedToTask = a;

      const r = this.userRemovedFromTask.get(recipient);
      if (r) message.removedFromTask = r;

      await this.realTime.trigger(recipient, 'multi-payload:v1', message);
    }

    this.taskStatus.clear();
    this.userStatus.clear();
    this.userCurrentTask.clear();
    this.userAddedToTask.clear();
    this.userRemovedFromTask.clear();
  }
}

function toRecord<T>(map: Map<string, T>): Record<string, T> {
  const record: Record<string, T> = {};

  for (const [key, value] of map) {
    record[key] = value;
  }

  return record;
}
