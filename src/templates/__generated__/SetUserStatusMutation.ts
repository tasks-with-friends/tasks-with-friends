/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SetUserStatusInput, UserStatus } from "./../../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: SetUserStatusMutation
// ====================================================

export interface SetUserStatusMutation_setUserStatus_me {
  __typename: "User";
  /**
   * The unique ID for this user
   */
  id: string;
  /**
   * User status
   */
  status: UserStatus;
}

export interface SetUserStatusMutation_setUserStatus {
  __typename: "SetUserStatusPayload";
  me: SetUserStatusMutation_setUserStatus_me;
}

export interface SetUserStatusMutation {
  setUserStatus: SetUserStatusMutation_setUserStatus;
}

export interface SetUserStatusMutationVariables {
  input: SetUserStatusInput;
}
