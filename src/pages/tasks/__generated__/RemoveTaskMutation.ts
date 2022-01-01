/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { RemoveTaskInput } from "./../../../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: RemoveTaskMutation
// ====================================================

export interface RemoveTaskMutation_removeTask_task {
  __typename: "Task";
  id: string;
}

export interface RemoveTaskMutation_removeTask {
  __typename: "RemoveTaskPayload";
  task: RemoveTaskMutation_removeTask_task;
}

export interface RemoveTaskMutation {
  removeTask: RemoveTaskMutation_removeTask;
}

export interface RemoveTaskMutationVariables {
  input: RemoveTaskInput;
}
