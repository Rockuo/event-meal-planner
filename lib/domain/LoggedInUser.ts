export default interface LoggedInUser {
    uuid: string;
    email: string;
    groups: LoggedInUserGroup[];
}

export interface LoggedInUserGroup {
    uuid: string;
    name: string;
}
