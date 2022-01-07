/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TaskStatus, ParticipantResponse } from "./../../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: GetDashboardQuery
// ====================================================

export interface GetDashboardQuery_tasks_nodes_owner {
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
   * The avatar URL
   */
  avatarUrl: string | null;
}

export interface GetDashboardQuery_tasks_nodes_participants_nodes_user {
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
   * The avatar URL
   */
  avatarUrl: string | null;
}

export interface GetDashboardQuery_tasks_nodes_participants_nodes {
  __typename: "Participant";
  id: string;
  response: ParticipantResponse | null;
  user: GetDashboardQuery_tasks_nodes_participants_nodes_user;
}

export interface GetDashboardQuery_tasks_nodes_participants {
  __typename: "ParticipantConnection";
  nodes: GetDashboardQuery_tasks_nodes_participants_nodes[];
}

export interface GetDashboardQuery_tasks_nodes {
  __typename: "Task";
  id: string;
  /**
   * A short name of the task.
   */
  name: string;
  /**
   * An optional description or details for the task.
   */
  description: string | null;
  status: TaskStatus;
  /**
   * The estimated amount of time that this task will take. This helps users prioritize their tasks.
   */
  durationMinutes: number;
  /**
   * The number of participants needed to get started (not included the owner).
   */
  groupSize: number;
  /**
   * The user who created the task.
   */
  owner: GetDashboardQuery_tasks_nodes_owner;
  /**
   * The users who have been added to the task.
   */
  participants: GetDashboardQuery_tasks_nodes_participants;
}

export interface GetDashboardQuery_tasks {
  __typename: "TaskConnection";
  nodes: GetDashboardQuery_tasks_nodes[];
}

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
   * Tasks accessible by the currrent user
   */
  tasks: GetDashboardQuery_tasks;
  /**
   * Invitations the current user has received from others.
   * When the current user accepts the invitation, they and the other user
   * will be see each other in their friend lists.
   */
  incomingInvitations: GetDashboardQuery_incomingInvitations;
}
