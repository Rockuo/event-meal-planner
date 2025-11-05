export function createMultiInsertValues<T>(groups: T[][]) {
    const keys = [];
    const values: T[] = [];

    let k = 1;
    for (const group of groups) {
        const row = [];
        for (const item of group) {
            row.push(`$${k++}`);
            values.push(item);
        }
        keys.push(`(${row.join(', ')})`);
    }
    return { keys: keys.join(',\n'), values };
}
