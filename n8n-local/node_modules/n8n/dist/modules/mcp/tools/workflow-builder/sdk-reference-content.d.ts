export type SdkReferenceSection = 'patterns' | 'patterns_detailed' | 'expressions' | 'functions' | 'rules' | 'import' | 'guidelines' | 'design' | 'groups' | 'all';
export declare function getSdkReferenceContent(section?: SdkReferenceSection): string;
