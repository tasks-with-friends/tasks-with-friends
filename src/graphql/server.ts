import { invitationConnection } from './invitation-dto';
import * as schema from '../domain/v1/graph.g';
import { taskConnection, taskDto } from './task-dto';
import { userConnection, userDto } from './user-dto';
import { paginate } from './utils';

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
  tasks: async (args, { profile, registry }) => {
    const tasks = await registry
      .get('task-service')
      .getTasks({ ownerId: profile.id, ...paginate(args) });

    return taskConnection(tasks);
  },
  addTask: async (args, { registry }) => {
    const { userIds, description, ...rest } = args.input;

    const task = await registry.get('task-service').createTask({
      task: {
        ...rest,
        description: description === null ? undefined : description,
      },
    });

    if (userIds) {
      const participants = await registry
        .get('task-service')
        .createParticipants({
          taskId: task.id,
          participants: userIds.map((userId) => ({ userId })),
        });
    }

    return { task: taskDto(task) };
  },
  acceptInvite: () => {
    throw new Error('method not implemented');
  },
  clearResponse: () => {
    throw new Error('method not implemented');
  },
  editTask: () => {
    throw new Error('method not implemented');
  },
  inviteFriend: () => {
    throw new Error('method not implemented');
  },
  rejectInvite: () => {
    throw new Error('method not implemented');
  },
  removeFriend: () => {
    throw new Error('method not implemented');
  },
  removeTask: () => {
    throw new Error('method not implemented');
  },
  setResponse: () => {
    throw new Error('method not implemented');
  },
  setUserStatus: () => {
    throw new Error('method not implemented');
  },
};
