/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetDashboardQuery
// ====================================================

export interface GetDashboardQuery_incomingInvitations_nodes_from {
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
}

export interface GetDashboardQuery_incomingInvitations_nodes {
  __typename: "Invitation";
  id: string;
  /**
   * The user who sent the invitation
   */
  from: GetDashboardQuery_incomingInvitations_nodes_from;
}

export interface GetDashboardQuery_incomingInvitations {
  __typename: "InvitationConnection";
  nodes: GetDashboardQuery_incomingInvitations_nodes[];
}

export interface GetDashboardQuery {
  /**
   * Invitations the current user has received from others.
   * When the current user accepts the invitation, they and the other user
   * will be see each other in their friend lists.
   */
  incomingInvitations: GetDashboardQuery_incomingInvitations;
}
