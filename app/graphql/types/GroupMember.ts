export const GroupMemberTypeDef = `
  enum GroupRole {
    admin
    editor
  }

  type GroupMember {
    user: User!
    role: GroupRole!
  }
`;
