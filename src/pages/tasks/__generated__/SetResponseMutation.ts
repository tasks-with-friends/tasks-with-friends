/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SetResponseInput, ParticipantResponse } from "./../../../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: SetResponseMutation
// ====================================================

export interface SetResponseMutation_setResponse_participant {
  __typename: "Participant";
  id: string;
  response: ParticipantResponse | null;
}

export interface SetResponseMutation_setResponse {
  __typename: "SetResponsePayload";
  participant: SetResponseMutation_setResponse_participant;
}

export interface SetResponseMutation {
  setResponse: SetResponseMutation_setResponse;
}

export interface SetResponseMutationVariables {
  input: SetResponseInput;
}
