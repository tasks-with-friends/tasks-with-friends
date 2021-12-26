import { Page, Pagination } from './utils';

export interface InvitationService {
  getIncomingInvitations(page?: Pagination): Promise<Page<Invitation>>;
  getOutgoingInvitations(page?: Pagination): Promise<Page<Invitation>>;
  createInvitation(invitation: NewInvitation): Promise<Invitation>;
}

export type Invitation = {
  id: string;
  fromUserId: string;
  invitedEmail: string;
};

export type NewInvitation = Omit<Invitation, 'id' | 'fromUserId'>;
