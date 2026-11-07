import type { InstanceAiQuestion } from '@n8n/api-types';
interface OnboardingOpening {
    title: string;
    greeting: string;
    questions: InstanceAiQuestion[];
    followUp: string;
}
export declare const ONBOARDING_OPENING: OnboardingOpening;
export {};
