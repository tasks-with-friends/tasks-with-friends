/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { UserStatus } from "./../../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: GetTemplateQuery
// ====================================================

export interface GetTemplateQuery_me {
  __typename: "User";
  /**
   * The unique ID for this user
   */
  id: string;
  /**
   * User status
   */
  status: UserStatus;
}

export interface GetTemplateQuery {
  /**
   * The currently logged in user.
   */
  me: GetTemplateQuery_me;
}
