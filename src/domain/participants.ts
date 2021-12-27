import { CursorProvider } from './cursor-provider';
import { Page, Pagination } from './utils';

export interface ParticipantService extends CursorProvider<Participant> {
  getParticipants(ids: string[]): Promise<Participant[]>;
  getParticipantsByTask(
    taskId: string,
    page?: Pagination,
  ): Promise<Page<Participant>>;
  setResponse(id: string, response: ParticipantResponse): Promise<Participant>;
  clearResponse(id: string): Promise<Participant>;
}

export type Participant = {
  id: string;
  userId: string;
  taskId: string;
  response?: ParticipantResponse;
};

export type ParticipantResponse = 'yes' | 'no';
