import { CursorProvider } from './cursor-provider';
import { Page, Pagination } from './utils';

export interface InvitationService extends CursorProvider<Invitation> {
  getIncomingInvitations(page?: Pagination): Promise<Page<Invitation>>;
  getOutgoingInvitations(page?: Pagination): Promise<Page<Invitation>>;
  createInvitation(invitation: NewInvitation): Promise<Invitation>;
  removeInvitation(id: string): Promise<Invitation | undefined>;
  acceptInvitation(id: string): Promise<{ fromUserId: string } | undefined>;
}

export type Invitation = {
  id: string;
  fromUserId: string;
  invitedEmail: string;
};

export type NewInvitation = Omit<Invitation, 'id' | 'fromUserId'>;
