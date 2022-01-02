/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AcceptInviteInput } from "./../../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: AcceptInvitationMutation
// ====================================================

export interface AcceptInvitationMutation_acceptInvite_friend {
  __typename: "User";
  /**
   * The unique ID for this user
   */
  id: string;
}

export interface AcceptInvitationMutation_acceptInvite {
  __typename: "AcceptInvitePayload";
  friend: AcceptInvitationMutation_acceptInvite_friend;
}

export interface AcceptInvitationMutation {
  acceptInvite: AcceptInvitationMutation_acceptInvite;
}

export interface AcceptInvitationMutationVariables {
  input: AcceptInviteInput;
}
