/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export enum ParticipantResponse {
  NO = "NO",
  YES = "YES",
}

export enum TaskStatus {
  DONE = "DONE",
  IN_PROGRESS = "IN_PROGRESS",
  READY = "READY",
  WAITING = "WAITING",
}

export enum UserStatus {
  AWAY = "AWAY",
  FLOW = "FLOW",
  IDLE = "IDLE",
}

export interface AcceptInviteInput {
  id: string;
}

export interface ClearResponseInput {
  taskId: string;
  participantId: string;
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

export interface InviteFriendInput {
  email: string;
}

export interface RejectInviteInput {
  id: string;
}

export interface RemoveFriendInput {
  userId: string;
}

export interface RemoveInviteInput {
  id: string;
}

export interface RemoveTaskInput {
  id: string;
}

export interface SetResponseInput {
  taskId: string;
  participantId: string;
  response: ParticipantResponse;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
