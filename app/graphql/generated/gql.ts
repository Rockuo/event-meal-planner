/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n    mutation ChangeGroupName($groupId: ID!, $name: String!) {\n        changeGroupName(groupId: $groupId, name: $name)\n    }\n": typeof types.ChangeGroupNameDocument,
    "\n    mutation InviteUser($groupId: ID!, $email: String!) {\n        inviteUser(groupId: $groupId, email: $email)\n    }\n": typeof types.InviteUserDocument,
    "\n    mutation RevokeAccess($groupId: ID!, $userId: ID!) {\n        revokeAccess(groupId: $groupId, userId: $userId)\n    }\n": typeof types.RevokeAccessDocument,
    "\n    mutation DeleteGroup($groupId: ID!) {\n        deleteGroup(groupId: $groupId)\n    }\n": typeof types.DeleteGroupDocument,
    "\n    mutation Login($password: String!, $email: String!) {\n        login(password: $password, email: $email)\n    }\n": typeof types.LoginDocument,
    "\n    mutation Register($password: String!, $email: String!) {\n        register(password: $password, email: $email)\n    }\n": typeof types.RegisterDocument,
    "\n    mutation CreateGroup($name: String!) {\n        createGroup(name: $name)\n    }\n": typeof types.CreateGroupDocument,
    "\n    query GetGroup($uuid: ID!) {\n        group(uuid: $uuid) {\n            uuid\n            name\n            members {\n                user {\n                    uuid\n                    email\n                }\n                role\n            }\n        }\n    }\n": typeof types.GetGroupDocument,
    "\n    query RefreshCredentials {\n        refreshCredentials\n    }\n": typeof types.RefreshCredentialsDocument,
};
const documents: Documents = {
    "\n    mutation ChangeGroupName($groupId: ID!, $name: String!) {\n        changeGroupName(groupId: $groupId, name: $name)\n    }\n": types.ChangeGroupNameDocument,
    "\n    mutation InviteUser($groupId: ID!, $email: String!) {\n        inviteUser(groupId: $groupId, email: $email)\n    }\n": types.InviteUserDocument,
    "\n    mutation RevokeAccess($groupId: ID!, $userId: ID!) {\n        revokeAccess(groupId: $groupId, userId: $userId)\n    }\n": types.RevokeAccessDocument,
    "\n    mutation DeleteGroup($groupId: ID!) {\n        deleteGroup(groupId: $groupId)\n    }\n": types.DeleteGroupDocument,
    "\n    mutation Login($password: String!, $email: String!) {\n        login(password: $password, email: $email)\n    }\n": types.LoginDocument,
    "\n    mutation Register($password: String!, $email: String!) {\n        register(password: $password, email: $email)\n    }\n": types.RegisterDocument,
    "\n    mutation CreateGroup($name: String!) {\n        createGroup(name: $name)\n    }\n": types.CreateGroupDocument,
    "\n    query GetGroup($uuid: ID!) {\n        group(uuid: $uuid) {\n            uuid\n            name\n            members {\n                user {\n                    uuid\n                    email\n                }\n                role\n            }\n        }\n    }\n": types.GetGroupDocument,
    "\n    query RefreshCredentials {\n        refreshCredentials\n    }\n": types.RefreshCredentialsDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    mutation ChangeGroupName($groupId: ID!, $name: String!) {\n        changeGroupName(groupId: $groupId, name: $name)\n    }\n"): (typeof documents)["\n    mutation ChangeGroupName($groupId: ID!, $name: String!) {\n        changeGroupName(groupId: $groupId, name: $name)\n    }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    mutation InviteUser($groupId: ID!, $email: String!) {\n        inviteUser(groupId: $groupId, email: $email)\n    }\n"): (typeof documents)["\n    mutation InviteUser($groupId: ID!, $email: String!) {\n        inviteUser(groupId: $groupId, email: $email)\n    }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    mutation RevokeAccess($groupId: ID!, $userId: ID!) {\n        revokeAccess(groupId: $groupId, userId: $userId)\n    }\n"): (typeof documents)["\n    mutation RevokeAccess($groupId: ID!, $userId: ID!) {\n        revokeAccess(groupId: $groupId, userId: $userId)\n    }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    mutation DeleteGroup($groupId: ID!) {\n        deleteGroup(groupId: $groupId)\n    }\n"): (typeof documents)["\n    mutation DeleteGroup($groupId: ID!) {\n        deleteGroup(groupId: $groupId)\n    }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    mutation Login($password: String!, $email: String!) {\n        login(password: $password, email: $email)\n    }\n"): (typeof documents)["\n    mutation Login($password: String!, $email: String!) {\n        login(password: $password, email: $email)\n    }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    mutation Register($password: String!, $email: String!) {\n        register(password: $password, email: $email)\n    }\n"): (typeof documents)["\n    mutation Register($password: String!, $email: String!) {\n        register(password: $password, email: $email)\n    }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    mutation CreateGroup($name: String!) {\n        createGroup(name: $name)\n    }\n"): (typeof documents)["\n    mutation CreateGroup($name: String!) {\n        createGroup(name: $name)\n    }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    query GetGroup($uuid: ID!) {\n        group(uuid: $uuid) {\n            uuid\n            name\n            members {\n                user {\n                    uuid\n                    email\n                }\n                role\n            }\n        }\n    }\n"): (typeof documents)["\n    query GetGroup($uuid: ID!) {\n        group(uuid: $uuid) {\n            uuid\n            name\n            members {\n                user {\n                    uuid\n                    email\n                }\n                role\n            }\n        }\n    }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n    query RefreshCredentials {\n        refreshCredentials\n    }\n"): (typeof documents)["\n    query RefreshCredentials {\n        refreshCredentials\n    }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;