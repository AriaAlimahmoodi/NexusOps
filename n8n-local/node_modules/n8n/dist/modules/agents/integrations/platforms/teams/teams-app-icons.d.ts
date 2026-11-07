import { type AgentPersonalisation } from '@n8n/api-types';
export interface TeamsAppIcons {
    color: Buffer;
    outline: Buffer;
    accentColor: string;
}
interface IconSvgs {
    color: string;
    outline: string;
    accentColor: string;
}
type Gradient = AgentPersonalisation['gradient'];
export declare function renderTeamsAppIcons(personalisation?: AgentPersonalisation | null): Promise<TeamsAppIcons | undefined>;
export declare function buildTeamsIconSvgs(iconName: string, gradient: Gradient): Promise<IconSvgs | undefined>;
export {};
