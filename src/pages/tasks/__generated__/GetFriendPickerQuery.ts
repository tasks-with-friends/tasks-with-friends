/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UserStatus } from "./../../../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: GetFriendPickerQuery
// ====================================================

export interface GetFriendPickerQuery_friends_nodes {
  __typename: "User";
  /**
   * The unique ID for this user
   */
  id: string;
  /**
   * The display name
   */
  name: string;
  /**
   * The email address
   */
  email: string;
  /**
   * The avatar URL
   */
  avatarUrl: string | null;
  /**
   * User status
   */
  status: UserStatus;
}

export interface GetFriendPickerQuery_friends {
  __typename: "UserConnection";
  nodes: GetFriendPickerQuery_friends_nodes[];
}

export interface GetFriendPickerQuery {
  /**
   * The friends of the currently logged in user.
   */
  friends: GetFriendPickerQuery_friends;
}
