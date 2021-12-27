import { Client } from 'faunadb';

import { Invitation } from '../domain';
import { Page } from '../domain/utils';
import { FaunaInvitationService } from './fauna-invitation-service';
import { FaunaUtils } from './fauna-utils';

let client: Client;
describe.skip('fauna-invitation-service', () => {
  beforeAll(async () => {
    client = new Client({
      secret: process.env.FAUNA_DB_SECRET_TEST || '',
      domain: process.env.FAUNA_DB_DOMAIN || '',
      scheme: 'https',
    });

    const db = new FaunaUtils(client);
    await db.clearAll();
    await db.provision();
  });

  afterEach(async () => {
    const db = new FaunaUtils(client);
    await db.clearAll();
  });

  describe('createInvitation', () => {
    it('works', async () => {
      // ARRANGE
      const service = new FaunaInvitationService(
        client,
        '1234567890',
        'test@example.com',
      );

      // ACT
      const result = await service.createInvitation({
        invitedEmail: 'test2@example.com',
      });

      console.log({ result });
    });
  });

  describe('getIncomingInvitations', () => {
    const myEmail = 'test@example.com';
    let invitations: Invitation[] = [];

    describe('when there is only one data', () => {
      beforeEach(async () => {
        const a = await new FaunaInvitationService(
          client,
          '101',
          'email101@example.com',
        ).createInvitation({ invitedEmail: myEmail });

        invitations = [a];
      });

      describe('when neither after nor before are passed', () => {
        it('works without before or after', async () => {
          // ARRANGE
          const [a] = invitations;
          const service = new FaunaInvitationService(client, '999', myEmail);

          // ACT
          const result = await service.getIncomingInvitations({ take: 1 });

          // ASSERT
          expect(result).toEqual<Page<Invitation>>({
            items: [a],
            hasPreviousPage: false,
            startCursor: service.getCursor(a),
            endCursor: service.getCursor(a),
            hasNextPage: false,
          });
        });
      });
    });

    describe('where there is data', () => {
      beforeEach(async () => {
        const a = await new FaunaInvitationService(
          client,
          '101',
          'email101@example.com',
        ).createInvitation({ invitedEmail: myEmail });
        const b = await new FaunaInvitationService(
          client,
          '102',
          'email102@example.com',
        ).createInvitation({ invitedEmail: myEmail });
        const c = await new FaunaInvitationService(
          client,
          '103',
          'email103@example.com',
        ).createInvitation({ invitedEmail: myEmail });
        const d = await new FaunaInvitationService(
          client,
          '104',
          'email104@example.com',
        ).createInvitation({ invitedEmail: myEmail });
        const e = await new FaunaInvitationService(
          client,
          '104',
          'email104@example.com',
        ).createInvitation({ invitedEmail: myEmail });

        invitations = [a, b, c, d, e];
      });

      describe('when neither after nor before are passed', () => {
        it('works without before or after', async () => {
          // ARRANGE
          const [a, b, c, d, e] = invitations;
          const service = new FaunaInvitationService(client, '999', myEmail);

          // ACT
          const result = await service.getIncomingInvitations({ take: 3 });

          // ASSERT
          expect(result).toEqual<Page<Invitation>>({
            items: [a, b, c],
            hasPreviousPage: false,
            startCursor: service.getCursor(a),
            endCursor: service.getCursor(c),
            hasNextPage: true,
          });
        });
      });

      describe('when after is passed', () => {
        it('works when there are more results', async () => {
          // ARRANGE
          const [a, b, c, d, e] = invitations;
          const service = new FaunaInvitationService(client, '999', myEmail);

          // ACT
          const result = await service.getIncomingInvitations({
            take: 2,
            after: service.getCursor(b),
          });

          // ASSERT
          expect(result).toEqual<Page<Invitation>>({
            items: [c, d],
            hasPreviousPage: true,
            startCursor: service.getCursor(c),
            endCursor: service.getCursor(d),
            hasNextPage: true,
          });
        });

        it('works when there are NOT more results', async () => {
          // ARRANGE
          const [a, b, c, d, e] = invitations;
          const service = new FaunaInvitationService(client, '999', myEmail);

          // ACT
          const result = await service.getIncomingInvitations({
            take: 2,
            after: service.getCursor(c),
          });

          // ASSERT
          expect(result).toEqual<Page<Invitation>>({
            items: [d, e],
            hasPreviousPage: true,
            startCursor: service.getCursor(d),
            endCursor: service.getCursor(e),
            hasNextPage: false,
          });
        });

        it('works when there is NOT a full page and there are NOT more results', async () => {
          // ARRANGE
          const [a, b, c, d, e] = invitations;
          const service = new FaunaInvitationService(client, '999', myEmail);

          // ACT
          const result = await service.getIncomingInvitations({
            take: 3,
            after: service.getCursor(c),
          });

          // ASSERT
          expect(result).toEqual<Page<Invitation>>({
            items: [d, e],
            hasPreviousPage: true,
            startCursor: service.getCursor(d),
            endCursor: service.getCursor(e),
            hasNextPage: false,
          });
        });

        it('works when paging past the last item', async () => {
          // ARRANGE
          const [a, b, c, d, e] = invitations;
          const service = new FaunaInvitationService(client, '999', myEmail);

          // ACT
          const result = await service.getIncomingInvitations({
            take: 2,
            after: service.getCursor(e),
          });

          // ASSERT
          expect(result).toEqual<Page<Invitation>>({
            items: [],
            hasPreviousPage: true,
            startCursor: '',
            endCursor: '',
            hasNextPage: false,
          });
        });
      });

      describe('when before is passed', () => {
        it('works when there are more results', async () => {
          // ARRANGE
          const [a, b, c, d, e] = invitations;

          const service = new FaunaInvitationService(client, '999', myEmail);

          // ACT
          const result = await service.getIncomingInvitations({
            take: 2,
            before: service.getCursor(d),
          });

          // ASSERT
          expect(result).toEqual<Page<Invitation>>({
            items: [b, c],
            hasPreviousPage: true,
            startCursor: service.getCursor(b),
            endCursor: service.getCursor(c),
            hasNextPage: true,
          });
        });

        it('works when there are NOT more results', async () => {
          // ARRANGE
          const [a, b, c, d, e] = invitations;
          const service = new FaunaInvitationService(client, '999', myEmail);

          // ACT
          const result = await service.getIncomingInvitations({
            take: 2,
            before: service.getCursor(c),
          });

          // ASSERT
          expect(result).toEqual<Page<Invitation>>({
            items: [a, b],
            hasPreviousPage: true,
            startCursor: service.getCursor(a),
            endCursor: service.getCursor(b),
            hasNextPage: false,
          });
        });

        it('works when there is NOT a full page and there are NOT more results', async () => {
          // ARRANGE
          const [a, b, c, d, e] = invitations;
          const service = new FaunaInvitationService(client, '999', myEmail);

          // ACT
          const result = await service.getIncomingInvitations({
            take: 3,
            before: service.getCursor(c),
          });

          // ASSERT
          expect(result).toEqual<Page<Invitation>>({
            items: [a, b],
            hasPreviousPage: true,
            startCursor: service.getCursor(a),
            endCursor: service.getCursor(b),
            hasNextPage: false,
          });
        });

        it('works when paging past the first item', async () => {
          // ARRANGE
          const [a, b, c, d, e] = invitations;
          const service = new FaunaInvitationService(client, '999', myEmail);

          // ACT
          const result = await service.getIncomingInvitations({
            take: 2,
            before: service.getCursor(a),
          });

          // ASSERT
          expect(result).toEqual<Page<Invitation>>({
            items: [],
            hasPreviousPage: true,
            startCursor: '',
            endCursor: '',
            hasNextPage: false,
          });
        });
      });
    });

    describe('where there is no data', () => {
      beforeEach(() => (invitations = []));

      it('returns an empty page', async () => {
        // ARRANGE
        const service = new FaunaInvitationService(client, '999', myEmail);

        // ACT
        const result = await service.getIncomingInvitations({
          take: 2,
        });

        // ASSERT
        expect(result).toEqual<Page<Invitation>>({
          items: [],
          hasPreviousPage: false,
          startCursor: '',
          endCursor: '',
          hasNextPage: false,
        });
      });
    });
  });

  describe('removeInvitation', () => {
    it('does not remove an invitation that is not from or to the current user', async () => {
      // ARRANGE
      const me = new FaunaInvitationService(client, '123', 'me@test.com');
      const them = new FaunaInvitationService(client, '456', 'them@test.com');
      const invitation = await them.createInvitation({
        invitedEmail: 'someone@test.com',
      });

      // ACT
      const result = await me.removeInvitation(invitation.id);
      const { items } = await them.getOutgoingInvitations({ take: 1 });

      // ASSERT
      expect(result).toBeUndefined();
      expect(items).toEqual([invitation]);
    });

    it('removes an invitation for the current user', async () => {
      // ARRANGE
      const me = new FaunaInvitationService(client, '123', 'me@test.com');
      const them = new FaunaInvitationService(client, '456', 'them@test.com');
      const invitation = await them.createInvitation({
        invitedEmail: 'me@test.com',
      });

      // ACT
      const result = await me.removeInvitation(invitation.id);
      const { items } = await them.getOutgoingInvitations({ take: 1 });

      // ASSERT
      expect(result).toEqual(invitation);
      expect(items).toEqual([]);
    });

    it('removes an invitation from the current user', async () => {
      // ARRANGE
      const me = new FaunaInvitationService(client, '123', 'me@test.com');
      const them = new FaunaInvitationService(client, '456', 'them@test.com');
      const invitation = await me.createInvitation({
        invitedEmail: 'them@test.com',
      });

      // ACT
      const result = await me.removeInvitation(invitation.id);
      const { items } = await them.getIncomingInvitations({ take: 1 });

      // ASSERT
      expect(result).toEqual(invitation);
      expect(items).toEqual([]);
    });
  });

  describe('acceptInvitation', () => {
    it('does not accept an invitation that is not to the current user', async () => {
      // ARRANGE
      const me = new FaunaInvitationService(client, '123', 'me@test.com');
      const them = new FaunaInvitationService(client, '456', 'them@test.com');
      const invitation = await them.createInvitation({
        invitedEmail: 'someone@test.com',
      });

      // ACT
      const result = await me.acceptInvitation(invitation.id);
      const { items } = await them.getOutgoingInvitations({ take: 1 });

      // ASSERT
      expect(result).toBeUndefined();
      expect(items).toEqual([invitation]);
    });

    it('does not accept an invitation from the current user', async () => {
      // ARRANGE
      const me = new FaunaInvitationService(client, '123', 'me@test.com');
      const them = new FaunaInvitationService(client, '456', 'them@test.com');
      const invitation = await me.createInvitation({
        invitedEmail: 'them@test.com',
      });

      // ACT
      const result = await me.acceptInvitation(invitation.id);
      const { items } = await them.getIncomingInvitations({ take: 1 });

      // ASSERT
      expect(result).toBeUndefined();
      expect(items).toEqual([invitation]);
    });

    it('accepts an invitation for the current user', async () => {
      // ARRANGE
      const me = new FaunaInvitationService(client, '123', 'me@test.com');
      const them = new FaunaInvitationService(client, '456', 'them@test.com');
      const invitation = await them.createInvitation({
        invitedEmail: 'me@test.com',
      });

      // ACT
      const result = await me.acceptInvitation(invitation.id);
      const { items } = await them.getOutgoingInvitations({ take: 1 });

      // ASSERT
      expect(result).toEqual({ fromUserId: invitation.fromUserId });
      expect(items).toEqual([]);
    });
  });
});
