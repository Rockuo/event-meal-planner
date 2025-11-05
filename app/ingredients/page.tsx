'use client';
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Ingredient, IngredientTag } from '@/app/graphql/generated/graphql';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import PlusIcon from '@/components/icons/PlusIcon';
import TrashIcon from '@/components/icons/TrashIcon';
import PencilIcon from '@/components/icons/PencilIcon';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@/app/graphql/generated';
import { GroupContext } from '@/hooks/context/HandledGroupContext';
import GlobalLoader from '@/hooks/context/GlobalLoader';
import { INGREDIENTS_QUERY, useIngredientsQuery } from '@/hooks/api/ingredients';

const INGREDIENT_TAGS_QUERY = gql(`
    query IngredientTags($groupUuid: ID!) {
        ingredientTags(groupUuid: $groupUuid) {
            id
            name
        }
    }
`);

const CREATE_INGREDIENT_MUTATION = gql(`
    mutation CreateIngredient($name: String!, $defaultUnit: String, $tagIds: [Int!]!, $groupUuid: ID!) {
        createIngredient(name: $name, defaultUnit: $defaultUnit, tagIds: $tagIds, groupUuid: $groupUuid)
    }
`);

const UPDATE_INGREDIENT_MUTATION = gql(`
    mutation UpdateIngredient($id: Int!, $name: String, $defaultUnit: String, $tagIds: [Int!]!) {
        updateIngredient(id: $id, name: $name, defaultUnit: $defaultUnit, tagIds: $tagIds)
    }
`);

const DELETE_INGREDIENT_MUTATION = gql(`
    mutation DeleteIngredient($id: Int!, $groupUuid: ID!) {
        deleteIngredient(id: $id, groupUuid: $groupUuid)
    }
`);

const CREATE_INGREDIENT_TAG_MUTATION = gql(`
    mutation CreateIngredientTag($name: String!, $groupUuid: ID!) {
        createIngredientTag(name: $name, groupUuid: $groupUuid)
    }
`);

const UPDATE_INGREDIENT_TAG_MUTATION = gql(`
    mutation UpdateIngredientTag($id: Int!, $name: String!) {
        updateIngredientTag(id: $id, name: $name)
    }
`);

const DELETE_INGREDIENT_TAG_MUTATION = gql(`
    mutation DeleteIngredientTag($id: Int!, $groupUuid: ID!) {
        deleteIngredientTag(id: $id, groupUuid: $groupUuid)
    }
`);

// Reusable MultiSelect Component
const MultiSelect: React.FC<{
    options: IngredientTag[];
    selectedIds: number[];
    onChange: (selectedId: IngredientTag[]) => void;
    placeholder?: string;
}> = ({ options, selectedIds, onChange, placeholder = 'Select...' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOptions = options.filter((op) => selectedIds.includes(op.id));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionId: number) => {
        const newIds = selectedIds.includes(optionId)
            ? selectedIds.filter((id) => id !== optionId)
            : [...selectedIds, optionId];
        onChange(options.filter(({ id }) => newIds.includes(id)));
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="mt-1 block flex w-full items-center justify-between rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-left text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
                <span className="truncate">
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map((op) => op.name).join(', ')
                    ) : (
                        <span className="text-gray-500">{placeholder}</span>
                    )}
                </span>
                <ChevronDownIcon
                    className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg">
                    <ul>
                        {options.map((option) => (
                            <li key={option.id} className="hover:bg-gray-100">
                                <label
                                    htmlFor={`multiselect-${option.id}-${placeholder}`}
                                    className="flex w-full cursor-pointer items-center space-x-2 p-2"
                                >
                                    <input
                                        id={`multiselect-${option.id}-${placeholder}`}
                                        type="checkbox"
                                        checked={selectedIds.includes(option.id)}
                                        onChange={() => handleSelect(option.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>{option.name}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Reusable Card Component
const InfoCard: React.FC<{ title: string; children: React.ReactNode; onAdd: () => void; addLabel: string }> = ({
    title,
    children,
    onAdd,
    addLabel,
}) => (
    <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
            <Button onClick={onAdd} size="sm">
                <PlusIcon className="mr-2" /> {addLabel}
            </Button>
        </div>
        <div className="max-h-96 space-y-3 overflow-y-auto pr-2">{children}</div>
    </div>
);

interface IngredientFormProps {
    onClose: () => void;
    ingredient?: Ingredient;
    ingredientTags: IngredientTag[];
    groupUuid: string;
    refetchIngredients: () => void;
}

// Ingredient Form
function IngredientForm({ onClose, ingredient, ingredientTags, groupUuid, refetchIngredients }: IngredientFormProps) {
    const [name, setName] = useState(ingredient?.name || '');
    const [defaultUnit, setDefaultUnit] = useState(ingredient?.defaultUnit || '');
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>(ingredient?.tags.map((tag) => tag.id) || []);

    const { setLoading } = useContext(GlobalLoader);

    const [createIngredient, { loading: creatingIngredient }] = useMutation(CREATE_INGREDIENT_MUTATION, {
        refetchQueries: [INGREDIENTS_QUERY],
        onCompleted: () => {
            setLoading(false);
            refetchIngredients();
            onClose();
        },
        onError: (error) => {
            console.error('Error creating ingredient:', error);
            setLoading(false);
        },
    });

    const [updateIngredient, { loading: updatingIngredient }] = useMutation(UPDATE_INGREDIENT_MUTATION, {
        refetchQueries: [INGREDIENTS_QUERY],
        onCompleted: () => {
            setLoading(false);
            refetchIngredients();
            onClose();
        },
        onError: (error) => {
            console.error('Error updating ingredient:', error);
            setLoading(false);
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert('Please provide an ingredient name.');
            return;
        }

        setLoading(true);

        try {
            if (ingredient) {
                await updateIngredient({
                    variables: {
                        id: ingredient.id,
                        name,
                        defaultUnit: defaultUnit || null,
                        tagIds: selectedTagIds,
                    },
                });
            } else {
                await createIngredient({
                    variables: {
                        name,
                        defaultUnit: defaultUnit || null,
                        tagIds: selectedTagIds,
                        groupUuid,
                    },
                });
            }
        } catch {
            // Error handled by onError callback
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Ingredient Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Default Unit (optional)</label>
                <input
                    type="text"
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <MultiSelect
                    options={ingredientTags}
                    selectedIds={selectedTagIds}
                    onChange={(tags) => setSelectedTagIds(tags.map((tag) => tag.id))}
                    placeholder="Select tags..."
                />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={creatingIngredient || updatingIngredient}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={creatingIngredient || updatingIngredient}>
                    {ingredient
                        ? updatingIngredient
                            ? 'Saving...'
                            : 'Save Changes'
                        : creatingIngredient
                          ? 'Saving...'
                          : 'Save Ingredient'}
                </Button>
            </div>
        </form>
    );
}

interface IngredientTagFormProps {
    onClose: () => void;
    tagToEdit?: IngredientTag | null;
    groupUuid: string;
    refetchIngredientTags: () => void;
}

// Ingredient Tag Form
const IngredientTagForm: React.FC<IngredientTagFormProps> = ({
    onClose,
    tagToEdit,
    groupUuid,
    refetchIngredientTags,
}) => {
    const [name, setName] = useState(tagToEdit?.name || '');
    const { setLoading } = useContext(GlobalLoader);

    const [createIngredientTag, { loading: creatingTag }] = useMutation(CREATE_INGREDIENT_TAG_MUTATION, {
        refetchQueries: [INGREDIENT_TAGS_QUERY],
        onCompleted: () => {
            setLoading(false);
            refetchIngredientTags();
            onClose();
        },
        onError: (error) => {
            console.error('Error creating ingredient tag:', error);
            setLoading(false);
        },
    });

    const [updateIngredientTag, { loading: updatingTag }] = useMutation(UPDATE_INGREDIENT_TAG_MUTATION, {
        refetchQueries: [INGREDIENT_TAGS_QUERY, INGREDIENTS_QUERY],
        onCompleted: () => {
            setLoading(false);
            refetchIngredientTags();
            onClose();
        },
        onError: (error) => {
            console.error('Error updating ingredient tag:', error);
            setLoading(false);
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert('Please provide a tag name.');
            return;
        }

        setLoading(true);

        try {
            if (tagToEdit) {
                await updateIngredientTag({
                    variables: {
                        id: tagToEdit.id,
                        name,
                    },
                });
            } else {
                await createIngredientTag({
                    variables: {
                        name,
                        groupUuid,
                    },
                });
            }
        } catch {
            // Error handled by onError callback
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Tag Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} disabled={creatingTag || updatingTag}>
                    Cancel
                </Button>
                <Button type="submit" disabled={creatingTag || updatingTag}>
                    {tagToEdit ? (updatingTag ? 'Saving...' : 'Save Changes') : creatingTag ? 'Saving...' : 'Save Tag'}
                </Button>
            </div>
        </form>
    );
};

const IngredientsPage: React.FC = () => {
    const { activeGroup } = useContext(GroupContext);
    const { setLoading } = useContext(GlobalLoader);

    const {
        data: ingredientsData,
        loading: loadingIngredients,
        error: ingredientsError,
        refetch: refetchIngredients,
    } = useIngredientsQuery();

    const {
        data: ingredientTagsData,
        loading: loadingIngredientTags,
        error: ingredientTagsError,
        refetch: refetchIngredientTags,
    } = useQuery(INGREDIENT_TAGS_QUERY, {
        variables: { groupUuid: activeGroup?.uuid || '' },
        skip: !activeGroup?.uuid,
    });

    const [deleteIngredient, { loading: deletingIngredient }] = useMutation(DELETE_INGREDIENT_MUTATION, {
        refetchQueries: [INGREDIENTS_QUERY],
        update(cache) {
            cache.evict({ fieldName: 'meals' });
            cache.gc();
        },
        onCompleted: () => {
            setLoading(false);
            refetchIngredients();
        },
        onError: (error) => {
            console.error('Error deleting ingredient:', error);
            setLoading(false);
        },
    });

    const [deleteIngredientTag, { loading: deletingIngredientTag }] = useMutation(DELETE_INGREDIENT_TAG_MUTATION, {
        refetchQueries: [INGREDIENT_TAGS_QUERY, INGREDIENTS_QUERY],
        onCompleted: () => {
            setLoading(false);
            refetchIngredientTags();
            refetchIngredients();
        },
        onError: (error) => {
            console.error('Error deleting ingredient tag:', error);
            setLoading(false);
        },
    });

    const ingredients: Ingredient[] = ingredientsData?.ingredients || [];
    const ingredientTags: IngredientTag[] = ingredientTagsData?.ingredientTags || [];

    const [modal, setModal] = useState<{
        type: 'ingredient' | 'ingredientTag';
        mode: 'add' | 'edit';
        data?: Ingredient | IngredientTag;
    } | null>(null);

    const openModal = (type: 'ingredient' | 'ingredientTag', mode: 'add' | 'edit', data?: Ingredient | IngredientTag) =>
        setModal({
            type,
            mode,
            data,
        });
    const closeModal = () => setModal(null);

    const handleDeleteIngredient = async (id: number) => {
        if (!activeGroup?.uuid || !window.confirm('Are you sure you want to delete this ingredient?')) return;
        setLoading(true);
        try {
            await deleteIngredient({ variables: { id, groupUuid: activeGroup.uuid } });
        } catch {
            // Error handled by onError callback
        }
    };

    const handleDeleteIngredientTag = async (id: number) => {
        if (!activeGroup?.uuid || !window.confirm('Are you sure you want to delete this ingredient tag?')) return;
        setLoading(true);
        try {
            await deleteIngredientTag({ variables: { id, groupUuid: activeGroup.uuid } });
        } catch {
            // Error handled by onError callback
        }
    };

    if (loadingIngredients || loadingIngredientTags) return <p>Loading...</p>;
    if (ingredientsError) return <p>Error loading ingredients: {ingredientsError.message}</p>;
    if (ingredientTagsError) return <p>Error loading ingredient tags: {ingredientTagsError.message}</p>;
    if (!activeGroup) return <p>Please select an active group to view ingredients.</p>;

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Modal
                isOpen={modal?.type === 'ingredient'}
                onClose={closeModal}
                title={modal?.mode === 'edit' ? 'Edit Ingredient' : 'Add New Ingredient'}
            >
                <IngredientForm
                    onClose={closeModal}
                    ingredient={modal?.mode === 'edit' ? (modal.data as Ingredient) : undefined}
                    ingredientTags={ingredientTags}
                    groupUuid={activeGroup.uuid}
                    refetchIngredients={refetchIngredients}
                />
            </Modal>
            <Modal
                isOpen={modal?.type === 'ingredientTag'}
                onClose={closeModal}
                title={modal?.mode === 'edit' ? 'Edit Ingredient Tag' : 'Add New Ingredient Tag'}
            >
                <IngredientTagForm
                    onClose={closeModal}
                    tagToEdit={modal?.mode === 'edit' ? (modal.data as IngredientTag) : undefined}
                    groupUuid={activeGroup.uuid}
                    refetchIngredientTags={refetchIngredientTags}
                />
            </Modal>

            {/* Ingredients Column */}
            <InfoCard title="Ingredients" onAdd={() => openModal('ingredient', 'add')} addLabel="New Ingredient">
                {ingredients.length > 0 ? (
                    ingredients.map((ing) => (
                        <div key={ing.id} className="rounded-md bg-gray-50 p-3">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-800">{ing.name}</span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => openModal('ingredient', 'edit', ing)}
                                        className="rounded-full p-1 text-gray-500 hover:bg-gray-200 hover:text-indigo-600"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteIngredient(ing.id)}
                                        className="rounded-full p-1 text-gray-500 hover:bg-gray-200 hover:text-red-600"
                                        disabled={deletingIngredient}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {ing.tags.map((tag) => {
                                    return tag ? (
                                        <span
                                            key={tag.id}
                                            className="rounded-full bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700"
                                        >
                                            {tag.name}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="py-4 text-center text-gray-500">No ingredients yet.</p>
                )}
            </InfoCard>

            {/* Ingredient Tags Column */}
            <InfoCard title="Ingredient Tags" onAdd={() => openModal('ingredientTag', 'add')} addLabel="New Tag">
                {ingredientTags.length > 0 ? (
                    ingredientTags.map((tag) => (
                        <div key={tag.id} className="flex items-center justify-between rounded-md bg-gray-50 p-3">
                            <span className="font-medium text-gray-800">{tag.name}</span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => openModal('ingredientTag', 'edit', tag)}
                                    className="rounded-full p-1 text-gray-500 hover:bg-gray-200 hover:text-indigo-600"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteIngredientTag(tag.id)}
                                    className="rounded-full p-1 text-gray-500 hover:bg-gray-200 hover:text-red-600"
                                    disabled={deletingIngredientTag}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="py-4 text-center text-gray-500">No ingredient tags yet.</p>
                )}
            </InfoCard>
        </div>
    );
};

export default IngredientsPage;
