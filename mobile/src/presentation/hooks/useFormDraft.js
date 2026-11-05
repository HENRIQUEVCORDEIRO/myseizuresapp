import { useEffect, useRef, useState } from 'react';

export function useFormDraft({ formType, manageFormDraft, onRestore, patientId, payload }) {
  const [draftRestored, setDraftRestored] = useState(false);
  const [ready, setReady] = useState(!manageFormDraft);
  const skipNextSave = useRef(true);
  const payloadRef = useRef(payload);
  const onRestoreRef = useRef(onRestore);

  payloadRef.current = payload;
  onRestoreRef.current = onRestore;

  const payloadKey = JSON.stringify(payload);

  useEffect(() => {
    let cancelled = false;

    if (!manageFormDraft) {
      setReady(true);
      return undefined;
    }

    async function restoreDraft() {
      try {
        const draft = await manageFormDraft.load({ patientId, formType });

        if (!cancelled && draft?.payload) {
          onRestoreRef.current(draft.payload);
          setDraftRestored(true);
        }
      } catch {
        // A draft is best-effort local recovery; the form remains usable if it fails.
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void restoreDraft();

    return () => {
      cancelled = true;
    };
  }, [formType, manageFormDraft, patientId]);

  useEffect(() => {
    if (!manageFormDraft || !ready) return;

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    void manageFormDraft.save({ patientId, formType, payload: payloadRef.current });
  }, [formType, manageFormDraft, patientId, payloadKey, ready]);

  async function clearDraft() {
    if (!manageFormDraft) return;

    skipNextSave.current = true;

    try {
      await manageFormDraft.clear({ patientId, formType });
    } catch {
      // The clinical record is already saved; a stale draft is preferable to a failed save.
    }

    setDraftRestored(false);
  }

  return { clearDraft, draftRestored };
}
