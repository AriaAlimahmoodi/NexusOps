export type PersonalResourceOwner = {
    type: 'personal';
    projectId?: string;
    projectName?: string;
    personalEmail: string;
};
export type TeamResourceOwner = {
    type: 'team';
    teamId: string;
    teamName: string;
};
export type RemoteResourceOwner = string | PersonalResourceOwner | TeamResourceOwner;
export type StatusResourceOwner = {
    type: 'personal' | 'team';
    projectId: string;
    projectName: string;
};
