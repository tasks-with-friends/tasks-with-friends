import { Pool } from 'pg';
import { Task, TaskStatus, User, UserStatus } from '../domain/v1/api.g';
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
  private readonly userAddedByTask: Map<Task['id'], Set<User['id']>> =
    new Map();
  private readonly userRemovedByTask: Map<Task['id'], Set<User['id']>> =
    new Map();

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
  onAddedToTask(userIdByTaskId: Record<Task['id'], User['id']>): void {
    for (const taskId of Object.keys(userIdByTaskId)) {
      if (!this.userAddedByTask.has(taskId)) {
        this.userAddedByTask.set(taskId, new Set());
      }
      this.userAddedByTask.get(taskId)!.add(userIdByTaskId[taskId]);
    }
  }
  onRemovedFromTask(userIdByTaskId: Record<Task['id'], User['id']>): void {
    for (const taskId of Object.keys(userIdByTaskId)) {
      if (!this.userRemovedByTask.has(taskId)) {
        this.userRemovedByTask.set(taskId, new Set());
      }
      this.userRemovedByTask.get(taskId)!.add(userIdByTaskId[taskId]);
    }
  }

  private async computeTaskMessages(): Promise<{
    status: Map<User['id'], Map<User['id'], TaskStatus>>;
    participantAdded: Map<User['id'], Map<Task['id'], Set<User['id']>>>;
    participantRemoved: Map<User['id'], Map<Task['id'], Set<User['id']>>>;
  }> {
    const statusByTaskByRecipient: Map<
      User['id'],
      Map<User['id'], TaskStatus>
    > = new Map();

    const addedParticipantsByTaskByRecipent: Map<
      User['id'],
      Map<Task['id'], Set<User['id']>>
    > = new Map();

    const removedParticipantsByTaskByRecipent: Map<
      User['id'],
      Map<Task['id'], Set<User['id']>>
    > = new Map();

    const taskIds = Array.from(
      new Set(
        ...this.taskStatus.keys(),
        ...this.userAddedByTask.keys(),
        ...this.userRemovedByTask.keys(),
      ),
    );
    if (!taskIds.length) {
      return {
        status: statusByTaskByRecipient,
        participantAdded: addedParticipantsByTaskByRecipent,
        participantRemoved: removedParticipantsByTaskByRecipent,
      };
    }

    // gets a mapping of users who should be notified when task events occur
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

    const taskIdsByRecipientId = userTasks.reduce<Record<string, Set<string>>>(
      (acc, item) => {
        acc[item.user_external_id] ||= new Set();
        acc[item.user_external_id].add(item.task_external_id);
        return acc;
      },
      {},
    );

    for (const recipientId of Object.keys(taskIdsByRecipientId)) {
      const taskIdsForRecipient = taskIdsByRecipientId[recipientId];
      if (taskIdsForRecipient.size) {
        const taskStatusByTaskId: Map<Task['id'], TaskStatus> = new Map();
        const participantsAddedByTaskId: Map<
          Task['id'],
          Set<User['id']>
        > = new Map();

        const participantsRemovedByTaskId: Map<
          Task['id'],
          Set<User['id']>
        > = new Map();

        for (const taskId of taskIdsForRecipient) {
          const status = this.taskStatus.get(taskId);
          const added = this.userAddedByTask.get(taskId);
          const removed = this.userRemovedByTask.get(taskId);

          if (status) taskStatusByTaskId.set(taskId, status);
          if (added?.size) participantsAddedByTaskId.set(taskId, added);
          if (removed?.size) participantsRemovedByTaskId.set(taskId, removed);
        }
        if (taskStatusByTaskId.size) {
          statusByTaskByRecipient.set(recipientId, taskStatusByTaskId);
          addedParticipantsByTaskByRecipent.set(
            recipientId,
            participantsAddedByTaskId,
          );
          removedParticipantsByTaskByRecipent.set(
            recipientId,
            participantsRemovedByTaskId,
          );
        }
      }
    }
    return {
      status: statusByTaskByRecipient,
      participantAdded: addedParticipantsByTaskByRecipent,
      participantRemoved: removedParticipantsByTaskByRecipent,
    };
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
      ...taskMessages.status.keys(),
      ...taskMessages.participantAdded.keys(),
      ...taskMessages.participantRemoved.keys(),
      ...userMessages.status.keys(),
      ...userMessages.currentTask.keys(),
    ]);

    for (const recipient of recipients) {
      const message: EventMap['multi-payload:v1'] = {};

      const t = taskMessages.status.get(recipient);
      if (t?.size) message.taskStatus = toRecord(t);

      const u = userMessages.status.get(recipient);
      if (u?.size) message.userStatus = toRecord(u);

      const c = userMessages.currentTask.get(recipient);
      if (c?.size) message.userCurrentTask = toRecord(c);

      const a = taskMessages.participantAdded.get(recipient);
      if (a?.size)
        message.participantsAdded = mapRecord(a, (set: Set<string>) =>
          Array.from(set),
        );

      const r = taskMessages.participantRemoved.get(recipient);
      if (r?.size)
        message.participantsRemoved = message.participantsRemoved = mapRecord(
          r,
          (set: Set<string>) => Array.from(set),
        );

      await this.realTime.trigger(recipient, 'multi-payload:v1', message);
    }

    this.taskStatus.clear();
    this.userStatus.clear();
    this.userCurrentTask.clear();
    this.userAddedByTask.clear();
    this.userRemovedByTask.clear();
  }
}

function toRecord<T>(map: Map<string, T>): Record<string, T> {
  const record: Record<string, T> = {};

  for (const [key, value] of map) {
    record[key] = value;
  }

  return record;
}

function mapRecord<T, U>(
  map: Map<string, T>,
  fn: (value: T) => U,
): Record<string, U> {
  const record: Record<string, U> = {};

  for (const [key, value] of map) {
    record[key] = fn(value);
  }

  return record;
}
