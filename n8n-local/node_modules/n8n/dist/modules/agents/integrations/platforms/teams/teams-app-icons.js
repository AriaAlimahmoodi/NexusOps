"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTeamsAppIcons = renderTeamsAppIcons;
exports.buildTeamsIconSvgs = buildTeamsIconSvgs;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const oklch_1 = require("@n8n/utils/color/oklch");
const is_record_1 = require("@n8n/utils/is-record");
const run_serially_1 = require("@n8n/utils/run-serially");
const n8n_workflow_1 = require("n8n-workflow");
const node_worker_threads_1 = require("node:worker_threads");
const COLOR_SIZE = 192;
const OUTLINE_SIZE = 32;
const GLYPH_RATIO = 0.6;
const GRADIENT_STOPS = 16;
const RENDER_TIMEOUT_MS = 5_000;
const WORKER_LIMITS = {
    maxYoungGenerationSizeMb: 2,
    maxOldGenerationSizeMb: 16,
    codeRangeSizeMb: 8,
    stackSizeMb: 1,
};
const renders = new Map();
async function renderTeamsAppIcons(personalisation) {
    const { icon, gradient } = (0, api_types_1.resolveAgentPersonalisation)(personalisation);
    try {
        const svgs = await buildTeamsIconSvgs(icon, gradient);
        if (!svgs)
            return undefined;
        const { color, outline } = await (0, run_serially_1.runSerially)(renders, 'teams-app-icons', async () => await rasterise(svgs));
        return { color, outline, accentColor: svgs.accentColor };
    }
    catch (error) {
        di_1.Container.get(backend_common_1.Logger).warn('Could not draw the agent icon for the Teams app', {
            icon,
            error,
        });
        return undefined;
    }
}
async function buildTeamsIconSvgs(iconName, gradient) {
    const { icons: lucide } = await import('@iconify-json/lucide');
    if (!Object.hasOwn(lucide.icons, iconName))
        return undefined;
    const icon = lucide.icons[iconName];
    const viewBox = `0 0 ${icon.width ?? lucide.width ?? 24} ${icon.height ?? lucide.height ?? 24}`;
    const glyph = icon.body.replaceAll('currentColor', '#FFFFFF');
    const colorAt = (0, oklch_1.oklchMixer)(gradient.from, gradient.to);
    const glyphSize = COLOR_SIZE * GLYPH_RATIO;
    const offset = (COLOR_SIZE - glyphSize) / 2;
    return {
        color: svg(COLOR_SIZE, `0 0 ${COLOR_SIZE} ${COLOR_SIZE}`, `${gradientDefinition(gradient, colorAt)}<rect width="${COLOR_SIZE}" height="${COLOR_SIZE}" fill="url(#g)"/>` +
            `<svg x="${offset}" y="${offset}" width="${glyphSize}" height="${glyphSize}" viewBox="${viewBox}">${glyph}</svg>`),
        outline: svg(OUTLINE_SIZE, viewBox, glyph),
        accentColor: (0, oklch_1.rgbToHex)(colorAt(stopProgress(gradient, 0.5))),
    };
}
function svg(size, viewBox, content) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">${content}</svg>`;
}
function gradientDefinition(gradient, colorAt) {
    const radians = (gradient.angle * Math.PI) / 180;
    const [ux, uy] = [Math.sin(radians), -Math.cos(radians)];
    const half = (COLOR_SIZE * (Math.abs(ux) + Math.abs(uy))) / 2;
    const centre = COLOR_SIZE / 2;
    const stops = Array.from({ length: GRADIENT_STOPS + 1 }, (_, i) => {
        const progress = i / GRADIENT_STOPS;
        const offset = (gradient.fromStop + (gradient.toStop - gradient.fromStop) * progress) / 100;
        return `<stop offset="${offset}" stop-color="${(0, oklch_1.rgbToHex)(colorAt(progress))}"/>`;
    }).join('');
    return ('<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" spreadMethod="pad" ' +
        `x1="${centre - ux * half}" y1="${centre - uy * half}" x2="${centre + ux * half}" y2="${centre + uy * half}">` +
        `${stops}</linearGradient></defs>`);
}
function stopProgress({ fromStop, toStop }, position) {
    return Math.max(0, Math.min(1, (position - fromStop / 100) / ((toStop - fromStop) / 100)));
}
const WORKER_SOURCE = `
const { parentPort, workerData } = require('node:worker_threads');
const { readFileSync } = require('node:fs');
const { initWasm, Resvg } = require(workerData.modulePath);
initWasm(readFileSync(workerData.wasmPath)).then(() => {
	const render = (svg) => {
		const image = new Resvg(svg).render();
		const png = image.asPng();
		image.free();
		return png;
	};
	parentPort.postMessage({ color: render(workerData.color), outline: render(workerData.outline) });
});
`;
async function rasterise(svgs) {
    const worker = new node_worker_threads_1.Worker(WORKER_SOURCE, {
        eval: true,
        resourceLimits: WORKER_LIMITS,
        workerData: {
            modulePath: require.resolve('@resvg/resvg-wasm'),
            wasmPath: require.resolve('@resvg/resvg-wasm/index_bg.wasm'),
            color: svgs.color,
            outline: svgs.outline,
        },
    });
    try {
        const result = await new Promise((resolve, reject) => {
            let timer;
            worker.once('online', () => {
                timer = setTimeout(() => reject(new n8n_workflow_1.UnexpectedError('Rendering the Teams app icons timed out')), RENDER_TIMEOUT_MS);
            });
            worker.once('message', (message) => {
                clearTimeout(timer);
                resolve(message);
            });
            worker.once('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
            worker.once('exit', (code) => {
                if (code === 0)
                    return;
                clearTimeout(timer);
                reject(new n8n_workflow_1.UnexpectedError(`The icon renderer exited with code ${code}`));
            });
        });
        if (!(0, is_record_1.isRecord)(result) ||
            !(result.color instanceof Uint8Array) ||
            !(result.outline instanceof Uint8Array)) {
            throw new n8n_workflow_1.UnexpectedError('The icon renderer returned no images');
        }
        return { color: Buffer.from(result.color), outline: Buffer.from(result.outline) };
    }
    finally {
        await worker.terminate();
    }
}
//# sourceMappingURL=teams-app-icons.js.map