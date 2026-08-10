import { useCallback, useMemo, useReducer, useRef } from 'react';
import {
  CorporateEvidenceError,
  finalizeEvidence,
  prepareEvidence,
  uploadEvidence,
  type EvidenceGateway,
  type EvidenceUploadStep,
} from '../services/corporateEvidenceService.ts';

export type AttemptCheckpoint = 'NEW' | 'PREPARED' | 'UPLOADED' | 'FINALIZED';

export type CorporateEvidenceAttempt = {
  readonly clientRowId: string;
  readonly evidenceId: string;
  readonly idempotencyKey: string;
  readonly file: File;
  objectPath: string | null;
  checkpoint: AttemptCheckpoint;
  activeStep: EvidenceUploadStep | null;
  failedStep: EvidenceUploadStep | null;
  evidenceReference: string | null;
  error: string | null;
};

export type CorporateEvidenceTaskView = CorporateEvidenceAttempt & {
  isRunning: boolean;
  canRetry: boolean;
};

export type CorporateEvidenceAdapter = EvidenceGateway;

type State = { tasks: Map<string, CorporateEvidenceAttempt> };
type Action =
  | { type: 'START'; attempt: CorporateEvidenceAttempt }
  | {
    type: 'PATCH';
    clientRowId: string;
    evidenceId: string;
    patch: Partial<CorporateEvidenceAttempt>;
  }
  | { type: 'REMOVE'; clientRowId: string };

type Options = {
  createId?: () => string;
  onFinalized?: (clientRowId: string, evidenceReference: string) => void;
};

const defaultCreateId = () => crypto.randomUUID();
const initialState = (): State => ({ tasks: new Map() });

function reducer(state: State, action: Action): State {
  const next = new Map(state.tasks);
  if (action.type === 'START') {
    next.set(action.attempt.clientRowId, action.attempt);
    return { tasks: next };
  }
  if (action.type === 'REMOVE') {
    if (!next.delete(action.clientRowId)) return state;
    return { tasks: next };
  }

  const current = next.get(action.clientRowId);
  if (!current || current.evidenceId !== action.evidenceId) return state;
  next.set(action.clientRowId, { ...current, ...action.patch });
  return { tasks: next };
}

function safeStepError(error: unknown, step: EvidenceUploadStep): string {
  if (error instanceof CorporateEvidenceError) return error.message;
  if (step === 'prepare') return 'Persiapan unggah bukti gagal. Coba ulang.';
  if (step === 'upload') return 'Unggah file bukti gagal. Coba ulang.';
  return 'Finalisasi bukti gagal. Coba ulang.';
}

function invalidCheckpoint(step: EvidenceUploadStep): CorporateEvidenceError {
  return new CorporateEvidenceError(
    step,
    'INTERNAL_STATE_INVALID',
    'Status unggah bukti tidak valid. Pilih ulang file dan coba lagi.',
  );
}

export function useCorporateEvidenceUploads(
  adapter: CorporateEvidenceAdapter,
  { createId = defaultCreateId, onFinalized }: Options = {},
) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const activeAttempt = useRef(new Map<string, string>());
  const inFlightAttempt = useRef(new Map<string, {
    evidenceId: string;
    promise: Promise<void>;
  }>());
  const taskLookup = useRef(state.tasks);
  taskLookup.current = state.tasks;

  const isActive = useCallback(
    (clientRowId: string, evidenceId: string) => activeAttempt.current.get(clientRowId) === evidenceId,
    [],
  );

  const patch = useCallback((
    clientRowId: string,
    evidenceId: string,
    value: Partial<CorporateEvidenceAttempt>,
  ) => {
    dispatch({ type: 'PATCH', clientRowId, evidenceId, patch: value });
  }, []);

  const run = useCallback(async (initial: CorporateEvidenceAttempt): Promise<void> => {
    let attempt = initial;
    let activeStep: EvidenceUploadStep = attempt.checkpoint === 'NEW'
      ? 'prepare'
      : attempt.checkpoint === 'PREPARED'
        ? 'upload'
        : 'finalize';

    try {
      if (attempt.checkpoint === 'FINALIZED') return;

      if (attempt.checkpoint === 'NEW') {
        activeStep = 'prepare';
        patch(attempt.clientRowId, attempt.evidenceId, {
          activeStep,
          failedStep: null,
          error: null,
        });
        const { objectPath } = await prepareEvidence(adapter, {
          evidenceId: attempt.evidenceId,
          idempotencyKey: attempt.idempotencyKey,
          declaredMime: attempt.file.type,
          declaredByteSize: attempt.file.size,
        });
        if (!isActive(attempt.clientRowId, attempt.evidenceId)) return;
        attempt = { ...attempt, objectPath, checkpoint: 'PREPARED' };
        patch(attempt.clientRowId, attempt.evidenceId, {
          objectPath,
          checkpoint: 'PREPARED',
        });
      }

      if (attempt.checkpoint === 'PREPARED') {
        activeStep = 'upload';
        if (!attempt.objectPath) throw invalidCheckpoint(activeStep);
        patch(attempt.clientRowId, attempt.evidenceId, {
          activeStep,
          failedStep: null,
          error: null,
        });
        await uploadEvidence(adapter, {
          objectPath: attempt.objectPath,
          file: attempt.file,
          contentType: attempt.file.type,
        });
        if (!isActive(attempt.clientRowId, attempt.evidenceId)) return;
        attempt = { ...attempt, checkpoint: 'UPLOADED' };
        patch(attempt.clientRowId, attempt.evidenceId, { checkpoint: 'UPLOADED' });
      }

      activeStep = 'finalize';
      patch(attempt.clientRowId, attempt.evidenceId, {
        activeStep,
        failedStep: null,
        error: null,
      });
      const result = await finalizeEvidence(adapter, {
        evidenceId: attempt.evidenceId,
        idempotencyKey: attempt.idempotencyKey,
      });
      if (!isActive(attempt.clientRowId, attempt.evidenceId)) return;
      patch(attempt.clientRowId, attempt.evidenceId, {
        checkpoint: 'FINALIZED',
        activeStep: null,
        evidenceReference: result.evidenceReference,
      });
      if (isActive(attempt.clientRowId, attempt.evidenceId)) {
        onFinalized?.(attempt.clientRowId, result.evidenceReference);
      }
    } catch (error) {
      if (!isActive(attempt.clientRowId, attempt.evidenceId)) return;
      patch(attempt.clientRowId, attempt.evidenceId, {
        checkpoint: attempt.checkpoint,
        activeStep: null,
        failedStep: activeStep,
        error: safeStepError(error, activeStep),
      });
      throw error;
    }
  }, [adapter, isActive, onFinalized, patch]);

  const start = useCallback((clientRowId: string, file: File): Promise<void> => {
    const attempt: CorporateEvidenceAttempt = {
      clientRowId,
      evidenceId: createId(),
      idempotencyKey: createId(),
      file,
      objectPath: null,
      checkpoint: 'NEW',
      activeStep: null,
      failedStep: null,
      evidenceReference: null,
      error: null,
    };
    activeAttempt.current.set(clientRowId, attempt.evidenceId);
    dispatch({ type: 'START', attempt });
    const promise = run(attempt).finally(() => {
      if (inFlightAttempt.current.get(clientRowId)?.promise === promise) {
        inFlightAttempt.current.delete(clientRowId);
      }
    });
    inFlightAttempt.current.set(clientRowId, { evidenceId: attempt.evidenceId, promise });
    return promise;
  }, [createId, run]);

  const retry = useCallback((clientRowId: string): Promise<void> => {
    const current = taskLookup.current.get(clientRowId);
    if (!current) return Promise.reject(invalidCheckpoint('prepare'));
    if (current.checkpoint === 'FINALIZED') return Promise.resolve();
    const existing = inFlightAttempt.current.get(clientRowId);
    if (existing?.evidenceId === current.evidenceId) return existing.promise;
    const promise = run({ ...current, activeStep: null, failedStep: null, error: null }).finally(() => {
      if (inFlightAttempt.current.get(clientRowId)?.promise === promise) {
        inFlightAttempt.current.delete(clientRowId);
      }
    });
    inFlightAttempt.current.set(clientRowId, { evidenceId: current.evidenceId, promise });
    return promise;
  }, [run]);

  const remove = useCallback((clientRowId: string) => {
    activeAttempt.current.delete(clientRowId);
    inFlightAttempt.current.delete(clientRowId);
    dispatch({ type: 'REMOVE', clientRowId });
  }, []);

  const tasks = useMemo(() => new Map(
    [...state.tasks].map(([clientRowId, task]) => [clientRowId, {
      ...task,
      isRunning: task.activeStep !== null && task.checkpoint !== 'FINALIZED',
      canRetry: task.activeStep === null && task.checkpoint !== 'FINALIZED',
    }]),
  ), [state.tasks]);

  return {
    tasks,
    start,
    retry,
    remove,
    get: (clientRowId: string) => tasks.get(clientRowId),
  };
}
