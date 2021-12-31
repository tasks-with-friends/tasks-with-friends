/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TaskStatus } from "./../../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: GetTasks
// ====================================================

export interface GetTasks_tasks_nodes {
  __typename: "Task";
  id: string;
  /**
   * A short name of the task.
   */
  name: string;
  status: TaskStatus;
}

export interface GetTasks_tasks {
  __typename: "TaskConnection";
  nodes: GetTasks_tasks_nodes[];
}

export interface GetTasks {
  /**
   * Tasks accessible by the currrent user
   */
  tasks: GetTasks_tasks;
}
