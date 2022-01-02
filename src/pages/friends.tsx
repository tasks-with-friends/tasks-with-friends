/* This example requires Tailwind CSS v2.0+ */
import { gql, useMutation, useQuery } from '@apollo/client';
import { PaperAirplaneIcon, MailIcon } from '@heroicons/react/outline';
import React, { useCallback, useState } from 'react';

import { Page } from '../templates/page';
import { ConfirmationModal } from './confirmation-modal';
import {
  GetFriendsQuery,
  GetFriendsQuery_outgoingInvitations_nodes as OutgoingInvitation,
} from './__generated__/GetFriendsQuery';
import {
  InviteFriendMutation,
  InviteFriendMutationVariables,
} from './__generated__/InviteFriendMutation';
import {
  RemoveInvitationMutation,
  RemoveInvitationMutationVariables,
} from './__generated__/RemoveInvitationMutation';

const GET_FRIENDS = gql`
  query GetFriendsQuery {
    outgoingInvitations {
      nodes {
        id
        invitedEmail
      }
    }
    friends {
      nodes {
        id
        name
        email
        avatarUrl
        status
      }
    }
  }
`;

const INVITE_FRIEND = gql`
  mutation InviteFriendMutation($input: InviteFriendInput!) {
    inviteFriend(input: $input) {
      invitation {
        id
        invitedEmail
      }
    }
  }
`;

const REMOVE_INVITATION = gql`
  mutation RemoveInvitationMutation($input: RemoveInviteInput!) {
    removeInvite(input: $input) {
      success
    }
  }
`;

const InviteFriendButton: React.VFC<{ className?: string }> = ({
  className,
}) => {
  const [inviteFriend, { data, loading, error }] = useMutation<
    InviteFriendMutation,
    InviteFriendMutationVariables
  >(INVITE_FRIEND);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const email = String(formData.get('email'));

      if (email) {
        inviteFriend({
          refetchQueries: [
            {
              query: GET_FRIENDS,
            },
          ],
          awaitRefetchQueries: true,
          variables: { input: { email } },
        }).then(() => {
          const el = document.getElementById('email');
          if (el) (el as any).value = '';
        });
      }

      e.preventDefault();
      return false;
    },
    [inviteFriend],
  );

  return (
    <form
      className={`mt-1 flex rounded-md shadow-sm sm:max-w-md ${
        !!className ? className : ''
      }`}
      onSubmit={handleSubmit}
    >
      <div className="relative flex items-stretch flex-grow focus-within:z-10">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MailIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="email"
          name="email"
          id="email"
          disabled={loading}
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-gray-300 border"
          placeholder="email address"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PaperAirplaneIcon
          className="h-5 w-5 text-gray-400"
          aria-hidden="true"
        />
        <span>{loading ? 'Sending ...' : 'Invite'}</span>
      </button>
    </form>
  );
};

const OutgoingInvitationItem: React.VFC<{
  invitation: OutgoingInvitation;
}> = ({ invitation }) => {
  const [removeInvitation, { loading: removing }] = useMutation<
    RemoveInvitationMutation,
    RemoveInvitationMutationVariables
  >(REMOVE_INVITATION);

  const [isOpen, setIsOpen] = useState(false);

  const handleClick = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    removeInvitation({
      update: (cache) => {
        if (invitation) {
          cache.evict({
            id: cache.identify(invitation as any),
          });
          cache.gc();
        }
      },
      variables: { input: { id: invitation.id } },
    });
  }, [removeInvitation, invitation]);
  return (
    <>
      <li key={invitation.id} className="py-4 px-2">
        <div className="flex items-center space-x-4">
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm text-gray-500 truncate">
              {invitation.invitedEmail}
            </p>
          </div>
          <div>
            <button
              onClick={handleClick}
              disabled={removing}
              type="button"
              className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
            >
              {removing ? 'Removing ...' : 'Remove'}
            </button>
          </div>
        </div>
      </li>

      <ConfirmationModal
        title="Remove invitation"
        primaryButtonText="Remove"
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onConfirm={handleDelete}
      >
        Are you sure you want to delete this task? It will be permanently
        removed. This action cannot be undone.
      </ConfirmationModal>
    </>
  );
};

const InvitationList: React.VFC<{
  invitations?: OutgoingInvitation[] | null;
}> = ({ invitations }) => {
  return Array.isArray(invitations) ? (
    <div className="flow-root mt-6">
      <ul role="list" className="-my-5 divide-y divide-gray-200">
        {invitations.map((invitation) => (
          <OutgoingInvitationItem invitation={invitation} />
        ))}
      </ul>
    </div>
  ) : null;
};

export const FriendsGuts: React.VFC = () => {
  const { data, loading, error } = useQuery<GetFriendsQuery>(GET_FRIENDS);

  if (loading) return <>Loading...</>;
  if (error) return <>Error loading.</>;

  if (!data?.friends?.nodes?.length) {
    return (
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 mt-12 md:mt-24 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No one's here (yet)
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by inviting a friend.
        </p>
        <div className="my-12 mx-auto sm:max-w-md">
          <InviteFriendButton />
        </div>
        <InvitationList invitations={data?.outgoingInvitations?.nodes} />
      </div>
    );
  }

  return (
    <div>
      <InvitationList invitations={data?.outgoingInvitations?.nodes} />
      <div className="flow-root mt-6">
        <ul role="list" className="-my-5 divide-y divide-gray-200">
          {data.friends.nodes.map((person) => (
            <li key={person.id} className="py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img
                    className="h-8 w-8 rounded-full"
                    src={person.avatarUrl || ''}
                    alt=""
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {person.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {person.email}
                  </p>
                </div>
                <div>
                  <a
                    href="#"
                    className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Remove
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="my-12 mx-auto sm:max-w-md">
        <InviteFriendButton />
      </div>
    </div>
  );
};

export const Friends: React.VFC = () => {
  return (
    <Page title="Friends">
      <FriendsGuts />
    </Page>
  );
};
