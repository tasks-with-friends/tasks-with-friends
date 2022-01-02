/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { RemoveFriendInput } from "./../../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: RemoveFriendMutation
// ====================================================

export interface RemoveFriendMutation_removeFriend {
  __typename: "RemoveFriendPayload";
  success: boolean | null;
}

export interface RemoveFriendMutation {
  removeFriend: RemoveFriendMutation_removeFriend;
}

export interface RemoveFriendMutationVariables {
  input: RemoveFriendInput;
}
