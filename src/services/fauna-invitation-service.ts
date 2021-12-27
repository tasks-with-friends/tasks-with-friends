import { Client, query as q } from 'faunadb';

import { Invitation, InvitationService, NewInvitation } from '../domain';
import { Pagination, Page } from '../domain/utils';
import { BaseFaunaService, FaunaResponse } from './base-fauna-service';

export class FaunaInvitationService
  extends BaseFaunaService<Invitation>
  implements InvitationService
{
  constructor(
    private readonly fauna: Client,
    private readonly currentUserId: string,
    private readonly currentUserEmail: string,
  ) {
    super('invitations', 25);
  }

  getCursor(obj: Invitation | null | undefined): string {
    return obj?.id || '';
  }

  createInvitation(invitation: NewInvitation): Promise<Invitation> {
    return this.fauna.query<Invitation>(
      q.Let(
        {
          invidationDoc: q.Create(q.Collection('invitations'), {
            data: {
              fromUser: q.Ref(q.Collection('users'), this.currentUserId),
              invitedEmail: invitation.invitedEmail,
            },
          }),
        },
        {
          id: q.Select(['ref', 'id'], q.Var('invidationDoc')),
          fromUserId: q.Select(
            ['data', 'fromUser', 'id'],
            q.Var('invidationDoc'),
          ),
          invitedEmail: q.Select(
            ['data', 'invitedEmail'],
            q.Var('invidationDoc'),
          ),
        },
      ),
    );
  }

  async getIncomingInvitations(page?: Pagination): Promise<Page<Invitation>> {
    const pagingExpr = this.pagingExpr(page);

    const response = await this.fauna.query<FaunaResponse<Invitation>>(
      q.Let(
        {
          res: q.Paginate(
            q.Match(
              q.Index('invitations_by_invitedEmail'),
              this.currentUserEmail,
            ),
            pagingExpr,
          ),
        },
        {
          before: q.Select(['before', 0, 'id'], q.Var('res'), ''),
          after: q.Select(['after', 0, 'id'], q.Var('res'), ''),
          take: pagingExpr.size,
          data: q.Map(
            q.Select(['data'], q.Var('res')),
            q.Lambda('doc', {
              id: q.Select([0, 'id'], q.Var('doc')),
              invitedEmail: q.Select([1], q.Var('doc')),
              fromUserId: q.Select([2, 'id'], q.Var('doc')),
            }),
          ),
        },
      ),
    );

    return this.toPage(page, response);
  }

  async getOutgoingInvitations(page?: Pagination): Promise<Page<Invitation>> {
    const pagingExpr = this.pagingExpr(page);

    const response = await this.fauna.query<FaunaResponse<Invitation>>(
      q.Let(
        {
          res: q.Paginate(
            q.Match(
              q.Index('invitations_by_fromUser'),
              q.Ref(q.Collection('users'), this.currentUserId),
            ),
            pagingExpr,
          ),
        },
        {
          before: q.Select(['before', 0, 'id'], q.Var('res'), ''),
          after: q.Select(['after', 0, 'id'], q.Var('res'), ''),
          take: pagingExpr.size,
          data: q.Map(
            q.Select(['data'], q.Var('res')),

            q.Lambda('doc', {
              id: q.Select([0, 'id'], q.Var('doc')),
              invitedEmail: q.Select([1], q.Var('doc')),
              fromUserId: q.Select([2, 'id'], q.Var('doc')),
            }),
          ),
        },
      ),
    );

    return this.toPage(page, response);
  }

  async removeInvitation(id: string): Promise<Invitation | undefined> {
    try {
      const result = await this.fauna.query<Invitation[]>(
        q.Let(
          {
            doc: q.Get(q.Ref(q.Collection('invitations'), id)),
          },
          q.If(
            q.Or(
              q.Equals(
                q.Select(['data', 'invitedEmail'], q.Var('doc')),
                this.currentUserEmail,
              ),
              q.Equals(
                q.Select(['data', 'fromUser', 'id'], q.Var('doc')),
                this.currentUserId,
              ),
            ),
            [
              q.Let(
                { deleted: q.Delete(q.Select('ref', q.Var('doc'))) },
                {
                  id: q.Select(['ref', 'id'], q.Var('deleted')),
                  fromUserId: q.Select(
                    ['data', 'fromUser', 'id'],
                    q.Var('deleted'),
                  ),
                  invitedEmail: q.Select(
                    ['data', 'invitedEmail'],
                    q.Var('deleted'),
                  ),
                },
              ),
            ],
            [],
          ),
        ),
      );

      return result[0];
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }

  async acceptInvitation(
    id: string,
  ): Promise<{ fromUserId: string } | undefined> {
    try {
      const invitation = (
        await this.fauna.query<Invitation[]>(
          q.Let(
            {
              doc: q.Get(q.Ref(q.Collection('invitations'), id)),
            },
            q.If(
              q.Equals(
                q.Select(['data', 'invitedEmail'], q.Var('doc')),
                this.currentUserEmail,
              ),
              [
                q.Let(
                  { deleted: q.Delete(q.Select('ref', q.Var('doc'))) },
                  {
                    id: q.Select(['ref', 'id'], q.Var('deleted')),
                    fromUserId: q.Select(
                      ['data', 'fromUser', 'id'],
                      q.Var('deleted'),
                    ),
                    invitedEmail: q.Select(
                      ['data', 'invitedEmail'],
                      q.Var('deleted'),
                    ),
                  },
                ),
              ],
              [],
            ),
          ),
        )
      )[0];

      return invitation ? { fromUserId: invitation.fromUserId } : undefined;
    } catch {
      return undefined;
    }
  }
}
