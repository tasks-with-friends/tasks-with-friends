/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UserStatus } from "./../../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: GetFriendsPageQuery
// ====================================================

export interface GetFriendsPageQuery_outgoingInvitations_nodes {
  __typename: "Invitation";
  id: string;
  /**
   * The email address of the friend to add
   */
  invitedEmail: string;
}

export interface GetFriendsPageQuery_outgoingInvitations {
  __typename: "InvitationConnection";
  nodes: GetFriendsPageQuery_outgoingInvitations_nodes[];
}

export interface GetFriendsPageQuery_friends_nodes {
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

export interface GetFriendsPageQuery_friends {
  __typename: "UserConnection";
  nodes: GetFriendsPageQuery_friends_nodes[];
}

export interface GetFriendsPageQuery {
  /**
   * Invitations the current user has sent to others.
   * When the other user accepts the invitation, they and the current user
   * will be see each other in their friend lists.
   */
  outgoingInvitations: GetFriendsPageQuery_outgoingInvitations;
  /**
   * The friends of the currently logged in user.
   */
  friends: GetFriendsPageQuery_friends;
}