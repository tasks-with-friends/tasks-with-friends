import { invitationConnection, invitationDto } from './invitation-dto';
import * as schema from '../domain/v1/graph.g';
import { taskConnection, taskDto } from './task-dto';
import { userConnection, userDto } from './user-dto';
import { paginate } from './utils';
import { TaskPage, TaskUpdate } from '../domain/v1/api.g';

export type Root = schema.Query & schema.Mutation;

export const root: Root = {
  me: async (_, { profile, registry }) => {
    console.log();
    const users = await registry
      .get('user-service')
      .getUsers({ userIds: [profile.id] });

    return userDto(users.items[0]);
  },
  friends: async (args, { profile, registry }) => {
    const service = registry.get('user-service');
    const friends = await service.getFriendsByUserId({
      userId: profile.id,
      ...paginate(args),
    });

    return userConnection(friends);
  },
  incomingInvitations: async (args, { registry }) => {
    const service = registry.get('invitation-service');
    const invitations = await service.getInvitations({
      filter: 'incoming',
      ...paginate(args),
    });

    return invitationConnection(invitations);
  },
  outgoingInvitations: async (args, { registry }) => {
    const service = registry.get('invitation-service');
    const invitations = await service.getInvitations({
      filter: 'outgoing',
      ...paginate(args),
    });

    return invitationConnection(invitations);
  },
  task: async ({ id }, { registry }) => {
    const tasks = await registry
      .get('task-service')
      .getTasks({ taskIds: [id] });

    return taskDto(tasks.items[0]);
  },
  tasks: async ({ filter, ...page }, { profile, registry }) => {
    const service = registry.get('task-service');
    let tasks: TaskPage;
    if (filter === schema.TaskFilter.MINE) {
      tasks = await service.getTasks({
        ownerId: profile.id,
        ...paginate(page),
      });
    } else if (filter === schema.TaskFilter.ALL) {
      tasks = await service.getTasks({
        participantId: profile.id,
        ...paginate(page),
      });
    } else {
      throw new Error(`Filter not supported: ${filter}`);
    }
    return taskConnection(tasks);
  },
  addTask: async ({ input }, { registry }) => {
    const { userIds, description, ...rest } = input;

    const task = await registry.get('task-service').createTask({
      task: {
        ...rest,
        description: description === null ? undefined : description,
      },
    });

    if (userIds) {
      await registry.get('task-service').createParticipants({
        taskId: task.id,
        participants: userIds.map((userId) => ({ userId })),
      });
    }

    return { task: taskDto(task) };
  },
  acceptInvite: async ({ input }, { profile, registry }) => {
    const invitation = await registry
      .get('invitation-service')
      .removeInvitation({ invitationId: input.id });

    const user = await registry
      .get('user-service')
      .addFriendToUser({ userId: profile.id, friendId: invitation.fromUserId });

    return { friend: userDto(user) };
  },
  removeInvite: async ({ input }, { registry }) => {
    const service = registry.get('invitation-service');
    await service.removeInvitation({ invitationId: input.id });
    return { success: true };
  },
  clearResponse: () => {
    throw new Error('method not implemented');
  },
  editTask: async ({ input }, { registry }) => {
    const { id, name, description, durationMinutes, groupSize, ...rest } =
      input;

    const taskUpdate: TaskUpdate = {};
    if (name !== null) taskUpdate.name = name;
    if (description !== null) taskUpdate.description = description;
    if (durationMinutes !== null) taskUpdate.durationMinutes = durationMinutes;
    if (groupSize !== null) taskUpdate.groupSize = groupSize;

    const task = await registry.get('task-service').updateTask({
      taskId: id,
      taskUpdate,
    });

    return { task: taskDto(task) };
  },
  inviteFriend: async ({ input }, { registry }) => {
    const invitation = await registry
      .get('invitation-service')
      .createInvitation({ invitation: { invitedEmail: input.email } });

    return { invitation: invitationDto(invitation) };
  },
  rejectInvite: async ({ input }, { registry }) => {
    await registry
      .get('invitation-service')
      .removeInvitation({ invitationId: input.id });
    return { success: true };
  },
  removeFriend: async ({ input }, { profile, registry }) => {
    await registry
      .get('user-service')
      .removeFriendFromUser({ userId: profile.id, friendId: input.userId });

    return { success: true };
  },
  removeTask: async ({ input }, { registry }) => {
    const task = await registry.get('task-service').removeTask({
      taskId: input.id,
    });

    return { task: taskDto(task) };
  },
  setResponse: () => {
    throw new Error('method not implemented');
  },
  setUserStatus: () => {
    throw new Error('method not implemented');
  },
};
