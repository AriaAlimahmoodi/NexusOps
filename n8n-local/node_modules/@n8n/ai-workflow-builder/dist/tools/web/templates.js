"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTemplateList = fetchTemplateList;
exports.fetchTemplateByID = fetchTemplateByID;
exports.fetchWorkflowsFromTemplates = fetchWorkflowsFromTemplates;
const N8N_API_BASE_URL = 'https://api.n8n.io/api';
function isTemplateSearchResponse(data) {
    if (typeof data !== 'object' || data === null)
        return false;
    const obj = data;
    return typeof obj.totalWorkflows === 'number' && Array.isArray(obj.workflows);
}
function isTemplateFetchResponse(data) {
    if (typeof data !== 'object' || data === null)
        return false;
    const obj = data;
    return (typeof obj.id === 'number' &&
        typeof obj.name === 'string' &&
        typeof obj.workflow === 'object' &&
        obj.workflow !== null);
}
function buildSearchQueryString(query) {
    const params = new URLSearchParams();
    params.append('price', '0');
    params.append('combineWith', 'and');
    params.append('sort', 'createdAt:desc,rank:desc');
    params.append('rows', String(query.rows ?? 5));
    params.append('page', '1');
    if (query.search)
        params.append('search', query.search);
    if (query.category)
        params.append('category', query.category);
    if (query.nodes)
        params.append('nodes', query.nodes);
    return params.toString();
}
async function fetchTemplateList(query) {
    const queryString = buildSearchQueryString(query);
    const url = `${N8N_API_BASE_URL}/templates/search${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!isTemplateSearchResponse(data)) {
        throw new Error('Invalid response format from templates API');
    }
    return data;
}
async function fetchTemplateByID(id) {
    const url = `${N8N_API_BASE_URL}/workflows/templates/${id}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch template ${id}: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!isTemplateFetchResponse(data)) {
        throw new Error(`Invalid response format from template ${id} API`);
    }
    return data;
}
async function fetchWorkflowsFromTemplates(query, options) {
    const { maxTemplates, logger } = options ?? {};
    logger?.debug('Fetching workflows from templates', { query });
    const response = await fetchTemplateList(query);
    const templatesToFetch = maxTemplates
        ? response.workflows.slice(0, maxTemplates)
        : response.workflows;
    const workflowResults = await Promise.all(templatesToFetch.map(async (template) => {
        try {
            const fullWorkflow = await fetchTemplateByID(template.id);
            return {
                metadata: {
                    templateId: template.id,
                    name: template.name,
                    description: template.description,
                    workflow: fullWorkflow.workflow,
                },
                templateId: template.id,
            };
        }
        catch (error) {
            logger?.warn(`Failed to fetch full workflow for template ${template.id}`, { error });
            return null;
        }
    }));
    const validResults = workflowResults.filter((result) => result !== null);
    return {
        workflows: validResults.map((r) => r.metadata),
        totalFound: response.totalWorkflows,
        templateIds: validResults.map((r) => r.templateId),
    };
}
//# sourceMappingURL=templates.js.map