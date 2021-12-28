import { CursorProvider } from './cursor-provider';
import { Page, Pagination } from './utils';

export interface ParticipantService extends CursorProvider<Participant> {
  getParticipants(ids: string[]): Promise<Participant[]>;
  getParticipantsByTask(
    taskId: string,
    page?: Pagination,
  ): Promise<Page<Participant>>;
  getParticipantsByUser(
    userId: string,
    page?: Pagination,
  ): Promise<Page<Participant>>;
  setResponse(
    id: string,
    response: ParticipantResponse,
  ): Promise<Participant | undefined>;
  clearResponse(id: string): Promise<Participant | undefined>;
}

export type Participant = {
  id: string;
  userId: string;
  taskId: string;
  response?: ParticipantResponse;
};

export type ParticipantResponse = 'yes' | 'no';
