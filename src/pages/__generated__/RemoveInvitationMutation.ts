/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { RemoveInviteInput } from "./../../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: RemoveInvitationMutation
// ====================================================

export interface RemoveInvitationMutation_removeInvite {
  __typename: "RemoveInvitePayload";
  success: boolean | null;
}

export interface RemoveInvitationMutation {
  removeInvite: RemoveInvitationMutation_removeInvite;
}

export interface RemoveInvitationMutationVariables {
  input: RemoveInviteInput;
}
