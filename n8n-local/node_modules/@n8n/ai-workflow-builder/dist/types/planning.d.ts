export type PlannerQuestionType = 'single' | 'multi' | 'text';
export interface PlannerQuestion {
    id: string;
    question: string;
    type: PlannerQuestionType;
    options?: string[];
}
export interface QuestionResponse {
    questionId: string;
    question: string;
    selectedOptions: string[];
    customText?: string;
    skipped?: boolean;
}
export interface PlanStep {
    description: string;
    subSteps?: string[];
    suggestedNodes?: string[];
}
export interface PlanOutput {
    summary: string;
    trigger: string;
    steps: PlanStep[];
    additionalSpecs?: string[];
}
export interface QuestionsInterruptValue {
    type: 'questions';
    introMessage?: string;
    questions: PlannerQuestion[];
}
export interface PlanInterruptValue {
    type: 'plan';
    plan: PlanOutput;
}
export interface WebFetchApprovalInterruptValue {
    type: 'web_fetch_approval';
    requestId: string;
    url: string;
    domain: string;
}
export type HITLInterruptValue = QuestionsInterruptValue | PlanInterruptValue | WebFetchApprovalInterruptValue;
export type PlanDecision = 'approve' | 'reject' | 'modify';
export type WebFetchDecision = 'allow_once' | 'allow_domain' | 'allow_all' | 'deny';
export type HITLHistoryEntry = {
    type: 'questions_answered';
    afterMessageId?: string;
    interrupt: QuestionsInterruptValue;
    answers: unknown;
} | {
    type: 'plan_decided';
    afterMessageId?: string;
    plan: PlanOutput;
    decision: PlanDecision;
    feedback?: string;
} | {
    type: 'web_fetch_decided';
    afterMessageId?: string;
    url: string;
    domain: string;
    decision: WebFetchDecision;
};
