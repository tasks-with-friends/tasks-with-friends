/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export enum TaskStatus {
  CANCELED = "CANCELED",
  DONE = "DONE",
  IN_PROGRESS = "IN_PROGRESS",
  READY = "READY",
}

export interface EditTaskInput {
  id: string;
  description?: string | null;
  durationMinutes?: number | null;
  groupSize?: number | null;
  name?: string | null;
  status?: string | null;
  participants?: IdCollection | null;
}

export interface IdCollection {
  add?: string[] | null;
  remove?: string[] | null;
  set?: string[] | null;
}

export interface RemoveTaskInput {
  id: string;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
