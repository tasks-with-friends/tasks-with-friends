import { invitationConnection } from './invitation-dto';
import * as schema from './server-types.g';
import { taskConnection, taskDto } from './task-dto';
import { userConnection, userDto } from './user-dto';
import { paginate } from './utils';

export type Root = schema.Query; // & Mutation;

export const root: Root = {
  me: async (_, { profile, registry }) => {
    const users = await registry.get('users-service').getUsers([profile.id]);

    return userDto(users[0]);
  },
  friends: async (args, { registry }) => {
    const service = registry.get('users-service');
    const friends = await service.getFriends(paginate(args));

    return userConnection(friends, service);
  },
  incomingInvitations: async (args, { registry }) => {
    const service = registry.get('invitation-service');
    const invitations = await service.getIncomingInvitations(paginate(args));

    return invitationConnection(invitations, service);
  },
  outgoingInvitations: async (args, { registry }) => {
    const service = registry.get('invitation-service');
    const invitations = await service.getOutgoingInvitations(paginate(args));

    return invitationConnection(invitations, service);
  },
  task: ({ id }, { registry }) => {
    const tasks = registry.get('task-service').getTasks([id]);

    return taskDto(tasks[0]);
  },
  tasks: async (args, { profile, registry }) => {
    const service = registry.get('task-service');
    const tasks = await service.getTasksByUserId(profile.id, paginate(args));

    return taskConnection(tasks, service);
  },
};
