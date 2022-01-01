/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { TaskStatus } from "./../../../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: GetTaskQuery
// ====================================================

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
}

export interface GetTaskQuery {
  task: GetTaskQuery_task | null;
}

export interface GetTaskQueryVariables {
  id: string;
}
