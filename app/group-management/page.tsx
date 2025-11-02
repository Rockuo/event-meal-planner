'use client'
import { useState, useEffect, useContext } from 'react'
import Button from '@/components/Button'
import TrashIcon from '@/components/icons/TrashIcon'
import { GET_GROUP_QUERY, GroupContext } from '@/hooks/context/HandledGroupContext'
import { UserContext } from '@/hooks/context/HandledUserContext'
import { Group, GroupMember } from '@/app/graphql/generated/graphql'
import { useMutation } from '@apollo/client/react'
import { gql } from '@/app/graphql/generated'
import GlobalLoader from '@/hooks/context/GlobalLoader'

const CHANGE_GROUP_NAME_MUTATION = gql(`
    mutation ChangeGroupName($groupId: ID!, $name: String!) {
        changeGroupName(groupId: $groupId, name: $name)
    }
`)

const INVITE_USER_MUTATION = gql(`
    mutation InviteUser($groupId: ID!, $email: String!) {
        inviteUser(groupId: $groupId, email: $email)
    }
`)

const REVOKE_ACCESS_MUTATION = gql(`
    mutation RevokeAccess($groupId: ID!, $userId: ID!) {
        revokeAccess(groupId: $groupId, userId: $userId)
    }
`)

const DELETE_GROUP_MUTATION = gql(`
    mutation DeleteGroup($groupId: ID!) {
        deleteGroup(groupId: $groupId)
    }
`)

export default function GroupManagementPage() {
    const { activeGroup } = useContext(GroupContext)
    const { user, refresh } = useContext(UserContext)
    const { setLoading } = useContext(GlobalLoader)

    const [groupName, setGroupName] = useState(activeGroup?.name || '')
    const [members, setMembers] = useState<GroupMember[]>([])
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteError, setInviteError] = useState<string | null>(null)
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

    const [changeGroupName, { loading: isChangingName, error: changeNameError }] = useMutation(
        CHANGE_GROUP_NAME_MUTATION,
        {
            refetchQueries: [GET_GROUP_QUERY],
        },
    )

    const [inviteUser, { loading: isInvitingUser, error: inviteUserError }] = useMutation(INVITE_USER_MUTATION, {
        refetchQueries: [GET_GROUP_QUERY],
    })

    const [revokeAccess, { loading: isRevokingAccess, error: revokeAccessError }] = useMutation(
        REVOKE_ACCESS_MUTATION,
        {
            refetchQueries: [GET_GROUP_QUERY],
        },
    )

    const [deleteGroup, { loading: isDeletingGroup, error: deleteGroupError }] = useMutation(DELETE_GROUP_MUTATION)

    const isAdmin = activeGroup?.members.some((m) => m.user.uuid === user.uuid && m.role === 'admin')

    useEffect(() => {
        if (activeGroup) {
            setGroupName(activeGroup.name)
            setMembers(activeGroup.members)
        }
    }, [activeGroup])

    if (!activeGroup) {
        return <div className="p-8 text-center">No active group selected.</div>
    }

    const handleNameChange = async (e: React.FormEvent) => {
        e.preventDefault()
        if (groupName.trim() && activeGroup) {
            try {
                setLoading(true)
                await changeGroupName({
                    variables: {
                        groupId: activeGroup.uuid,
                        name: groupName.trim(),
                    },
                })
                await refresh()
                setLoading(false)
            } catch (error) {
                console.error('Failed to change group name', error)
                setLoading(false)
            }
        }
    }

    const handleInviteUser = async () => {
        setInviteError(null)
        setInviteSuccess(null)
        if (!inviteEmail.trim() || !activeGroup) {
            setInviteError('Email cannot be empty.')
            return
        }

        try {
            setLoading(true)
            const result = await inviteUser({
                variables: {
                    groupId: activeGroup.uuid,
                    email: inviteEmail,
                },
            })

            setLoading(false)
            if (result.data?.inviteUser === 'success') {
                setInviteSuccess(`${inviteEmail} has been added to the group.`)
                setInviteEmail('')
            } else if (result.data?.inviteUser === 'invalid_user') {
                setInviteError('User with this email not found.')
            }
        } catch (error) {
            console.error('Failed to invite user', error)
            setInviteError('An unexpected error occurred.')
        }
    }

    const handleRemoveMember = async (memberId: string) => {
        if (!activeGroup) return

        try {
            setLoading(true)
            await revokeAccess({
                variables: {
                    groupId: activeGroup.uuid,
                    userId: memberId,
                },
            })

            setLoading(false)
        } catch (error) {
            console.error('Failed to remove member', error)
        }
    }

    const handleDeleteGroup = async (group: Group) => {
        if (!group || !window.confirm('Are you sure you want to delete this group? This action cannot be undone.'))
            return

        try {
            setLoading(true)
            await deleteGroup({ variables: { groupId: group.uuid } })
            await refresh()
            // No need to set loading to false, as the component will unmount or redirect
        } catch (error) {
            console.error('Failed to delete group', error)
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">
                Manage {'&quot;'} {activeGroup.name} {'&quot;'}
            </h1>

            {/* Rename Group */}
            <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 text-2xl font-bold text-gray-700">Group Settings</h2>
                <form onSubmit={handleNameChange} className="space-y-4">
                    <div>
                        <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
                            Group Name
                        </label>
                        <input
                            id="groupName"
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="mt-1 block w-full max-w-md rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            disabled={!isAdmin || isChangingName}
                        />
                    </div>
                    {changeNameError && (
                        <p className="text-sm text-red-500">Failed to change name: {changeNameError.message}</p>
                    )}
                    {isAdmin && (
                        <Button type="submit" disabled={isChangingName}>
                            {isChangingName ? 'Saving...' : 'Save Changes'}
                        </Button>
                    )}
                </form>
            </div>

            {/* Manage Members */}
            <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 text-2xl font-bold text-gray-700">Members</h2>
                <div className="space-y-3">
                    {members.map((member) => (
                        <div
                            key={member.user.uuid}
                            className="flex items-center justify-between rounded-md bg-gray-50 p-3"
                        >
                            <div>
                                <span className="font-medium text-gray-800">{member.user.email}</span>
                                {member.role === 'admin' && (
                                    <span className="ml-2 rounded-full bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-800">
                                        Owner
                                    </span>
                                )}
                            </div>
                            {isAdmin && member.user.uuid !== user?.uuid && (
                                <button
                                    onClick={() => handleRemoveMember(member.user.uuid)}
                                    className="rounded-full p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700"
                                    disabled={isRevokingAccess}
                                >
                                    <TrashIcon />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {revokeAccessError && <p className="mt-2 text-sm text-red-500">{revokeAccessError.message}</p>}
                {isAdmin && (
                    <div className="mt-6 border-t pt-6">
                        <h3 className="mb-2 text-lg font-semibold text-gray-800">Invite New Member</h3>
                        <div className="flex items-start space-x-2">
                            <div className="flex-grow">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="Enter user's email"
                                    className="block w-full max-w-sm rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    disabled={isInvitingUser}
                                />
                                {inviteError && <p className="mt-1 text-sm text-red-600">{inviteError}</p>}
                                {inviteUserError && (
                                    <p className="mt-1 text-sm text-red-600">Error: {inviteUserError.message}</p>
                                )}
                                {inviteSuccess && <p className="mt-1 text-sm text-green-600">{inviteSuccess}</p>}
                            </div>
                            <Button onClick={handleInviteUser} disabled={isInvitingUser}>
                                {isInvitingUser ? 'Inviting...' : 'Invite'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            {isAdmin && (
                <div className="rounded-lg border-2 border-red-200 bg-white p-6 shadow-md">
                    <h2 className="mb-4 text-2xl font-bold text-red-700">Danger Zone</h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-800">Delete this group</p>
                            <p className="text-sm text-gray-600">
                                Once you delete a group, there is no going back. All associated events, meals, and
                                ingredients will be permanently deleted.
                            </p>
                        </div>
                        <Button
                            variant="danger"
                            onClick={() => handleDeleteGroup(activeGroup)}
                            disabled={isDeletingGroup}
                        >
                            {isDeletingGroup ? 'Deleting...' : 'Delete Group'}
                        </Button>
                    </div>
                    {deleteGroupError && <p className="mt-2 text-sm text-red-500">{deleteGroupError.message}</p>}
                </div>
            )}
        </div>
    )
}
