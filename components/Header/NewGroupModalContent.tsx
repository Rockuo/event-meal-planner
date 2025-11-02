import React, { useContext, useState } from 'react'
import Button from '@/components/Button'
import { useMutation } from '@apollo/client/react'
import { gql } from '@/app/graphql/generated/gql'
import GlobalLoader from '@/hooks/context/GlobalLoader'
import { UserContext } from '@/hooks/context/HandledUserContext'
import { GroupContext } from '@/hooks/context/HandledGroupContext'

const CREATE_GROUP_MUTATION = gql(`
    mutation CreateGroup($name: String!) {
        createGroup(name: $name)
    }
`)

interface Props {
    onClose: () => void
}

export default function GroupForm({ onClose }: Props) {
    const [name, setName] = useState('')
    const [createGroup, { loading, error }] = useMutation(CREATE_GROUP_MUTATION)
    const { setLoading } = useContext(GlobalLoader)
    const { refresh: refreshUser } = useContext(UserContext)
    const { setActiveGroup } = useContext(GroupContext)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        try {
            setLoading(true)
            const result = await createGroup({ variables: { name } })
            if (!result?.data?.createGroup) {
                throw new Error('Create group failed')
            }

            await refreshUser()
            setActiveGroup(result.data.createGroup)
            setLoading(false)
            onClose()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Group Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                    autoFocus
                />
            </div>
            {error && <p className="text-red-500">Error creating group: {error.message}</p>}
            <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Group'}
                </Button>
            </div>
        </form>
    )
}
