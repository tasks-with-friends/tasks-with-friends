import { Pool } from 'pg';
import * as uuid from 'uuid';

import {
  Participant,
  ParticipantResponse,
  Task,
  TaskService,
  User,
  UserStatus,
} from '../domain/v1/api.g';
import { NullRealTime } from './null-real-time';
import { NullMessageBus } from './real-time';
import { SqlStatusCalculator } from './sql-status-calculator';
import { SqlTaskService } from './sql-task-service';
import { SqlUserService } from './sql-user-service';
import { StatusCalculator } from './status-calculator';

export class TestUtility {
  constructor(private readonly pool: Pool, private readonly schema: string) {
    this.statusCalculator = new SqlStatusCalculator(
      this.pool,
      this.schema,
      new NullMessageBus(),
    );
  }
  private readonly statusCalculator: StatusCalculator;

  async createUser(): Promise<User> {
    const name = names[Math.floor(Math.random() * names.length - 1)];
    return new SqlUserService(
      this.pool,
      this.schema,
      this.statusCalculator,
      new NullMessageBus(),
    ).getOrCreateUser({
      user: {
        name: name.join(' '),
        email: `${name[0].toLowerCase()}.${name[1].toLowerCase()}@example.com`,
        provider: 'test',
        providerUserId: uuid.v4(),
      },
    });
  }

  async createUsers(count: number): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.createUser());
    }
    return users;
  }

  async getUser(userId: string): Promise<User> {
    return new SqlUserService(
      this.pool,
      this.schema,
      this.statusCalculator,
      new NullMessageBus(),
    ).getUser({ userId });
  }

  as(user: User) {
    return new UserScopedTestUtility(user, this.pool, this.schema);
  }
}

export class UserScopedTestUtility {
  constructor(
    private readonly user: User,
    private readonly pool: Pool,
    private readonly schema: string,
  ) {
    this.statusCalculator = new SqlStatusCalculator(
      this.pool,
      this.schema,
      new NullMessageBus(),
    );
    this.taskService = new SqlTaskService(
      this.pool,
      this.schema,
      this.statusCalculator,
      new NullMessageBus(),
      user.id,
    );
  }
  private readonly statusCalculator: StatusCalculator;
  private readonly taskService: TaskService;

  async setStatus(status: UserStatus): Promise<User> {
    return new SqlUserService(
      this.pool,
      this.schema,
      this.statusCalculator,
      new NullMessageBus(),
      this.user.id,
    ).updateUser({ userId: this.user.id, userUpdate: { status } });
  }

  async createTask({
    groupSize = 2,
    durationMinutes = 15,
  }: {
    groupSize?: number;
    durationMinutes?: number;
  } = {}): Promise<Task> {
    const name = sayings[Math.floor(Math.random() * sayings.length - 1)];
    return this.taskService.createTask({
      task: { name, groupSize, durationMinutes },
    });
  }

  async createTasks(count: number): Promise<Task[]> {
    const users: Task[] = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.createTask());
    }
    return users;
  }

  async addParticipant(task: Task, user: User): Promise<Participant> {
    return (
      await this.taskService.createParticipants({
        taskId: task.id,
        participants: [{ userId: user.id }],
      })
    ).items[0];
  }

  async addParticipants(task: Task, users: User[]): Promise<Participant> {
    return (
      await this.taskService.createParticipants({
        taskId: task.id,
        participants: users.map((u) => ({ userId: u.id })),
      })
    ).items[0];
  }

  async getParticipants(task: Task): Promise<Participant[]> {
    return (
      await this.taskService.getParticipants({
        taskId: task.id,
        first: 10000,
      })
    ).items;
  }

  async getTask(taskId: string): Promise<Task> {
    return this.taskService.getTask({ taskId });
  }

  async respond(
    task: Task,
    response: ParticipantResponse,
  ): Promise<Participant> {
    const ps = (await this.getParticipants(task)).find(
      (p) => p.userId === this.user.id,
    );

    if (!ps) {
      throw new Error(
        `Participant not for '${this.user.name}' on task '${task.name}'`,
      );
    }

    return this.taskService.updateParticipant({
      taskId: task.id,
      participantId: ps.id,
      participant: {
        response,
      },
    });
  }

  async startTask(task: Pick<Task, 'id'>): Promise<Task> {
    return this.taskService.startTask({ taskId: task.id });
  }

  async joinTask(task: Pick<Task, 'id'>): Promise<Task> {
    return this.taskService.joinTask({ taskId: task.id });
  }

  async endTask(task: Pick<Task, 'id'>): Promise<Task> {
    return this.taskService.endTask({ taskId: task.id });
  }

  async leaveTask(task: Pick<Task, 'id'>): Promise<Task> {
    return this.taskService.leaveTask({ taskId: task.id });
  }
}

const names: [string, string][] = [
  ['Demetrius', 'Murray'],
  ['Reece', 'Woodward'],
  ['Damon', 'Hamilton'],
  ['Griffin', 'Giles'],
  ['Kenna', 'Pearson'],
  ['Kassandra', 'Bolton'],
  ['Veronica', 'Shaffer'],
  ['Iris', 'Frederick'],
  ['Kira', 'York'],
  ['Ryan', 'Hinton'],
  ['Darien', 'West'],
  ['Valery', 'Wilson'],
  ['Marin', 'Horn'],
  ['Alisha', 'Clark'],
  ['Makhi', 'Sloan'],
  ['Reginald', 'Underwood'],
  ['Abbie', 'Hodge'],
  ['Brennan', 'Patrick'],
  ['Rey', 'Morton'],
  ['Cameron', 'Bullock'],
  ['Byron', 'Buck'],
  ['Alissa', 'Lamb'],
  ['Abigayle', 'Chung'],
  ['Lauryn', 'Khan'],
  ['Corinne', 'Fuentes'],
  ['Gavyn', 'Vaughn'],
  ['Darion', 'King'],
  ['Lamont', 'Perkins'],
  ['Trenton', 'Choi'],
  ['Vincent', 'Swanson'],
  ['Paul', 'Richards'],
  ['Jamari', 'Salazar'],
  ['Kasen', 'Espinoza'],
  ['Santiago', 'Gallegos'],
  ['Ada', 'Mayer'],
  ['Tess', 'Terrell'],
  ['Wayne', 'Oneal'],
  ['Mireya', 'Ward'],
  ['Jasmin', 'Dodson'],
  ['Preston', 'Herman'],
  ['Trent', 'Marquez'],
  ['Semaj', 'Mooney'],
  ['Jairo', 'Colon'],
  ['Orlando', 'Bray'],
  ['Jalen', 'Klein'],
  ['Kamari', 'Woodard'],
  ['Dallas', 'Mccormick'],
  ['Hazel', 'Murphy'],
  ['Dakota', 'Becker'],
  ['Kadyn', 'Herrera'],
  ['Julissa', 'Walton'],
  ['Jorden', 'Manning'],
  ['Autumn', 'Joyce'],
  ['Madalyn', 'Davenport'],
  ['Derick', 'Allison'],
  ['Zaria', 'Hensley'],
  ['King', 'Gomez'],
  ['Kamora', 'Francis'],
  ['Kenneth', 'Mcintyre'],
  ['Alisa', 'Wong'],
  ['Lilah', 'Sandoval'],
  ['Gillian', 'Hutchinson'],
  ['Thaddeus', 'Garner'],
  ['Ashley', 'Stuart'],
  ['Selah', 'Velazquez'],
  ['Kaylee', 'Tanner'],
  ['Ayla', 'Farley'],
  ['Demetrius', 'Shea'],
  ['Kole', 'Costa'],
  ['Milo', 'Kline'],
  ['Kayla', 'Collins'],
  ['Hugh', 'Vargas'],
  ['Kingston', 'Juarez'],
  ['Logan', 'Cooke'],
  ['Jordan', 'Cervantes'],
  ['Lexi', 'Cummings'],
  ['Alex', 'Duncan'],
  ['Alejandro', 'Blackwell'],
  ['Amy', 'Moore'],
  ['James', 'Hobbs'],
  ['Victor', 'Mcconnell'],
  ['Madden', 'Frazier'],
  ['Zachary', 'Page'],
  ['Kobe', 'Kerr'],
  ['Ethan', 'Melton'],
  ['Amari', 'Lutz'],
  ['Aisha', 'Hinton'],
  ['Caitlyn', 'Burns'],
  ['Declan', 'Yang'],
  ['Colton', 'Vega'],
  ['Kathleen', 'Brooks'],
  ['Akira', 'Woodard'],
  ['America', 'Mccall'],
  ['Hailey', 'Donovan'],
  ['Cesar', 'Melendez'],
  ['Miah', 'Hood'],
  ['Fabian', 'Lawson'],
  ['Tristian', 'Estes'],
  ['Izabella', 'Lane'],
  ['Gordon', 'Aguilar'],
];

const sayings = [
  "don't have the bandwidth",
  'apples to oranges',
  'The reward for good work is more work.',
  'Rightsizing',
  'Drop the ball',
  'It is what it is',
  'the scenery only changes for the lead dog',
  'Robust',
  'seamless integration',
  'beat a dead horse',
  'integrated approach',
  'Eco-anything',
  'its 4th and long',
  "it's on my radar screen",
  'Downsizing',
  'thrown under the bus',
  "bird's eye view",
  'team player',
  'ballpark figure',
  'viral',
  'Too many cooks in the kitchen',
  'offline',
  'Synergy',
  "make sure we're on the same page",
  'Putting lipstick on a pig',
  'value-added proposition',
  "Let's not rock the boat",
  "the ball's in your court",
  'Scalable',
  'soup to nuts',
  'Web 2.0',
  'barking up the wrong tree',
  'Take it to the Next Level',
  'client-centered',
  'Brings a lot of value to the table',
  'A Plus for all Stakeholders',
  'Resonate',
  'the 800 pound elephant/gorilla',
  'Spending more time with my family',
  'between a rock and a hard place',
  'Paradigm Shift',
  'Six Sigma',
  'benchmark',
  'Strike while the iron is hot',
  'raise the bar',
  "Let's get granular",
  'Impactful',
  'low-hanging fruit',
  'Boots on the ground',
];
