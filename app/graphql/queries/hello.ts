export const hello = {
    typeDef: `
        hello: String
    `,
    resolver: (_: any, __: any, context: { user: any }) => {
        if (!context.user) {
            throw new Error("You must be logged in to do that.");
        }
        return 'world'
    }
};
