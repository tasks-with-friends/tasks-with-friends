/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { RejectInviteInput } from "./../../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: RejectInvitationMutation
// ====================================================

export interface RejectInvitationMutation_rejectInvite {
  __typename: "RejectInvitePayload";
  success: boolean | null;
}

export interface RejectInvitationMutation {
  rejectInvite: RejectInvitationMutation_rejectInvite;
}

export interface RejectInvitationMutationVariables {
  input: RejectInviteInput;
}
