/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TaskStatus, ParticipantResponse } from "./../../../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: GetTasksQuery
// ====================================================

export interface GetTasksQuery_tasks_nodes_owner {
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

export interface GetTasksQuery_tasks_nodes_participants_nodes_user {
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

export interface GetTasksQuery_tasks_nodes_participants_nodes {
  __typename: "Participant";
  id: string;
  response: ParticipantResponse | null;
  user: GetTasksQuery_tasks_nodes_participants_nodes_user;
}

export interface GetTasksQuery_tasks_nodes_participants {
  __typename: "ParticipantConnection";
  nodes: GetTasksQuery_tasks_nodes_participants_nodes[];
}

export interface GetTasksQuery_tasks_nodes {
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
  owner: GetTasksQuery_tasks_nodes_owner;
  /**
   * The users who have been added to the task.
   */
  participants: GetTasksQuery_tasks_nodes_participants;
}

export interface GetTasksQuery_tasks {
  __typename: "TaskConnection";
  nodes: GetTasksQuery_tasks_nodes[];
}

export interface GetTasksQuery {
  /**
   * Tasks accessible by the currrent user
   */
  tasks: GetTasksQuery_tasks;
}
