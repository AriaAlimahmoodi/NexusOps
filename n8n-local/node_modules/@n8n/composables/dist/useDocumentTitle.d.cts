import { Ref } from "vue";

//#region src/useDocumentTitle.d.ts
type WorkflowTitleStatus = 'EXECUTING' | 'IDLE' | 'ERROR' | 'DEBUG' | 'AI_BUILDING' | 'AI_DONE';
interface UseDocumentTitleOptions {
  releaseChannel?: string;
  windowRef?: Ref<Window | undefined>;
}
declare function useDocumentTitle(options?: UseDocumentTitleOptions): {
  set: (title: string) => void;
  reset: () => void;
  setDocumentTitle: (workflowName: string, status: WorkflowTitleStatus) => void;
  getDocumentState: () => WorkflowTitleStatus | undefined;
};
//#endregion
export { UseDocumentTitleOptions, WorkflowTitleStatus, useDocumentTitle };
//# sourceMappingURL=useDocumentTitle.d.cts.map