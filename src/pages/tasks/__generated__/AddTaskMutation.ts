/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: AddTaskMutation
// ====================================================

export interface AddTaskMutation_addTask_task {
  __typename: "Task";
  id: string;
}

export interface AddTaskMutation_addTask {
  __typename: "AddTaskPayload";
  task: AddTaskMutation_addTask_task;
}

export interface AddTaskMutation {
  addTask: AddTaskMutation_addTask;
}

export interface AddTaskMutationVariables {
  name: string;
  description?: string | null;
  durationMinutes: number;
  groupSize: number;
}
