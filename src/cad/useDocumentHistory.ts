import { useCallback, useRef, useState } from 'react';
import type { CadDocument } from './types';

type DocumentUpdater = CadDocument | ((current: CadDocument) => CadDocument);
type UpdateOptions = {
  trackHistory?: boolean;
};

export function useDocumentHistory(initialDocument: CadDocument) {
  const [past, setPast] = useState<CadDocument[]>([]);
  const [document, setDocument] = useState<CadDocument>(initialDocument);
  const [future, setFuture] = useState<CadDocument[]>([]);
  const batchStartRef = useRef<CadDocument | null>(null);

  const updateDocument = useCallback((updater: DocumentUpdater, options: UpdateOptions = {}) => {
    setDocument((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (next === current) return current;

      if (options.trackHistory !== false) {
        setPast((items) => [...items, current].slice(-80));
        setFuture([]);
      }
      return next;
    });
  }, []);

  const beginHistoryBatch = useCallback((snapshot: CadDocument) => {
    batchStartRef.current = snapshot;
  }, []);

  const commitHistoryBatch = useCallback(() => {
    const start = batchStartRef.current;
    batchStartRef.current = null;
    if (!start) return;

    setPast((items) => [...items, start].slice(-80));
    setFuture([]);
  }, []);

  const replaceDocument = useCallback((next: CadDocument) => {
    setPast([]);
    setFuture([]);
    setDocument(next);
  }, []);

  const undo = useCallback(() => {
    setPast((items) => {
      if (items.length === 0) return items;
      const previous = items[items.length - 1];
      setDocument((current) => {
        setFuture((futureItems) => [current, ...futureItems].slice(0, 80));
        return previous;
      });
      return items.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((items) => {
      if (items.length === 0) return items;
      const next = items[0];
      setDocument((current) => {
        setPast((pastItems) => [...pastItems, current].slice(-80));
        return next;
      });
      return items.slice(1);
    });
  }, []);

  return {
    document,
    updateDocument,
    replaceDocument,
    beginHistoryBatch,
    commitHistoryBatch,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
