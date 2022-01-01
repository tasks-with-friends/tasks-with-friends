/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { EditTaskInput } from "./../../../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: EditTaskMutation
// ====================================================

export interface EditTaskMutation_editTask_task {
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
}

export interface EditTaskMutation_editTask {
  __typename: "EditTaskPayload";
  task: EditTaskMutation_editTask_task;
}

export interface EditTaskMutation {
  editTask: EditTaskMutation_editTask;
}

export interface EditTaskMutationVariables {
  input: EditTaskInput;
}
