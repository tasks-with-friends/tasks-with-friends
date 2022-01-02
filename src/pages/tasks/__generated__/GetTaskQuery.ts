/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TaskStatus } from "./../../../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: GetTaskQuery
// ====================================================

export interface GetTaskQuery_task_participants_nodes_user {
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

export interface GetTaskQuery_task_participants_nodes {
  __typename: "Participant";
  id: string;
  user: GetTaskQuery_task_participants_nodes_user;
}

export interface GetTaskQuery_task_participants {
  __typename: "ParticipantConnection";
  nodes: GetTaskQuery_task_participants_nodes[];
}

export interface GetTaskQuery_task {
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
  /**
   * The estimated amount of time that this task will take. This helps users prioritize their tasks.
   */
  durationMinutes: number;
  /**
   * The number of participants needed to get started (not included the owner).
   */
  groupSize: number;
  status: TaskStatus;
  /**
   * The users who have been added to the task.
   */
  participants: GetTaskQuery_task_participants;
}

export interface GetTaskQuery {
  task: GetTaskQuery_task | null;
}

export interface GetTaskQueryVariables {
  id: string;
}
