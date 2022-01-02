/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { InviteFriendInput } from "./../../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InviteFriendMutation
// ====================================================

export interface InviteFriendMutation_inviteFriend_invitation {
  __typename: "Invitation";
  id: string;
  /**
   * The email address of the friend to add
   */
  invitedEmail: string;
}

export interface InviteFriendMutation_inviteFriend {
  __typename: "InviteFriendPayload";
  invitation: InviteFriendMutation_inviteFriend_invitation;
}

export interface InviteFriendMutation {
  inviteFriend: InviteFriendMutation_inviteFriend;
}

export interface InviteFriendMutationVariables {
  input: InviteFriendInput;
}
