import { invitationConnection, invitationDto } from './invitation-dto';
import * as schema from '../domain/v1/graph.g';
import { taskConnection, taskDto } from './task-dto';
import { userConnection, userDto } from './user-dto';
import { paginate } from './utils';
import { TaskPage, TaskUpdate, UserStatus } from '../domain/v1/api.g';
import { participantDto } from './participant-dto';

export type Root = schema.Query & schema.Mutation;

export const root: Root = {
  me: async (_, { profile, registry }) => {
    const user = await registry.get('user-loader').load(profile.id);

    return userDto(user!);
  },
  user: async ({ id }, { registry }) => {
    const user = await registry.get('user-loader').load(id);

    return user ? userDto(user) : null;
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
    const task = await registry.get('task-loader').load(id);
    return task ? taskDto(task) : null;
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
    } else if (filter === schema.TaskFilter.READY) {
      tasks = await service.getTasks({
        participantId: profile.id,
        status: ['ready', 'in-progress'],
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
  editTask: async ({ input }, { registry }) => {
    const {
      id,
      name,
      description,
      durationMinutes,
      groupSize,
      participants,
      ...rest
    } = input;

    const taskUpdate: TaskUpdate = {};
    if (name !== null) taskUpdate.name = name;
    if (description !== null) taskUpdate.description = description;
    if (durationMinutes !== null) taskUpdate.durationMinutes = durationMinutes;
    if (groupSize !== null) taskUpdate.groupSize = groupSize;

    if (participants !== null) taskUpdate.participants = {};
    if (participants?.add !== null) {
      taskUpdate.participants!.add = participants?.add;
    }
    if (participants?.remove !== null) {
      taskUpdate.participants!.remove = participants?.remove;
    }
    // TODO: implement set

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
  setResponse: async ({ input }, { registry }) => {
    const participant = await registry.get('task-service').updateParticipant({
      taskId: input.taskId,
      participantId: input.participantId,
      participant: {
        response:
          input.response === schema.ParticipantResponse.YES ? 'yes' : 'no',
      },
    });

    return { participant: participantDto(participant) };
  },
  clearResponse: async ({ input }, { registry }) => {
    const participant = await registry
      .get('task-service')
      .clearParticipantResponse(input);

    return { participant: participantDto(participant) };
  },
  setUserStatus: async ({ input }, { profile, registry }) => {
    let status: UserStatus;

    switch (input.status) {
      case schema.UserStatus.AWAY:
        status = 'away';
        break;
      case schema.UserStatus.IDLE:
        status = 'idle';
        break;
      case schema.UserStatus.FLOW:
        status = 'flow';
        break;
      default:
        throw new Error(`User status not supported: ${input.status}`);
    }

    const me = await registry.get('user-service').updateUser({
      userId: profile.id,
      userUpdate: {
        status,
        currentTaskId: input.currentTaskId || undefined,
      },
    });

    return { me: userDto(me) };
  },
  startTask: async ({ input }, { profile, registry }) => {
    const task = await registry.get('task-service').startTask(input);

    const user = await registry
      .get('user-service')
      .getUser({ userId: profile.id });

    return { me: userDto(user), task: taskDto(task) };
  },
  joinTask: async ({ input }, { profile, registry }) => {
    const task = await registry.get('task-service').joinTask(input);

    const user = await registry
      .get('user-service')
      .getUser({ userId: profile.id });

    return { me: userDto(user), task: taskDto(task) };
  },
  endTask: async ({ input }, { profile, registry }) => {
    const task = await registry.get('task-service').endTask(input);

    const user = await registry
      .get('user-service')
      .getUser({ userId: profile.id });

    return { me: userDto(user), task: taskDto(task) };
  },
  leaveTask: async ({ input }, { profile, registry }) => {
    const task = await registry.get('task-service').leaveTask(input);

    const user = await registry
      .get('user-service')
      .getUser({ userId: profile.id });

    return { me: userDto(user), task: taskDto(task) };
  },
};
