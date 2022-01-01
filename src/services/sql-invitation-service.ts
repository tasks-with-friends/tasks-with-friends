import { Pool } from 'pg';
import {
  GetInvitationsFilter,
  Invitation,
  InvitationPage,
  InvitationService,
  NewInvitation,
} from '../domain/v1/api.g';
import { buildPage, Mapping, parsePage, using } from './utils';

export class SqlInvitationService implements InvitationService {
  constructor(
    private readonly pool: Pool,
    private readonly schema: string,
    private readonly currentUserId?: string,
  ) {}
  async createInvitation(params: {
    invitation: NewInvitation;
  }): Promise<Invitation> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    const invitation = (
      await this.pool.query<DbInvitation>(
        `INSERT INTO ${this.schema}.invitations (from_user_external_id, invited_email)
        VALUES ($1, $2)
        RETURNING external_id, from_user_external_id, invited_email`,
        [this.currentUserId, params.invitation.invitedEmail],
      )
    ).rows.map(using(dbInvitationToInvitation))[0];

    if (!invitation) throw new Error('Not Found');

    return invitation;
  }

  async getInvitations(params: {
    filter: GetInvitationsFilter;
    first?: number | undefined;
    after?: string | undefined;
    last?: number | undefined;
    before?: string | undefined;
  }): Promise<InvitationPage> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    const { filter, ...page } = params;

    const whereValue =
      filter === 'incoming'
        ? await this.getCurrentUserEmail()
        : this.currentUserId;

    const UNSANITIZED_whereField =
      filter === 'incoming' ? 'i.invited_email' : 'i.from_user_external_id';

    const { uniqueId, count, limit, direction } = parsePage(25, params);
    const orderBy = direction === 'forward' ? 'DESC' : 'ASC';
    const operator = direction === 'forward' ? '<=' : '>=';
    const sortValue = await this.getSortValue<number>('id', uniqueId);

    const items = (
      await this.pool.query<DbInvitation>(
        `SELECT i.external_id, i.from_user_external_id, i.invited_email
        FROM ${this.schema}.invitations i
        JOIN ${
          this.schema
        }.invitations u ON i.from_user_external_id = u.exteral_id
        WHERE ${UNSANITIZED_whereField} = $1
        
        ${sortValue ? `AND (u.id, u.external_id) ${operator} ($3, $4)` : ''}
        ORDER BY u.id ${orderBy}, u.external_id ${orderBy}
        limit $2`,
        sortValue
          ? [whereValue, limit, sortValue, uniqueId]
          : [whereValue, limit],
      )
    ).rows.map(using(dbInvitationToInvitation));

    return buildPage(items, count, !!sortValue, direction, (x) => x?.id || '');
  }

  async removeInvitation(params: {
    invitationId: string;
  }): Promise<Invitation> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    const currentUserEmail = await this.getCurrentUserEmail();

    const deleted = (
      await this.pool.query<DbInvitation>(
        `DELETE FROM ONLY ${this.schema}.invitations
        WHERE external_id = $1 AND (from_user_external_id = $2 OR i.invited_email = $3)
        RETURNING id, external_id, from_user_external_id, invited_email`,
        [params.invitationId, this.currentUserId, currentUserEmail],
      )
    ).rows.map(using(dbInvitationToInvitation))[0];

    if (!deleted) throw new Error('Not Found');

    return deleted;
  }

  private async getCurrentUserEmail(): Promise<string> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    const row = (
      await this.pool.query<{ email: string }>(
        `SELECT email FROM ${this.schema}.user
        WHERE external_id = $1
        LIMIT 1`,
        [this.currentUserId],
      )
    ).rows[0];

    if (!row) throw new Error('Not Found');

    return row.email;
  }

  private async getSortValue<T>(
    UNSANITIZED_field: string,
    external_id: string | undefined,
  ): Promise<T | null> {
    if (!external_id) return null;
    const row = (
      await this.pool.query(
        `SELECT ${UNSANITIZED_field} FROM ${this.schema}.invitations WHERE external_id = $1 LIMIT 1`,
        [external_id],
      )
    ).rows[0];

    return !row ? null : row[UNSANITIZED_field];
  }
}

type DbInvitation = {
  id: string;
  external_id: string;
  from_user_id: number;
  from_user_external_id: string;
  invited_email: string;
};

const dbInvitationToInvitation: Mapping<DbInvitation, Invitation> = {
  id: 'external_id',
  fromUserId: 'from_user_external_id',
  invitedEmail: 'invited_email',
};
