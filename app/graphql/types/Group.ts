export const GroupTypeDef = `
  type Group {
    uuid: ID!
    name: String!
    members: [GroupMember!]!
  }
`;
