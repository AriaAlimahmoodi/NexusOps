"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityTypes = getActivityTypes;
exports.getFilters = getFilters;
exports.getOrganizationIds = getOrganizationIds;
exports.getUserIds = getUserIds;
exports.getDeals = getDeals;
exports.getProducts = getProducts;
exports.getProductsDeal = getProductsDeal;
exports.getStageIds = getStageIds;
exports.getPersonLabels = getPersonLabels;
exports.getOrganizationLabels = getOrganizationLabels;
exports.getPersons = getPersons;
exports.getLeadLabels = getLeadLabels;
exports.getDealLabels = getDealLabels;
const transport_1 = require("../transport");
/**
 * Get all activity types
 * Uses v1 endpoint: /activityTypes
 */
async function getActivityTypes() {
    const returnData = [];
    const { data } = await transport_1.pipedriveApiRequest.call(this, 'GET', '/activityTypes', {}, {}, { apiVersion: 'v1' });
    for (const activity of data) {
        returnData.push({
            name: activity.name,
            value: activity.key_string,
        });
    }
    return (0, transport_1.sortOptionParameters)(returnData);
}
/**
 * Get all filters for a resource
 * Uses v1 endpoint: /filters
 */
async function getFilters() {
    const returnData = [];
    const resource = this.getNodeParameter('resource');
    const type = {
        deal: 'deals',
        activity: 'activity',
        person: 'people',
        organization: 'org',
    };
    const { data } = await transport_1.pipedriveApiRequest.call(this, 'GET', '/filters', {}, { type: type[resource] }, { apiVersion: 'v1' });
    for (const filter of data) {
        returnData.push({
            name: filter.name,
            value: filter.id,
        });
    }
    return (0, transport_1.sortOptionParameters)(returnData);
}
/**
 * Get all organizations
 * Uses v2 endpoint: /organizations
 */
async function getOrganizationIds() {
    const returnData = [];
    const { data } = await transport_1.pipedriveApiRequest.call(this, 'GET', '/organizations', {});
    for (const org of data) {
        returnData.push({
            name: org.name,
            value: org.id,
        });
    }
    return (0, transport_1.sortOptionParameters)(returnData);
}
/**
 * Get all users (active only)
 * Uses v1 endpoint: /users
 */
async function getUserIds() {
    const returnData = [];
    const resource = this.getCurrentNodeParameter('resource');
    const { data } = await transport_1.pipedriveApiRequest.call(this, 'GET', '/users', {}, {}, { apiVersion: 'v1' });
    for (const user of data) {
        if (user.active_flag) {
            returnData.push({
                name: user.name,
                value: user.id,
            });
        }
    }
    if (resource === 'activity') {
        returnData.push({
            name: 'All Users',
            value: 0,
        });
    }
    return (0, transport_1.sortOptionParameters)(returnData);
}
/**
 * Get all deals
 * Uses v2 endpoint: /deals
 */
async function getDeals() {
    const { data } = await transport_1.pipedriveApiRequest.call(this, 'GET', '/deals', {});
    const deals = data;
    return (0, transport_1.sortOptionParameters)(deals.map(({ id, title }) => ({ value: id, name: title })));
}
/**
 * Get all products
 * Uses v2 endpoint: /products
 */
async function getProducts() {
    const { data } = await transport_1.pipedriveApiRequest.call(this, 'GET', '/products', {});
    const products = data;
    return (0, transport_1.sortOptionParameters)(products.map(({ id, name }) => ({ value: id, name })));
}
/**
 * Get all products of a deal
 * Uses v2 endpoint: /deals/{id}/products
 */
async function getProductsDeal() {
    const dealId = this.getCurrentNodeParameter('dealId');
    const { data } = await transport_1.pipedriveApiRequest.call(this, 'GET', `/deals/${dealId}/products`, {});
    const products = data;
    return (0, transport_1.sortOptionParameters)(products.map(({ id, name }) => ({ value: id, name })));
}
/**
 * Get all stages
 * Uses v2 endpoint: /stages
 */
async function getStageIds() {
    const returnData = [];
    const { data } = await transport_1.pipedriveApiRequest.call(this, 'GET', '/stages', {});
    for (const stage of data) {
        returnData.push({
            name: `${stage.pipeline_name} > ${stage.name}`,
            value: stage.id,
        });
    }
    return (0, transport_1.sortOptionParameters)(returnData);
}
async function getLabelsForResource(endpoint) {
    const returnData = [];
    const { data } = await transport_1.pipedriveApiRequest.call(this, 'GET', endpoint, {});
    for (const field of data) {
        const fieldCode = field.field_code ?? field.key;
        if ((fieldCode === 'label' || fieldCode === 'label_ids') && field.options) {
            for (const option of field.options) {
                returnData.push({
                    name: option.label,
                    value: option.id,
                });
            }
        }
    }
    return (0, transport_1.sortOptionParameters)(returnData);
}
async function getPersonLabels() {
    return await getLabelsForResource.call(this, '/personFields');
}
async function getOrganizationLabels() {
    return await getLabelsForResource.call(this, '/organizationFields');
}
/**
 * Get all persons
 * Uses v2 endpoint: /persons
 */
async function getPersons() {
    const { data } = await transport_1.pipedriveApiRequest.call(this, 'GET', '/persons', {});
    const persons = data;
    return (0, transport_1.sortOptionParameters)(persons.map(({ id, name }) => ({ value: id, name })));
}
/**
 * Get all lead labels
 * Uses v1 endpoint: /leadLabels
 */
async function getLeadLabels() {
    const { data } = await transport_1.pipedriveApiRequest.call(this, 'GET', '/leadLabels', {}, {}, { apiVersion: 'v1' });
    const labels = data;
    return (0, transport_1.sortOptionParameters)(labels.map(({ id, name }) => ({ value: id, name })));
}
async function getDealLabels() {
    return await getLabelsForResource.call(this, '/dealFields');
}
//# sourceMappingURL=loadOptions.js.map