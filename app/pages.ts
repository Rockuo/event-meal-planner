
export type Page = '/events' | '/meals' | '/ingredients' | '/group-management';

export const pages: Page[] = [
    '/events',
    '/meals',
    '/ingredients',
    '/group-management',
]

export const pageNames: Record<Page, string> = {
    '/events': 'Events',
    '/meals': 'Meals',
    '/ingredients':  'Ingredients',
    '/group-management':  'Group management',
}