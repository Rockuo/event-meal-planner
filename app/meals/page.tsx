'use client';
import React, { useState, useRef, useEffect, useContext } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import PlusIcon from '@/components/icons/PlusIcon';
import TrashIcon from '@/components/icons/TrashIcon';
import PencilIcon from '@/components/icons/PencilIcon';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon';
import { Meal, MealIngredient, MealTag, Ingredient } from '@/app/graphql/generated/graphql';
import { useIngredientsQuery } from '@/hooks/api/ingredients';
import { useQuery, useMutation } from '@apollo/client/react';
import { GroupContext } from '@/hooks/context/HandledGroupContext';
import { gql } from '@/app/graphql/generated';
import GlobalLoader from '@/hooks/context/GlobalLoader';
import { MEALS_QUERY, useMealsQuery } from '@/hooks/api/meals';

const MEAL_TAGS_QUERY = gql(`
    query MealTags($groupUuid: ID!) {
        mealTags(groupUuid: $groupUuid) {
            id
            name
        }
    }
`);

const CREATE_MEAL_MUTATION = gql(`
    mutation CreateMeal($name: String!, $description: String, $guide: String, $ingredients: [MealIngredientInput!]!, $tagIds: [Int!]!, $groupUuid: ID!) {
        createMeal(name: $name, description: $description, guide: $guide, ingredients: $ingredients, tagIds: $tagIds, groupUuid: $groupUuid)
    }
`);

const UPDATE_MEAL_MUTATION = gql(`
    mutation UpdateMeal($id: Int!, $name: String, $description: String, $guide: String, $ingredients: [MealIngredientInput!]!, $tagIds: [Int!]!) {
        updateMeal(id: $id, name: $name, description: $description, guide: $guide, ingredients: $ingredients, tagIds: $tagIds)
    }
`);

const DELETE_MEAL_MUTATION = gql(`
    mutation DeleteMeal($id: Int!, $groupUuid: ID!) {
        deleteMeal(id: $id, groupUuid: $groupUuid)
    }
`);

const CREATE_MEAL_TAG_MUTATION = gql(`
    mutation CreateMealTag($name: String!, $groupUuid: ID!) {
        createMealTag(name: $name, groupUuid: $groupUuid)
    }
`);

const UPDATE_MEAL_TAG_MUTATION = gql(`
    mutation UpdateMealTag($id: Int!, $name: String!) {
        updateMealTag(id: $id, name: $name)
    }
`);

const DELETE_MEAL_TAG_MUTATION = gql(`
    mutation DeleteMealTag($id: Int!, $groupUuid: ID!) {
        deleteMealTag(id: $id, groupUuid: $groupUuid)
    }
`);

// Reusable MultiSelect Component
const MultiSelect: React.FC<{
    options: { id: string; name: string }[];
    selectedIds: string[];
    onChange: (selectedIds: string[]) => void;
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

    const handleSelect = (optionId: string) => {
        if (selectedIds.includes(optionId)) {
            onChange(selectedIds.filter((id) => id !== optionId));
        } else {
            onChange([...selectedIds, optionId]);
        }
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
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-2">{children}</div>
    </div>
);

// Meal Form
const MealForm: React.FC<{
    onClose: () => void;
    mealToEdit?: Meal | null;
    ingredients: Ingredient[];
    mealTags: MealTag[];
    groupUuid: string;
}> = ({ onClose, mealToEdit, ingredients, mealTags, groupUuid }) => {
    const [name, setName] = useState(mealToEdit?.name || '');
    const [description, setDescription] = useState(mealToEdit?.description || '');
    const [cookingGuide, setCookingGuide] = useState(mealToEdit?.guide || '');
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(mealToEdit?.tags.map((t) => t.id.toString()) || []);
    const [mealIngredients, setMealIngredients] = useState<MealIngredient[]>(mealToEdit?.ingredients || []);

    const { setLoading } = useContext(GlobalLoader);

    const [createMeal, { loading: creatingMeal }] = useMutation(CREATE_MEAL_MUTATION, {
        refetchQueries: [MEALS_QUERY],
        onCompleted: () => setLoading(false),
        onError: () => setLoading(false),
    });

    const [updateMeal, { loading: updatingMeal }] = useMutation(UPDATE_MEAL_MUTATION, {
        refetchQueries: [MEALS_QUERY],
        onCompleted: () => setLoading(false),
        onError: () => setLoading(false),
    });

    const handleAddIngredient = () => {
        if (ingredients.length > 0) {
            setMealIngredients([...mealIngredients, { ingredient: ingredients[0], count: 0, unit: '' }]);
        }
    };

    const handleIngredientChange = <T,>(index: number, field: keyof MealIngredient, value: T) => {
        const newIngredients = [...mealIngredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setMealIngredients(newIngredients);
    };

    const handleRemoveIngredient = (index: number) => {
        setMealIngredients(mealIngredients.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const mutationVariables = {
            name,
            description,
            guide: cookingGuide,
            tagIds: selectedTagIds.map((id) => parseInt(id, 10)),
            ingredients: mealIngredients.map((ing) => ({
                ingredientId: ing.ingredient.id,
                count: ing.count,
                unit: ing.unit,
            })),
        };

        try {
            if (mealToEdit) {
                await updateMeal({ variables: { id: mealToEdit.id, ...mutationVariables } });
            } else {
                await createMeal({ variables: { ...mutationVariables, groupUuid } });
            }
            onClose();
        } catch (error) {
            console.error('Failed to save meal', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Meal Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    ></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cooking Guide</label>
                    <textarea
                        value={cookingGuide}
                        onChange={(e) => setCookingGuide(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    ></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tags</label>
                    <MultiSelect
                        options={mealTags.map((t) => ({ id: t.id.toString(), name: t.name }))}
                        selectedIds={selectedTagIds}
                        onChange={setSelectedTagIds}
                        placeholder="Select tags..."
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Ingredients</h3>
                    <Button type="button" size="sm" variant="secondary" onClick={handleAddIngredient}>
                        Add Ingredient
                    </Button>
                </div>
                {mealIngredients.map((ing, index) => (
                    <div key={index} className="grid grid-cols-12 items-center gap-2 rounded-md bg-gray-50 p-2">
                        <select
                            value={ing.ingredient.id}
                            onChange={(e) =>
                                handleIngredientChange(
                                    index,
                                    'ingredient',
                                    ingredients.find((i) => i.id.toString() === e.target.value),
                                )
                            }
                            className="col-span-5 mt-1 block w-full rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            {ingredients.map((i) => (
                                <option key={i.id} value={i.id}>
                                    {i.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Amount"
                            value={ing.count}
                            onChange={(e) => handleIngredientChange(index, 'count', parseFloat(e.target.value) || 0)}
                            className="col-span-3 mt-1 block w-full rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <input
                            type="text"
                            placeholder={ing.ingredient.defaultUnit ?? 'Unit'}
                            value={ing.unit ?? ''}
                            onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                            className="col-span-3 mt-1 block w-full rounded-md border-gray-400 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemoveIngredient(index)}
                            className="col-span-1 flex items-center justify-center text-red-500 hover:text-red-700"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose} disabled={creatingMeal || updatingMeal}>
                    Cancel
                </Button>
                <Button type="submit" disabled={creatingMeal || updatingMeal}>
                    {mealToEdit
                        ? updatingMeal
                            ? 'Saving...'
                            : 'Save Changes'
                        : creatingMeal
                          ? 'Saving...'
                          : 'Save Meal'}
                </Button>
            </div>
        </form>
    );
};

// Meal Tag Form
const MealTagForm: React.FC<{ onClose: () => void; tagToEdit?: MealTag | null; groupUuid: string }> = ({
    onClose,
    tagToEdit,
    groupUuid,
}) => {
    const [name, setName] = useState(tagToEdit?.name || '');
    const { setLoading } = useContext(GlobalLoader);

    const [createMealTag, { loading: creatingTag }] = useMutation(CREATE_MEAL_TAG_MUTATION, {
        refetchQueries: [MEAL_TAGS_QUERY],
        onCompleted: () => setLoading(false),
        onError: () => setLoading(false),
    });

    const [updateMealTag, { loading: updatingTag }] = useMutation(UPDATE_MEAL_TAG_MUTATION, {
        refetchQueries: [MEAL_TAGS_QUERY],
        onCompleted: () => setLoading(false),
        onError: () => setLoading(false),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        setLoading(true);

        try {
            if (tagToEdit) {
                await updateMealTag({ variables: { id: tagToEdit.id, name } });
            } else {
                await createMealTag({ variables: { name, groupUuid } });
            }
            onClose();
        } catch (error) {
            console.error('Failed to save meal tag', error);
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

const MealsPage: React.FC = () => {
    const { activeGroup } = useContext(GroupContext);
    const { setLoading } = useContext(GlobalLoader);

    const { data: mealsData, loading: mealsLoading, error: mealsError } = useMealsQuery();
    const meals: Meal[] = (mealsData?.meals || []) as Meal[];

    const {
        data: mealTagsData,
        loading: mealTagsLoading,
        error: mealTagsError,
    } = useQuery(MEAL_TAGS_QUERY, {
        variables: { groupUuid: activeGroup?.uuid || '' },
        skip: !activeGroup?.uuid,
    });
    const mealTags = mealTagsData?.mealTags || [];

    const { data: ingredientsData, loading: ingredientsLoading, error: ingredientsError } = useIngredientsQuery();
    const ingredients = ingredientsData?.ingredients || [];

    const [deleteMeal, { loading: deletingMeal }] = useMutation(DELETE_MEAL_MUTATION, {
        refetchQueries: [MEALS_QUERY],
        onCompleted: () => setLoading(false),
        onError: () => setLoading(false),
    });

    const [deleteMealTag, { loading: deletingMealTag }] = useMutation(DELETE_MEAL_TAG_MUTATION, {
        refetchQueries: [MEAL_TAGS_QUERY],
        onCompleted: () => setLoading(false),
        onError: () => setLoading(false),
    });

    const [mealModal, setMealModal] = useState<{ type: 'add' | 'edit'; meal?: Meal } | null>(null);
    const [tagModal, setTagModal] = useState<{ mode: 'add' | 'edit'; data?: MealTag } | null>(null);

    const openMealModal = (type: 'add' | 'edit', meal?: Meal) => setMealModal({ type, meal });
    const closeMealModal = () => setMealModal(null);

    const openTagModal = (mode: 'add' | 'edit', data?: MealTag) => setTagModal({ mode, data });
    const closeTagModal = () => setTagModal(null);

    const handleDeleteMeal = async (id: number) => {
        if (!activeGroup?.uuid || !window.confirm('Are you sure you want to delete this meal?')) return;
        setLoading(true);
        try {
            await deleteMeal({ variables: { id, groupUuid: activeGroup.uuid } });
        } catch (error) {
            console.error('Failed to delete meal', error);
        }
    };

    const handleDeleteMealTag = async (id: number) => {
        if (!activeGroup?.uuid || !window.confirm('Are you sure you want to delete this meal tag?')) return;
        setLoading(true);
        try {
            await deleteMealTag({ variables: { id, groupUuid: activeGroup.uuid } });
        } catch (error) {
            console.error('Failed to delete meal tag', error);
        }
    };

    if (ingredientsLoading || mealsLoading || mealTagsLoading) return <p>Loading...</p>;
    if (ingredientsError) return <p>Error loading ingredients: {ingredientsError.message}</p>;
    if (mealsError) return <p>Error loading meals: {mealsError.message}</p>;
    if (mealTagsError) return <p>Error loading meal tags: {mealTagsError.message}</p>;

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Modal
                isOpen={!!mealModal}
                onClose={closeMealModal}
                title={mealModal?.type === 'edit' ? 'Edit Meal' : 'Add New Meal'}
                size="xl"
            >
                <MealForm
                    onClose={closeMealModal}
                    mealToEdit={mealModal?.type === 'edit' ? mealModal.meal : undefined}
                    ingredients={ingredients}
                    mealTags={mealTags}
                    groupUuid={activeGroup?.uuid || ''}
                />
            </Modal>
            <Modal
                isOpen={!!tagModal}
                onClose={closeTagModal}
                title={tagModal?.mode === 'edit' ? 'Edit Meal Tag' : 'Add New Meal Tag'}
            >
                <MealTagForm
                    onClose={closeTagModal}
                    tagToEdit={tagModal?.mode === 'edit' ? tagModal.data : undefined}
                    groupUuid={activeGroup?.uuid || ''}
                />
            </Modal>

            {/* Meals Column */}
            <InfoCard title="Meals" onAdd={() => openMealModal('add')} addLabel="New Meal">
                {meals.length > 0 ? (
                    meals.map((meal) => (
                        <div key={meal.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-indigo-700">{meal.name}</h3>
                                    <p className="mt-1 text-sm text-gray-600">{meal.description}</p>
                                </div>
                                <div className="ml-4 flex flex-shrink-0 space-x-2">
                                    <button
                                        onClick={() => openMealModal('edit', meal)}
                                        className="rounded-full p-1 text-gray-500 hover:bg-gray-200 hover:text-indigo-600"
                                    >
                                        <PencilIcon />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMeal(meal.id)}
                                        className="rounded-full p-1 text-gray-500 hover:bg-gray-200 hover:text-red-600"
                                        disabled={deletingMeal}
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {meal.tags.map((tag) => {
                                    const foundTag = mealTags.find((c) => c.id === tag.id);
                                    return foundTag ? (
                                        <span
                                            key={tag.id}
                                            className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800"
                                        >
                                            {foundTag.name}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="py-8 text-center text-gray-500">No meals yet. Add one to get started!</p>
                )}
            </InfoCard>

            {/* Meal Tags Column */}
            <InfoCard title="Meal Tags" onAdd={() => openTagModal('add')} addLabel="New Tag">
                {mealTags.length > 0 ? (
                    mealTags.map((tag) => (
                        <div key={tag.id} className="flex items-center justify-between rounded-md bg-gray-50 p-3">
                            <span className="font-medium text-gray-800">{tag.name}</span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => openTagModal('edit', tag)}
                                    className="rounded-full p-1 text-gray-500 hover:bg-gray-200 hover:text-indigo-600"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteMealTag(tag.id)}
                                    className="rounded-full p-1 text-gray-500 hover:bg-gray-200 hover:text-red-600"
                                    disabled={deletingMealTag}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="py-4 text-center text-gray-500">No meal tags yet.</p>
                )}
            </InfoCard>
        </div>
    );
};

export default MealsPage;
