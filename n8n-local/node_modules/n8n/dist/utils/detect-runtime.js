"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectRuntime = detectRuntime;
exports.detectKubernetesProvider = detectKubernetesProvider;
function detectRuntime(env, isDocker) {
    if (env.ECS_CONTAINER_METADATA_URI_V4 || env.ECS_CONTAINER_METADATA_URI)
        return 'ecs';
    if (env.CONTAINER_APP_NAME)
        return 'azure-container-apps';
    if (env.WEBSITE_SITE_NAME)
        return 'azure-app-service';
    if (env.K_SERVICE && !env.KUBERNETES_SERVICE_HOST)
        return 'cloud-run';
    if (env.KUBERNETES_SERVICE_HOST)
        return 'kubernetes';
    return isDocker ? 'docker' : 'other';
}
function detectKubernetesProvider(osRelease) {
    if (osRelease.includes('-azure'))
        return 'azure';
    if (osRelease.includes('-gke') || osRelease.includes('-gcp'))
        return 'gcp';
    if (osRelease.includes('amzn2') || osRelease.includes('-aws'))
        return 'aws';
    return 'other';
}
//# sourceMappingURL=detect-runtime.js.map