import type { ProjectIcon, ProjectType } from '@n8n/api-types';
import type { APIRequest, AuthenticatedRequest, Variables, Project, User, ListQueryDb, WorkflowHistory } from '@n8n/db';
import type { AssignableGlobalRole, AssignableProjectRole, GlobalRole, ProjectRole, Scope } from '@n8n/permissions';
import type { Request } from 'express';
import type { ICredentialDataDecryptedObject, INodeCredentialTestRequest, IPersonalizationSurveyAnswersV4 } from 'n8n-workflow';
export type AuthlessRequest<RouteParams = {}, ResponseBody = {}, RequestBody = {}, RequestQuery = {}> = APIRequest<RouteParams, ResponseBody, RequestBody, RequestQuery>;
export declare namespace ListQuery {
    type Request = AuthenticatedRequest<{}, {}, {}, Params> & {
        listQueryOptions?: Options;
    };
    type Params = {
        filter?: string;
        skip?: string;
        take?: string;
        select?: string;
        sortBy?: string;
    };
    type Options = {
        filter?: Record<string, unknown>;
        select?: Record<string, true>;
        skip?: number;
        take?: number;
        sortBy?: string;
    };
}
export declare function appendListQueryOptions(req: Request, options: ListQuery.Options): void;
export declare function hasSharing(workflows: ListQueryDb.Workflow.Plain[] | ListQueryDb.Workflow.WithSharing[]): workflows is ListQueryDb.Workflow.WithSharing[];
export declare namespace CredentialRequest {
    type CredentialProperties = Partial<{
        id: string;
        name: string;
        description: string | null;
        type: string;
        data: ICredentialDataDecryptedObject;
        projectId?: string;
        isManaged?: boolean;
        isGlobal?: boolean;
        isResolvable?: boolean;
    }>;
    type Get = AuthenticatedRequest<{
        credentialId: string;
    }, {}, {}, Record<string, string>>;
    type GetMany = AuthenticatedRequest<{}, {}, {}, ListQuery.Params & {
        includeScopes?: string;
        includeFolders?: string;
    }> & {
        listQueryOptions: ListQuery.Options;
    };
    type Delete = Get;
    type GetAll = AuthenticatedRequest<{}, {}, {}, {
        filter: string;
    }>;
    type Update = AuthenticatedRequest<{
        credentialId: string;
    }, {}, CredentialProperties>;
    type Test = AuthenticatedRequest<{}, {}, INodeCredentialTestRequest>;
    type Share = AuthenticatedRequest<{
        credentialId: string;
    }, {}, {
        shareWithIds: string[];
    }>;
    type Transfer = AuthenticatedRequest<{
        credentialId: string;
    }, {}, {
        destinationProjectId: string;
    }>;
    type ForWorkflow = AuthenticatedRequest<{}, {}, {}, ({
        workflowId: string;
    } | {
        projectId: string;
    }) & {
        forAgent?: 'true' | 'false';
    }>;
}
export declare namespace MeRequest {
    type SurveyAnswers = AuthenticatedRequest<{}, {}, IPersonalizationSurveyAnswersV4>;
}
export declare namespace UserRequest {
    type InviteResponse = {
        user: {
            id: string;
            email: string;
            inviteAcceptUrl?: string;
            emailSent: boolean;
            role: AssignableGlobalRole;
        };
        error?: string;
    };
    type Delete = AuthenticatedRequest<{
        id: string;
        email: string;
        identifier: string;
    }, {}, {}, {
        transferId?: string;
        includeRole: boolean;
    }>;
    type PasswordResetLink = AuthenticatedRequest<{
        id: string;
    }, {}, {}, {}>;
}
export declare namespace MFA {
    type Enforce = AuthenticatedRequest<{}, {}, {
        enforce: boolean;
    }, {}>;
    type Verify = AuthenticatedRequest<{}, {}, {
        mfaCode: string;
    }, {}>;
    type Activate = AuthenticatedRequest<{}, {}, {
        mfaCode: string;
    }, {}>;
    type Disable = AuthenticatedRequest<{}, {}, {
        mfaCode?: string;
        mfaRecoveryCode?: string;
    }, {}>;
    type Config = AuthenticatedRequest<{}, {}, {
        login: {
            enabled: boolean;
        };
    }, {}>;
    type ValidateRecoveryCode = AuthenticatedRequest<{}, {}, {
        recoveryCode: {
            enabled: boolean;
        };
    }, {}>;
}
export declare namespace OAuthRequest {
    namespace OAuth1Credential {
        type Auth = AuthenticatedRequest<{}, {}, {}, {
            id: string;
        }>;
        type Callback = AuthenticatedRequest<{}, {}, {}, {
            oauth_verifier: string;
            oauth_token: string;
            state: string;
        }> & {
            user?: User;
        };
    }
    namespace OAuth2Credential {
        type Auth = AuthenticatedRequest<{}, {}, {}, {
            id: string;
        }>;
        type Callback = AuthenticatedRequest<{}, {}, {}, {
            code: string;
            state: string;
            admin_consent?: string;
            error?: string;
            error_description?: string;
        }>;
    }
}
export declare namespace AnnotationTagsRequest {
    type GetAll = AuthenticatedRequest<{}, {}, {}, {
        withUsageCount: string;
    }>;
    type Create = AuthenticatedRequest<{}, {}, {
        name: string;
    }>;
    type Update = AuthenticatedRequest<{
        id: string;
    }, {}, {
        name: string;
    }>;
    type Delete = AuthenticatedRequest<{
        id: string;
    }>;
}
export declare namespace NodeRequest {
    type GetAll = AuthenticatedRequest;
    type Delete = AuthenticatedRequest<{}, {}, {}, {
        name: string;
    }>;
}
export declare namespace LicenseRequest {
    type Activate = AuthenticatedRequest<{}, {}, {
        activationKey: string;
        eulaUri?: string;
    }, {}>;
}
export declare namespace VariablesRequest {
    type CreateUpdatePayload = Omit<Variables, 'id'> & {
        id?: unknown;
    };
    type Get = AuthenticatedRequest<{
        id: string;
    }, {}, {}, {}>;
    type Create = AuthenticatedRequest<{}, {}, CreateUpdatePayload, {}>;
    type Update = AuthenticatedRequest<{
        id: string;
    }, {}, CreateUpdatePayload, {}>;
    type Delete = Get;
}
export declare namespace WorkflowHistoryRequest {
    type GetList = AuthenticatedRequest<{
        workflowId: string;
    }, Array<Omit<WorkflowHistory, 'nodes' | 'connections' | 'nodeGroups'>>, {}, ListQuery.Options>;
    type GetVersion = AuthenticatedRequest<{
        workflowId: string;
        versionId: string;
    }, WorkflowHistory>;
}
export declare namespace ActiveWorkflowRequest {
    type GetAllActive = AuthenticatedRequest;
    type GetActivationError = AuthenticatedRequest<{
        id: string;
    }>;
}
export declare namespace ProjectRequest {
    type GetMyProjectsResponse = Array<Project & {
        role: ProjectRole | AssignableProjectRole | GlobalRole;
        scopes?: Scope[];
    }>;
    type ProjectRelationResponse = {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: ProjectRole | AssignableProjectRole;
    };
    type ProjectImplicitMemberResponse = {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        globalRole: {
            slug: string;
            displayName: string;
        };
    };
    type ProjectWithRelations = {
        id: string;
        name: string | undefined;
        icon: ProjectIcon | null;
        type: ProjectType;
        description: string | null;
        customTelemetryTags: Array<{
            key: string;
            value: string;
        }>;
        creatorId: string | null;
        relations: ProjectRelationResponse[];
        implicitMembers: ProjectImplicitMemberResponse[];
        scopes: Scope[];
        rolesManaged: boolean;
    };
}
export declare namespace NpsSurveyRequest {
    type NpsSurveyUpdate = AuthenticatedRequest<{}, {}, unknown>;
}
