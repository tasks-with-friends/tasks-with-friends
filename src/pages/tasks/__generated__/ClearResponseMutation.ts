/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ClearResponseInput, ParticipantResponse } from "./../../../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: ClearResponseMutation
// ====================================================

export interface ClearResponseMutation_clearResponse_participant {
  __typename: "Participant";
  id: string;
  response: ParticipantResponse | null;
}

export interface ClearResponseMutation_clearResponse {
  __typename: "ClearResponsePayload";
  participant: ClearResponseMutation_clearResponse_participant;
}

export interface ClearResponseMutation {
  clearResponse: ClearResponseMutation_clearResponse;
}

export interface ClearResponseMutationVariables {
  input: ClearResponseInput;
}
