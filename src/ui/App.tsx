import {
  ClipboardPaste,
  Circle,
  Copy,
  Crosshair,
  DraftingCompass,
  FileDown,
  FileText,
  FileUp,
  Grid3X3,
  Hand,
  Magnet,
  MousePointer2,
  Move,
  Plus,
  Redo2,
  Save,
  Share2,
  Square,
  Trash2,
  Type,
  Undo2,
  Waypoints,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { createClipboardPayload, pasteClipboardPayload } from '../cad/clipboard';
import type { CadClipboardPayload } from '../cad/clipboard';
import { LocalCollaborationRepository } from '../cad/collaboration';
import type { CollaborationState, ServerDocumentRecord } from '../cad/collaboration';
import {
  alignEntities,
  type AlignMode,
  createGroupEntity,
  getBoundsCenter,
  getSelectionBounds,
  rotateEntity,
} from '../cad/entityTransform';
import { summarizeConversionWarnings } from '../cad/io/conversionWarnings';
import { ConversionApiError, type ConversionProgress } from '../cad/io/conversionApiClient';
import { FileManager } from '../cad/io/fileManager';
import {
  canUseFileSystemAccess,
  pickSaveFile,
  type SimpleFileHandle,
  writeBlobToFileHandle,
} from '../cad/io/fileSystemAccess';
import { sampleDocument } from '../cad/sampleDocument';
import type { CadDocument, CadEntity, CadFileType, CadLayer, CadPoint, ToolId, Viewport } from '../cad/types';
import { useDocumentHistory } from '../cad/useDocumentHistory';
import type { DocumentHistorySnapshot } from '../cad/useDocumentHistory';
import { CadCanvas } from './CadCanvas';

const tools: Array<{ id: ToolId; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: 'select', label: '선택', icon: MousePointer2 },
  { id: 'pan', label: '화면 이동', icon: Hand },
  { id: 'line', label: '선', icon: Move },
  { id: 'rect', label: '사각형', icon: Square },
  { id: 'circle', label: '원', icon: Circle },
  { id: 'polyline', label: '폴리라인', icon: Waypoints },
  { id: 'dimension', label: '치수', icon: DraftingCompass },
  { id: 'text', label: '텍스트', icon: Type },
  { id: 'erase', label: '삭제', icon: Trash2 },
];

const fileManager = new FileManager();
const collaborationRepository = new LocalCollaborationRepository();
const maxAutosaveEntities = 4000;
const recentStorageKey = 'simplecad.recentDocuments';

type WorkspaceTab = {
  id: string;
  title: string;
  document: CadDocument;
  history: DocumentHistorySnapshot;
  saveState: SaveState;
  collaborationState: CollaborationState;
  viewport: Viewport;
  selectedEntityIds: string[];
  lastOpenedAt: string;
};

type SaveState = {
  targetName: string;
  targetType: CadFileType;
  fileHandle?: SimpleFileHandle;
  fileHandleAvailable: boolean;
  revision: number;
  savedRevision: number;
  lastSavedAt?: string;
  isSaving: boolean;
};

type RecentDocument = {
  id: string;
  title: string;
  document: CadDocument;
  lastOpenedAt: string;
};

type ContextMenuState = {
  x: number;
  y: number;
  worldPoint: CadPoint;
};

type ReferenceMode = 'copy-base' | 'paste-base' | null;

type DimensionEntity = Extract<CadEntity, { type: 'dimension' }>;
type GroupEntity = Extract<CadEntity, { type: 'group' }>;
type CadEntityPatch = Partial<CadEntity> & Partial<DimensionEntity>;

function formatDimensionLabel(entity: DimensionEntity): string {
  return Math.hypot(
    entity.endPoint.x - entity.startPoint.x,
    entity.endPoint.y - entity.startPoint.y,
  ).toFixed(1);
}

function toReferencePreviewEntity(entity: CadEntity): CadEntity {
  if (entity.type === 'group') {
    return {
      ...entity,
      id: `reference-preview-${entity.id}`,
      locked: true,
      children: entity.children.map(toReferencePreviewEntity),
    };
  }

  return {
    ...entity,
    id: `reference-preview-${entity.id}`,
    strokeColor: '#0f766e',
    fillColor: entity.type === 'text' || entity.type === 'dimension'
      ? '#0f766e'
      : 'rgba(15, 118, 110, 0.08)',
    strokeStyle: 'dashed',
    locked: true,
  } as CadEntity;
}

export function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('select');
  const {
    document,
    updateDocument: updateHistoryDocument,
    getSnapshot,
    loadSnapshot,
    beginHistoryBatch,
    commitHistoryBatch,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDocumentHistory(sampleDocument);
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>(() => readRecentDocuments());
  const [serverDocuments, setServerDocuments] = useState<ServerDocumentRecord[]>(() =>
    collaborationRepository.listDocuments(),
  );
  const [saveState, setSaveState] = useState<SaveState>(() => createSaveState(sampleDocument));
  const [collaborationState, setCollaborationState] = useState<CollaborationState>(() => createCollaborationState());
  const [viewport, setViewport] = useState<Viewport>({ offsetX: 480, offsetY: 320, scale: 1 });
  const [cursor, setCursor] = useState<CadPoint>({ x: 0, y: 0 });
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>(['rect-1']);
  const [gridVisible, setGridVisible] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [fileMessage, setFileMessage] = useState('자동 저장 준비됨');
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  const [cadClipboard, setCadClipboard] = useState<CadClipboardPayload | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>(null);
  const [referencePreviewPoint, setReferencePreviewPoint] = useState<CadPoint | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState('15');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadedShareTokenRef = useRef<string | null>(null);
  const selectedEntities = useMemo(
    () => document.entities.filter((entity) => selectedEntityIds.includes(entity.id)),
    [document.entities, selectedEntityIds],
  );
  const selectedEntity = useMemo(
    () =>
      selectedEntityIds.length === 1
        ? document.entities.find((entity) => entity.id === selectedEntityIds[0]) ?? null
        : null,
    [document.entities, selectedEntityIds],
  );
  const conversionWarnings = useMemo(() => summarizeConversionWarnings(document), [document]);
  const selectionHasGroup = selectedEntities.some((entity) => entity.type === 'group');
  const referencePreviewEntities = useMemo(() => {
    if (referenceMode !== 'paste-base' || !cadClipboard?.sourceBasePoint || !referencePreviewPoint) {
      return [];
    }

    return pasteClipboardPayload(cadClipboard, {
      destinationDocument: document,
      destinationBasePoint: referencePreviewPoint,
    }).entities.map(toReferencePreviewEntity);
  }, [cadClipboard, document, referenceMode, referencePreviewPoint]);
  const canvasApiRef = useRef<{ zoomBy: (factor: number) => void } | null>(null);
  const activeDirty = isSaveStateDirty(saveState);
  const anyDirty = activeDirty || tabs.some((tab) => tab.id !== activeTabId && isSaveStateDirty(tab.saveState));
  const serverStatus = formatServerState(collaborationState, saveState.revision);
  const activeReadonly = collaborationState.readonly;

  const markDirty = useCallback(() => {
    setSaveState((current) => ({
      ...current,
      revision: current.revision + 1,
    }));
  }, []);

  const updateDocument = useCallback(
    (
      updater: CadDocument | ((current: CadDocument) => CadDocument),
      options: { trackHistory?: boolean } = {},
    ) => {
      if (collaborationState.readonly) {
        setFileMessage('읽기 전용 공유 문서는 편집할 수 없습니다.');
        return;
      }
      updateHistoryDocument(updater, options);
      markDirty();
    },
    [collaborationState.readonly, markDirty, updateHistoryDocument],
  );

  const undoDocument = useCallback(() => {
    if (collaborationState.readonly) return;
    if (!canUndo) return;
    undo();
    markDirty();
  }, [canUndo, collaborationState.readonly, markDirty, undo]);

  const redoDocument = useCallback(() => {
    if (collaborationState.readonly) return;
    if (!canRedo) return;
    redo();
    markDirty();
  }, [canRedo, collaborationState.readonly, markDirty, redo]);

  const setCanvasApi = useCallback((api: { zoomBy: (factor: number) => void }) => {
    canvasApiRef.current = api;
  }, []);

  const persistRecentDocument = useCallback((title: string, nextDocument = document) => {
    if (nextDocument.entities.length > maxAutosaveEntities) return;

    const recent: RecentDocument = {
      id: `${Date.now()}`,
      title,
      document: stripRuntimeFileState(nextDocument),
      lastOpenedAt: new Date().toISOString(),
    };
    setRecentDocuments((items) => {
      const next = [recent, ...items.filter((item) => item.title !== title)].slice(0, 8);
      localStorage.setItem(recentStorageKey, JSON.stringify(next));
      return next;
    });
  }, [document]);

  const downloadBlob = useCallback((blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleConversionProgress = useCallback((progress: ConversionProgress) => {
    setConversionProgress(progress);
    if (progress.message) setFileMessage(progress.message);
  }, []);

  const saveCurrentDocument = useCallback(async () => {
    if (!activeTabId) return;
    if (collaborationState.readonly) {
      setFileMessage('읽기 전용 공유 문서는 원본 저장을 할 수 없습니다.');
      return;
    }

    try {
      setSaveState((current) => ({ ...current, isSaving: true }));
      setFileMessage(`${saveState.targetType.toUpperCase()} 파일을 저장하는 중...`);
      const blob = await fileManager.save(
        document,
        {
          fileName: saveState.targetName,
          type: saveState.targetType,
        },
        saveState.targetType === 'dwg' ? { onProgress: handleConversionProgress } : undefined,
      );
      let wroteToHandle = false;
      if (saveState.fileHandle) {
        try {
          await writeBlobToFileHandle(blob, saveState.fileHandle);
          wroteToHandle = true;
        } catch {
          downloadBlob(blob, withExtension(saveState.targetName, saveState.targetType));
        }
      } else {
        downloadBlob(blob, withExtension(saveState.targetName, saveState.targetType));
      }

      const savedAt = new Date().toISOString();
      const savedDocument = withSourceFile(document, {
        name: saveState.fileHandle?.name ?? withExtension(saveState.targetName, saveState.targetType),
        type: saveState.targetType,
        lastSavedAt: savedAt,
        fileHandleAvailable: wroteToHandle,
      });
      updateHistoryDocument(savedDocument, { trackHistory: false });
      setSaveState((current) => ({
        ...current,
        targetName: saveState.fileHandle?.name ?? current.targetName,
        savedRevision: current.revision,
        lastSavedAt: savedAt,
        fileHandleAvailable: wroteToHandle,
        isSaving: false,
      }));
      persistRecentDocument(savedDocument.name, savedDocument);
      setFileMessage(
        wroteToHandle
          ? `${saveState.targetType.toUpperCase()} 파일에 저장했습니다.`
          : `${saveState.targetType.toUpperCase()} 파일을 다운로드로 저장했습니다.`,
      );
      setConversionProgress(null);
    } catch (error) {
      setSaveState((current) => ({ ...current, isSaving: false }));
      setConversionProgress(null);
      setFileMessage(formatConversionError(error, '저장에 실패했습니다.'));
    }
  }, [activeTabId, collaborationState.readonly, document, downloadBlob, handleConversionProgress, persistRecentDocument, saveState, updateHistoryDocument]);

  const saveAs = useCallback(
    async (type: CadFileType) => {
      if (!activeTabId) return;
      try {
        setSaveState((current) => ({ ...current, isSaving: true }));
        setFileMessage(`${type.toUpperCase()} 파일을 준비하는 중...`);
        const suggestedName = withExtension(saveState.targetName || document.name, type);
        const blob = await fileManager.save(
          document,
          {
            fileName: suggestedName,
            type,
          },
          type === 'dwg' ? { onProgress: handleConversionProgress } : undefined,
        );
        let handle: SimpleFileHandle | undefined;
        let wroteToHandle = false;
        if (canUseFileSystemAccess()) {
          try {
            handle = await pickSaveFile({ suggestedName, type }) ?? undefined;
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
              setSaveState((current) => ({ ...current, isSaving: false }));
              setFileMessage('저장을 취소했습니다.');
              return;
            }
            throw error;
          }
        }

        if (handle) {
          await writeBlobToFileHandle(blob, handle);
          wroteToHandle = true;
        } else {
          downloadBlob(blob, withExtension(suggestedName, type));
        }

        const savedAt = new Date().toISOString();
        if (isDocumentSourceType(type) && !collaborationState.readonly) {
          const savedDocument = withSourceFile(document, {
            name: handle?.name ?? withExtension(suggestedName, type),
            type,
            lastSavedAt: savedAt,
            fileHandleAvailable: wroteToHandle,
          });
          updateHistoryDocument(savedDocument, { trackHistory: false });
          setSaveState((current) => ({
            ...current,
            targetName: handle?.name ?? withExtension(suggestedName, type),
            targetType: type,
            fileHandle: handle,
            fileHandleAvailable: wroteToHandle,
            savedRevision: current.revision,
            lastSavedAt: savedAt,
            isSaving: false,
          }));
          persistRecentDocument(savedDocument.name, savedDocument);
        } else {
          setSaveState((current) => ({ ...current, isSaving: false }));
        }

        setFileMessage(
          wroteToHandle
            ? `${type.toUpperCase()} 파일에 저장했습니다.`
            : `${type.toUpperCase()} 파일을 다운로드로 저장했습니다.`,
        );
        setConversionProgress(null);
      } catch (error) {
        setSaveState((current) => ({ ...current, isSaving: false }));
        setConversionProgress(null);
        setFileMessage(formatConversionError(error, `${type.toUpperCase()} 내보내기에 실패했습니다.`));
      }
    },
    [
      activeTabId,
      collaborationState.readonly,
      document,
      downloadBlob,
      handleConversionProgress,
      persistRecentDocument,
      saveState.targetName,
      updateHistoryDocument,
    ],
  );

  const activateTab = useCallback((tabId: string) => {
    const nextTab = tabs.find((tab) => tab.id === tabId);
    if (!nextTab) return;
    const currentSnapshot = getSnapshot();
    setTabs((items) =>
      items.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              document: currentSnapshot.document,
              history: currentSnapshot,
              saveState,
              collaborationState,
              viewport,
              selectedEntityIds,
              lastOpenedAt: new Date().toISOString(),
            }
          : tab,
      ),
    );
    setActiveTabId(tabId);
    loadSnapshot(nextTab.history);
    setSaveState(nextTab.saveState);
    setCollaborationState(nextTab.collaborationState);
    setViewport(nextTab.viewport);
    setSelectedEntityIds(nextTab.selectedEntityIds);
    setFileMessage(`${nextTab.title} 탭을 열었습니다.`);
  }, [activeTabId, collaborationState, getSnapshot, loadSnapshot, saveState, selectedEntityIds, tabs, viewport]);

  const createTab = useCallback((
    title: string,
    nextDocument: CadDocument,
    nextSaveState = createSaveState(nextDocument, title),
    nextCollaborationState = createCollaborationState(),
  ) => {
    const history: DocumentHistorySnapshot = {
      document: nextDocument,
      past: [],
      future: [],
    };
    const tab: WorkspaceTab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      document: nextDocument,
      history,
      saveState: nextSaveState,
      collaborationState: nextCollaborationState,
      viewport: { offsetX: 480, offsetY: 320, scale: 1 },
      selectedEntityIds: [],
      lastOpenedAt: new Date().toISOString(),
    };
    setTabs((items) => [...items, tab]);
    setActiveTabId(tab.id);
    loadSnapshot(history);
    setSaveState(nextSaveState);
    setCollaborationState(nextCollaborationState);
    setViewport(tab.viewport);
    setSelectedEntityIds([]);
    persistRecentDocument(title, nextDocument);
  }, [loadSnapshot, persistRecentDocument]);

  const createNewDrawing = useCallback(() => {
    createTab(`새 도면 ${tabs.length + 1}`, {
      ...sampleDocument,
      id: `document-${Date.now()}`,
      name: `새 도면 ${tabs.length + 1}`,
      entities: [],
    });
  }, [createTab, tabs.length]);

  const closeTab = useCallback((tabId: string) => {
    const targetTab = tabs.find((tab) => tab.id === tabId);
    const targetSaveState = tabId === activeTabId ? saveState : targetTab?.saveState;
    if (targetSaveState && isSaveStateDirty(targetSaveState)) {
      const ok = window.confirm(`${targetTab?.title ?? '도면'}에 저장하지 않은 변경사항이 있습니다. 닫을까요?`);
      if (!ok) return;
    }

    setTabs((items) => {
      const next = items.filter((tab) => tab.id !== tabId);
      if (tabId === activeTabId) {
        const fallback = next[next.length - 1] ?? null;
        setActiveTabId(fallback?.id ?? null);
        if (fallback) {
          loadSnapshot(fallback.history);
          setSaveState(fallback.saveState);
          setCollaborationState(fallback.collaborationState);
          setViewport(fallback.viewport);
          setSelectedEntityIds(fallback.selectedEntityIds);
        } else {
          setSaveState(createSaveState(sampleDocument));
          setCollaborationState(createCollaborationState());
          setSelectedEntityIds([]);
        }
      }
      return next;
    });
  }, [activeTabId, loadSnapshot, saveState, tabs]);

  const openFile = useCallback(async (file: File) => {
    try {
      const fileType = fileTypeFromName(file.name);
      const nextDocument = await fileManager.open(
        file,
        fileType === 'dwg' ? { onProgress: handleConversionProgress } : undefined,
      );
      const openedDocument = {
        ...nextDocument,
        name: nextDocument.name || file.name,
        sourceFile: {
          name: file.name,
          type: fileType,
          lastSavedAt: new Date().toISOString(),
          fileHandleAvailable: false,
        },
      };
      createTab(file.name, openedDocument);
      setFileMessage(`${file.name} 파일을 열었습니다.`);
      setConversionProgress(null);
    } catch (error) {
      setConversionProgress(null);
      setFileMessage(formatConversionError(error, '파일을 열 수 없습니다.'));
    }
  }, [createTab, handleConversionProgress]);

  useEffect(() => {
    if (!activeTabId) return;
    const snapshot = getSnapshot();
    setTabs((items) =>
      items.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              document: snapshot.document,
              history: snapshot,
              saveState,
              collaborationState,
              viewport,
              selectedEntityIds,
              lastOpenedAt: new Date().toISOString(),
            }
          : tab,
      ),
    );
  }, [activeTabId, collaborationState, getSnapshot, saveState, selectedEntityIds, viewport]);

  const openRecentDocument = useCallback((recent: RecentDocument) => {
    createTab(recent.title, {
      ...recent.document,
      id: `recent-${Date.now()}`,
      sourceFile: {
        ...(recent.document.sourceFile ?? { type: 'json' as const, name: recent.title }),
        lastSavedAt: recent.lastOpenedAt,
      },
    });
  }, [createTab]);

  const saveDocumentToServer = useCallback((): ServerDocumentRecord | null => {
    if (!activeTabId || collaborationState.readonly) return null;
    const record = collaborationRepository.saveDocument({
      id: collaborationState.serverDocumentId,
      title: document.name || saveState.targetName || 'Untitled',
      document: stripRuntimeFileState(document),
    });
    const nextCollaborationState = createCollaborationState({
      serverDocumentId: record.id,
      shareToken: record.shareToken,
      lastServerSavedAt: record.updatedAt,
      serverSavedRevision: saveState.revision,
    });
    setCollaborationState(nextCollaborationState);
    setServerDocuments(collaborationRepository.listDocuments());
    persistRecentDocument(record.title, record.document);
    setFileMessage(`${record.title} 서버 저장됨`);
    return record;
  }, [
    activeTabId,
    collaborationState.readonly,
    collaborationState.serverDocumentId,
    document,
    persistRecentDocument,
    saveState.revision,
    saveState.targetName,
  ]);

  const saveToServer = useCallback(() => {
    saveDocumentToServer();
  }, [saveDocumentToServer]);

  const createShareLink = useCallback(async () => {
    if (!activeTabId || collaborationState.readonly) return;
    const savedRecord =
      collaborationState.serverDocumentId
        ? collaborationRepository.openDocument(collaborationState.serverDocumentId)
        : saveDocumentToServer();
    const record = savedRecord ?? saveDocumentToServer();
    if (!record) {
      setFileMessage('공유할 서버 도면을 저장할 수 없습니다.');
      return;
    }

    const shareLink = collaborationRepository.createShareLink(record.id);
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('share', shareLink.token);
    setCollaborationState((current) => ({
      ...current,
      serverDocumentId: record.id,
      shareToken: shareLink.token,
      readonly: false,
    }));
    setServerDocuments(collaborationRepository.listDocuments());
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl.toString()).catch(() => undefined);
    }
    setFileMessage('공유 링크를 만들었습니다.');
  }, [activeTabId, collaborationState.readonly, collaborationState.serverDocumentId, saveDocumentToServer]);

  const openServerDocument = useCallback((record: ServerDocumentRecord) => {
    const serverRecord = collaborationRepository.openDocument(record.id);
    if (!serverRecord) {
      setServerDocuments(collaborationRepository.listDocuments());
      setFileMessage('서버 도면을 열 수 없습니다.');
      return;
    }
    createTab(
      serverRecord.title,
      {
        ...serverRecord.document,
        id: `server-${Date.now()}`,
        name: serverRecord.document.name || serverRecord.title,
      },
      createSaveState(serverRecord.document, serverRecord.title),
      createCollaborationState({
        serverDocumentId: serverRecord.id,
        shareToken: serverRecord.shareToken,
        lastServerSavedAt: serverRecord.updatedAt,
        serverSavedRevision: 0,
        readonly: serverRecord.readonly ?? false,
      }),
    );
    setFileMessage(`${serverRecord.title} 서버 도면을 열었습니다.`);
  }, [createTab]);

  useEffect(() => {
    const shareToken = new URLSearchParams(window.location.search).get('share');
    if (!shareToken || loadedShareTokenRef.current === shareToken) return;
    loadedShareTokenRef.current = shareToken;

    const sharedRecord = collaborationRepository.resolveShareLink(shareToken);
    if (!sharedRecord) {
      setFileMessage('공유 링크 도면을 찾을 수 없습니다.');
      return;
    }

    createTab(
      sharedRecord.title,
      {
        ...sharedRecord.document,
        id: `shared-${Date.now()}`,
        name: sharedRecord.document.name || sharedRecord.title,
      },
      createSaveState(sharedRecord.document, sharedRecord.title),
      createCollaborationState({
        serverDocumentId: sharedRecord.id,
        shareToken,
        lastServerSavedAt: sharedRecord.updatedAt,
        serverSavedRevision: 0,
        readonly: true,
      }),
    );
    setActiveTool('select');
    setFileMessage('읽기 전용 공유 문서를 열었습니다.');
  }, [createTab]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const selectTool = useCallback((toolId: ToolId) => {
    setActiveTool(toolId);
    setContextMenu(null);
    if (toolId === 'text') {
      setFileMessage('텍스트를 넣을 위치를 캔버스에서 클릭하세요.');
    }
  }, []);

  const copySelectedEntities = useCallback(() => {
    const selectedEntities = document.entities.filter((entity) => selectedEntityIds.includes(entity.id));
    if (!selectedEntities.length) {
      setFileMessage('복사할 객체를 선택하세요.');
      return;
    }

    setCadClipboard(createClipboardPayload(selectedEntities));
    closeContextMenu();
    setFileMessage('선택 객체를 복사했습니다.');
  }, [closeContextMenu, document.entities, selectedEntityIds]);

  const pasteEntities = useCallback(() => {
    if (collaborationState.readonly) {
      setFileMessage('읽기 전용 공유 문서는 편집할 수 없습니다.');
      return;
    }
    if (!cadClipboard) {
      setFileMessage('복사된 객체가 없습니다.');
      return;
    }
    if (cadClipboard.sourceBasePoint) {
      closeContextMenu();
      setReferencePreviewPoint(null);
      setReferenceMode('paste-base');
      setFileMessage('참조 복사된 객체입니다. 붙여넣을 대응 기준점을 선택하세요.');
      return;
    }

    const pasted = pasteClipboardPayload(cadClipboard, {
      destinationDocument: document,
      fallbackOffset: { x: 20, y: 20 },
    });
    updateDocument((current) => ({
      ...current,
      entities: [...current.entities, ...pasted.entities],
    }));
    setSelectedEntityIds(pasted.entityIds);
    closeContextMenu();
    setFileMessage('객체를 붙여넣었습니다.');
  }, [cadClipboard, closeContextMenu, collaborationState.readonly, document, updateDocument]);

  const startReferenceCopy = useCallback(() => {
    if (!selectedEntityIds.length) {
      setFileMessage('복사할 객체를 선택하세요.');
      return;
    }

    closeContextMenu();
    setReferencePreviewPoint(null);
    setReferenceMode('copy-base');
    setFileMessage('참조할 다른 객체의 중심점, 끝점, 교차점을 선택하세요.');
  }, [closeContextMenu, selectedEntityIds.length]);

  const startReferencePaste = useCallback(() => {
    if (collaborationState.readonly) {
      setFileMessage('읽기 전용 공유 문서는 편집할 수 없습니다.');
      return;
    }
    if (!cadClipboard) {
      setFileMessage('복사된 객체가 없습니다.');
      return;
    }
    if (!cadClipboard.sourceBasePoint) {
      setFileMessage('참조 기준점이 없는 복사본입니다. 참조 복사를 먼저 실행하세요.');
      return;
    }

    closeContextMenu();
    setReferencePreviewPoint(null);
    setReferenceMode('paste-base');
    setFileMessage('붙여넣을 파일에서 대응되는 중심점, 끝점, 교차점을 선택하세요.');
  }, [cadClipboard, closeContextMenu, collaborationState.readonly]);

  const handleReferencePointPick = useCallback(
    (point: CadPoint) => {
      if (referenceMode === 'copy-base') {
        const selectedEntities = document.entities.filter((entity) => selectedEntityIds.includes(entity.id));
        if (!selectedEntities.length) {
          setReferenceMode(null);
          setReferencePreviewPoint(null);
          setFileMessage('복사할 객체를 선택하세요.');
          return;
        }

        setCadClipboard(createClipboardPayload(selectedEntities, point));
        setReferenceMode(null);
        setReferencePreviewPoint(null);
        setFileMessage('참조 기준점과 함께 복사했습니다.');
        return;
      }

      if (referenceMode === 'paste-base') {
        if (!cadClipboard) {
          setReferenceMode(null);
          setReferencePreviewPoint(null);
          setFileMessage('복사된 객체가 없습니다.');
          return;
        }
        if (!cadClipboard.sourceBasePoint) {
          setReferenceMode(null);
          setReferencePreviewPoint(null);
          setFileMessage('참조 기준점이 없는 복사본입니다. 참조 복사를 먼저 실행하세요.');
          return;
        }

        const pasted = pasteClipboardPayload(cadClipboard, {
          destinationDocument: document,
          destinationBasePoint: point,
        });
        updateDocument((current) => ({
          ...current,
          entities: [...current.entities, ...pasted.entities],
        }));
        setSelectedEntityIds(pasted.entityIds);
        setReferenceMode(null);
        setReferencePreviewPoint(null);
        setFileMessage('참조 위치에 붙여넣었습니다.');
      }
    },
    [cadClipboard, document, referenceMode, selectedEntityIds, updateDocument],
  );

  const openCanvasContextMenu = useCallback(
    (payload: { screenPoint: CadPoint; worldPoint: CadPoint; entityId: string | null }) => {
      if (!activeTabId) return;
      if (payload.entityId && !selectedEntityIds.includes(payload.entityId)) {
        setSelectedEntityIds([payload.entityId]);
      }
      if (!payload.entityId && !selectedEntityIds.length && !cadClipboard) return;

      setContextMenu({
        x: Math.min(payload.screenPoint.x, window.innerWidth - 220),
        y: Math.max(8, Math.min(payload.screenPoint.y, window.innerHeight - 420)),
        worldPoint: payload.worldPoint,
      });
    },
    [activeTabId, cadClipboard, selectedEntityIds],
  );

  const deleteSelectedEntity = useCallback(() => {
    if (collaborationState.readonly) {
      setFileMessage('읽기 전용 공유 문서는 편집할 수 없습니다.');
      return;
    }
    if (!selectedEntityIds.length) return;
    updateDocument((current) => ({
      ...current,
      entities: current.entities.filter((entity) => !selectedEntityIds.includes(entity.id)),
    }));
    setSelectedEntityIds([]);
    closeContextMenu();
  }, [closeContextMenu, collaborationState.readonly, selectedEntityIds, updateDocument]);

  const groupSelectedEntities = useCallback(() => {
    if (collaborationState.readonly) {
      setFileMessage('읽기 전용 공유 문서는 편집할 수 없습니다.');
      return;
    }
    const selected = document.entities.filter((entity) => selectedEntityIds.includes(entity.id));
    if (selected.length < 2) {
      setFileMessage('그룹화할 객체를 2개 이상 선택하세요.');
      return;
    }

    const group = createGroupEntity(selected, selected[0]?.layerId ?? document.layers[0]?.id ?? '0');
    updateDocument((current) => ({
      ...current,
      entities: [
        ...current.entities.filter((entity) => !selectedEntityIds.includes(entity.id)),
        group,
      ],
    }));
    setSelectedEntityIds([group.id]);
    closeContextMenu();
    setFileMessage(`${selected.length}개 객체를 그룹화했습니다.`);
  }, [closeContextMenu, collaborationState.readonly, document.entities, document.layers, selectedEntityIds, updateDocument]);

  const ungroupSelectedEntities = useCallback(() => {
    if (collaborationState.readonly) {
      setFileMessage('읽기 전용 공유 문서는 편집할 수 없습니다.');
      return;
    }
    const groups = document.entities.filter(
      (entity): entity is GroupEntity => selectedEntityIds.includes(entity.id) && entity.type === 'group',
    );
    if (!groups.length) {
      setFileMessage('해제할 그룹을 선택하세요.');
      return;
    }

    updateDocument((current) => ({
      ...current,
      entities: current.entities.flatMap((entity) => {
        if (!selectedEntityIds.includes(entity.id) || entity.type !== 'group') return [entity];
        return entity.children;
      }),
    }));
    setSelectedEntityIds(groups.flatMap((group) => group.children.map((child) => child.id)));
    closeContextMenu();
    setFileMessage('그룹을 해제했습니다.');
  }, [closeContextMenu, collaborationState.readonly, document.entities, selectedEntityIds, updateDocument]);

  const rotateSelectedEntities = useCallback(
    (degrees?: number) => {
      if (collaborationState.readonly) {
        setFileMessage('읽기 전용 공유 문서는 편집할 수 없습니다.');
        return;
      }
      const amount = degrees ?? Number(rotationDegrees);
      const selected = document.entities.filter((entity) => selectedEntityIds.includes(entity.id));
      const bounds = getSelectionBounds(selected);
      if (!bounds || !Number.isFinite(amount) || amount === 0) {
        setFileMessage('회전할 객체와 각도를 확인하세요.');
        return;
      }

      const pivot = getBoundsCenter(bounds);
      updateDocument((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          selectedEntityIds.includes(entity.id) ? rotateEntity(entity, pivot, amount) : entity,
        ),
      }));
      closeContextMenu();
      setFileMessage(`선택 객체를 ${amount}도 회전했습니다.`);
    },
    [closeContextMenu, collaborationState.readonly, document.entities, rotationDegrees, selectedEntityIds, updateDocument],
  );

  const alignSelectedEntities = useCallback(
    (mode: AlignMode) => {
      if (collaborationState.readonly) {
        setFileMessage('읽기 전용 공유 문서는 편집할 수 없습니다.');
        return;
      }
      if (selectedEntityIds.length < 2) {
        setFileMessage('정렬할 객체를 2개 이상 선택하세요.');
        return;
      }

      updateDocument((current) => ({
        ...current,
        entities: alignEntities(current.entities, selectedEntityIds, mode),
      }));
      closeContextMenu();
      setFileMessage('선택 객체를 정렬했습니다.');
    },
    [closeContextMenu, collaborationState.readonly, selectedEntityIds, updateDocument],
  );

  const updateSelectedEntity = useCallback(
    (patch: CadEntityPatch) => {
      if (collaborationState.readonly) {
        setFileMessage('읽기 전용 공유 문서는 편집할 수 없습니다.');
        return;
      }
      if (!selectedEntity) return;
      updateDocument((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          entity.id === selectedEntity.id ? ({ ...entity, ...patch } as CadEntity) : entity,
        ),
      }));
    },
    [collaborationState.readonly, selectedEntity, updateDocument],
  );

  const updateLayer = useCallback(
    (layerId: string, patch: Partial<CadLayer>) => {
      if (collaborationState.readonly) {
        setFileMessage('읽기 전용 공유 문서는 편집할 수 없습니다.');
        return;
      }
      updateDocument((current) => ({
        ...current,
        layers: current.layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...patch } : layer,
        ),
      }));
    },
    [collaborationState.readonly, updateDocument],
  );

  const addLayer = useCallback(() => {
    if (collaborationState.readonly) {
      setFileMessage('읽기 전용 공유 문서는 편집할 수 없습니다.');
      return;
    }
    const nextIndex = document.layers.length + 1;
    updateDocument((current) => ({
      ...current,
      layers: [
        ...current.layers,
        {
          id: `layer-${Date.now()}`,
          name: `레이어 ${nextIndex}`,
          color: '#7c3aed',
          visible: true,
          locked: false,
        },
      ],
    }));
  }, [collaborationState.readonly, document.layers.length, updateDocument]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!activeTabId) return;
      if (document.entities.length > maxAutosaveEntities) {
        setFileMessage(`큰 도면: 자동 저장 생략됨 (${document.entities.length}개 객체)`);
        return;
      }
      localStorage.setItem('simplecad.autosave', JSON.stringify(document));
      setFileMessage(`자동 저장됨 ${new Date().toLocaleTimeString()}`);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [activeTabId, document]);

  useEffect(() => {
    setContextMenu(null);
    setReferenceMode(null);
    setReferencePreviewPoint(null);
  }, [activeTabId]);

  useEffect(() => {
    setContextMenu(null);
    setReferenceMode(null);
    setReferencePreviewPoint(null);
  }, [activeTool]);

  useEffect(() => {
    if (!contextMenu) return;

    const onPointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.cad-context-menu')) return;
      setContextMenu(null);
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [contextMenu]);

  useEffect(() => {
    if (!anyDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [anyDirty]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditingText =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isEditingText) return;

      if (event.key === 'Escape') {
        if (referenceMode) {
          event.preventDefault();
          setReferenceMode(null);
          setReferencePreviewPoint(null);
          setContextMenu(null);
          setFileMessage('참조 작업을 취소했습니다.');
          return;
        }
        if (contextMenu) {
          event.preventDefault();
          setContextMenu(null);
          return;
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault();
        redoDocument();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undoDocument();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redoDocument();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveCurrentDocument();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copySelectedEntities();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        pasteEntities();
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelectedEntity();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    contextMenu,
    copySelectedEntities,
    deleteSelectedEntity,
    pasteEntities,
    redoDocument,
    referenceMode,
    saveCurrentDocument,
    undoDocument,
  ]);

  return (
    <main className="app-shell" data-testid="app-shell">
      <header className="topbar">
        <input
          ref={fileInputRef}
          className="hidden-input"
          data-testid="file-input"
          type="file"
          accept=".json,.dxf,.dwg"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void openFile(file);
            event.currentTarget.value = '';
          }}
        />
        <div className="brand">
          <span className="brand-mark">SC</span>
          <span>SimpleCAD</span>
        </div>
        <div className="toolbar-group">
          <button className="tool-button wide" title="새 도면" onClick={createNewDrawing}>
            <Plus size={17} />
            새 도면
          </button>
          <button
            className="tool-button wide"
            title="열기"
            data-testid="open-file-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp size={17} />
            열기
          </button>
          <button
            className="tool-button wide"
            title="저장"
            data-testid="save-button"
            disabled={!activeTabId || activeReadonly}
            onClick={() => void saveCurrentDocument()}
          >
            <Save size={17} />
            저장
          </button>
          <button
            className="tool-button wide"
            title="서버 저장"
            data-testid="server-save-button"
            disabled={!activeTabId || activeReadonly}
            onClick={saveToServer}
          >
            <Save size={17} />
            서버 저장
          </button>
          <button
            className="tool-button wide"
            title="공유"
            data-testid="share-link-button"
            disabled={!activeTabId || activeReadonly}
            onClick={() => void createShareLink()}
          >
            <Share2 size={17} />
            공유
          </button>
          <button
            className="tool-button wide"
            title="JSON 다른 이름 저장"
            disabled={!activeTabId}
            onClick={() => void saveAs('json')}
          >
            <FileDown size={17} />
            JSON
          </button>
          <button
            className="tool-button wide"
            title="SVG 내보내기"
            disabled={!activeTabId}
            onClick={() => void saveAs('svg')}
          >
            <FileDown size={17} />
            SVG
          </button>
          <button
            className="tool-button wide"
            title="DXF 내보내기"
            disabled={!activeTabId}
            onClick={() => void saveAs('dxf')}
          >
            <FileDown size={17} />
            DXF
          </button>
          <button
            className="tool-button wide"
            title="DWG 내보내기"
            disabled={!activeTabId}
            onClick={() => void saveAs('dwg')}
          >
            <FileDown size={17} />
            DWG
          </button>
        </div>
        <div className="toolbar-group">
          <button
            className="tool-button icon"
            title="실행 취소"
            disabled={!canUndo}
            onClick={undoDocument}
          >
            <Undo2 size={17} />
          </button>
          <button
            className="tool-button icon"
            title="다시 실행"
            disabled={!canRedo}
            onClick={redoDocument}
          >
            <Redo2 size={17} />
          </button>
        </div>
        <div className="toolbar-group">
          <button
            className="tool-button icon"
            title="확대"
            onClick={() => canvasApiRef.current?.zoomBy(1.15)}
          >
            <ZoomIn size={17} />
          </button>
          <button
            className="tool-button icon"
            title="축소"
            onClick={() => canvasApiRef.current?.zoomBy(0.85)}
          >
            <ZoomOut size={17} />
          </button>
          <button
            className={`tool-button icon ${gridVisible ? 'active' : ''}`}
            title="그리드"
            onClick={() => setGridVisible((value) => !value)}
          >
            <Grid3X3 size={17} />
          </button>
          <button
            className={`tool-button icon ${snapEnabled ? 'active' : ''}`}
            title="스냅"
            onClick={() => setSnapEnabled((value) => !value)}
          >
            <Magnet size={17} />
          </button>
        </div>
      </header>

      <nav className="tabbar" aria-label="열린 도면">
        {tabs.length ? (
          tabs.map((tab) => {
            const tabDirty = tab.id === activeTabId ? activeDirty : isSaveStateDirty(tab.saveState);
            return (
            <button
              key={tab.id}
              className={`tab-button ${tab.id === activeTabId ? 'active' : ''}`}
              data-testid="workspace-tab"
              onClick={() => activateTab(tab.id)}
              title={tab.title}
            >
              <FileText size={14} />
              <span>{tab.title}</span>
              {tabDirty ? (
                <span className="tab-dirty" title="저장 안 됨">*</span>
              ) : null}
              <span
                className="tab-close"
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(tab.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    closeTab(tab.id);
                  }
                }}
              >
                <X size={13} />
              </span>
            </button>
            );
          })
        ) : (
          <span className="tabbar-empty">열린 도면 없음</span>
        )}
      </nav>

      {activeTabId ? (
        <section className="workspace">
        <aside className="tool-panel" aria-label="도구">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const disabledByReadonly =
              activeReadonly && !['select', 'pan'].includes(tool.id);
            return (
              <button
                key={tool.id}
                className={`tool-tile ${activeTool === tool.id ? 'active' : ''}`}
                data-testid={`tool-${tool.id}`}
                title={tool.label}
                disabled={disabledByReadonly}
                onClick={() => selectTool(tool.id)}
              >
                <Icon size={20} />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </aside>

        <CadCanvas
          document={document}
          activeTool={activeTool}
          readonly={activeReadonly}
          viewport={viewport}
          selectedEntityIds={selectedEntityIds}
          previewEntities={referencePreviewEntities}
          gridVisible={gridVisible}
          snapEnabled={snapEnabled}
          onViewportChange={setViewport}
          onCursorChange={setCursor}
          onDocumentChange={updateDocument}
          onDocumentBatchStart={beginHistoryBatch}
          onDocumentBatchCommit={commitHistoryBatch}
          onSelectedEntityChange={setSelectedEntityIds}
          onReady={setCanvasApi}
          referencePickMode={referenceMode !== null}
          referenceSnapExcludeEntityIds={referenceMode === 'copy-base' ? selectedEntityIds : []}
          onReferencePointPreview={
            referenceMode === 'paste-base' ? setReferencePreviewPoint : undefined
          }
          onReferencePointPick={handleReferencePointPick}
          onCanvasContextMenu={openCanvasContextMenu}
        />

        {activeReadonly ? (
          <div className="readonly-banner" data-testid="readonly-banner">
            읽기 전용 공유 문서
          </div>
        ) : null}

        {contextMenu ? (
          <div
            className="cad-context-menu"
            data-testid="cad-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              disabled={!selectedEntityIds.length}
              onClick={copySelectedEntities}
            >
              <Copy size={16} />
              <span>복사</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!selectedEntityIds.length || activeReadonly}
              onClick={startReferenceCopy}
            >
              <Crosshair size={16} />
              <span>참조 복사</span>
            </button>
            <div className="cad-context-menu-divider" />
            <button
              type="button"
              role="menuitem"
              disabled={selectedEntityIds.length < 2 || activeReadonly}
              onClick={groupSelectedEntities}
            >
              <span>그룹화</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!selectionHasGroup || activeReadonly}
              onClick={ungroupSelectedEntities}
            >
              <span>그룹 해제</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!selectedEntityIds.length || activeReadonly}
              onClick={() => rotateSelectedEntities(15)}
            >
              <span>15도 회전</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={selectedEntityIds.length < 2 || activeReadonly}
              onClick={() => alignSelectedEntities('left')}
            >
              <span>왼쪽 정렬</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={selectedEntityIds.length < 2 || activeReadonly}
              onClick={() => alignSelectedEntities('center-x')}
            >
              <span>가운데 정렬</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={selectedEntityIds.length < 2 || activeReadonly}
              onClick={() => alignSelectedEntities('right')}
            >
              <span>오른쪽 정렬</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={selectedEntityIds.length < 2 || activeReadonly}
              onClick={() => alignSelectedEntities('top')}
            >
              <span>위 정렬</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={selectedEntityIds.length < 2 || activeReadonly}
              onClick={() => alignSelectedEntities('center-y')}
            >
              <span>중앙 정렬</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={selectedEntityIds.length < 2 || activeReadonly}
              onClick={() => alignSelectedEntities('bottom')}
            >
              <span>아래 정렬</span>
            </button>
            <div className="cad-context-menu-divider" />
            <button
              type="button"
              role="menuitem"
              disabled={!cadClipboard || activeReadonly}
              onClick={pasteEntities}
            >
              <ClipboardPaste size={16} />
              <span>붙여넣기</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!cadClipboard?.sourceBasePoint || activeReadonly}
              onClick={startReferencePaste}
            >
              <Crosshair size={16} />
              <span>참조 붙여넣기</span>
            </button>
            {selectedEntityIds.length ? (
              <>
                <div className="cad-context-menu-divider" />
                <button
                  type="button"
                  role="menuitem"
                  className="danger"
                  disabled={activeReadonly}
                  onClick={deleteSelectedEntity}
                >
                  <Trash2 size={16} />
                  <span>삭제</span>
                </button>
              </>
            ) : null}
          </div>
        ) : null}

        <aside className="properties-panel">
          <div className="panel-section">
            <h2>속성</h2>
            {selectedEntity ? (
              <dl className="property-list">
                <div>
                  <dt>ID</dt>
                  <dd>{selectedEntity.id}</dd>
                </div>
                <div>
                  <dt>유형</dt>
                  <dd>{selectedEntity.type === 'group' ? 'group' : selectedEntity.type}</dd>
                </div>
                {selectedEntity.type === 'group' ? (
                  <div>
                    <dt>객체 수</dt>
                    <dd>{selectedEntity.children.length}개</dd>
                  </div>
                ) : null}
                <div>
                  <dt>회전</dt>
                  <dd className="property-control transform-inline">
                    <input
                      type="number"
                      value={rotationDegrees}
                      onChange={(event) => setRotationDegrees(event.target.value)}
                    />
                    <button className="mini-button" onClick={() => rotateSelectedEntities()}>
                      적용
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>레이어</dt>
                  <dd className="property-control">
                    <select
                      value={selectedEntity.layerId}
                      disabled={activeReadonly}
                      onChange={(event) => updateSelectedEntity({ layerId: event.target.value })}
                    >
                      {document.layers.map((layer) => (
                        <option key={layer.id} value={layer.id}>
                          {layer.name}
                        </option>
                      ))}
                    </select>
                  </dd>
                </div>
                <div>
                  <dt>색상</dt>
                  <dd className="property-control">
                    <input
                      type="color"
                      value={selectedEntity.strokeColor}
                      disabled={activeReadonly}
                      onChange={(event) => updateSelectedEntity({ strokeColor: event.target.value })}
                    />
                    <span>{selectedEntity.strokeColor}</span>
                  </dd>
                </div>
                <div>
                  <dt>선 두께</dt>
                  <dd className="property-control">
                    <input
                      min="1"
                      max="12"
                      type="number"
                      value={selectedEntity.strokeWidth}
                      disabled={activeReadonly}
                      onChange={(event) =>
                        updateSelectedEntity({ strokeWidth: Number(event.target.value) || 1 })
                      }
                    />
                  </dd>
                </div>
                <div>
                  <dt>선 스타일</dt>
                  <dd className="property-control">
                    <select
                      value={selectedEntity.strokeStyle ?? 'solid'}
                      disabled={activeReadonly}
                      onChange={(event) =>
                        updateSelectedEntity({
                          strokeStyle: event.target.value as 'solid' | 'dashed',
                        })
                      }
                    >
                      <option value="solid">실선</option>
                      <option value="dashed">점선</option>
                    </select>
                  </dd>
                </div>
                {selectedEntity.type === 'dimension' ? (
                  <>
                    <div>
                      <dt>치수 라벨</dt>
                      <dd className="property-control">
                        <input
                          type="text"
                          value={selectedEntity.label}
                          disabled={activeReadonly}
                          onChange={(event) =>
                            updateSelectedEntity({
                              label: event.target.value,
                              labelMode: 'manual',
                            })
                          }
                        />
                      </dd>
                    </div>
                    <div>
                      <dt>오프셋</dt>
                      <dd className="property-control">
                        <input
                          type="number"
                          value={selectedEntity.labelOffset ?? -24}
                          disabled={activeReadonly}
                          onChange={(event) =>
                            updateSelectedEntity({
                              labelOffset: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </dd>
                    </div>
                    <div>
                      <dt>라벨 모드</dt>
                      <dd className="property-control">
                        <button
                          className={`mini-button ${selectedEntity.labelMode !== 'manual' ? 'active' : ''}`}
                          disabled={activeReadonly}
                          onClick={() =>
                            updateSelectedEntity({
                              label: formatDimensionLabel(selectedEntity),
                              labelMode: 'auto',
                            })
                          }
                        >
                          자동 라벨
                        </button>
                      </dd>
                    </div>
                  </>
                ) : null}
                {selectedEntity.type === 'group' ? (
                  <div>
                    <dt>그룹</dt>
                    <dd className="property-control">
                      <button className="mini-button" onClick={ungroupSelectedEntities}>
                        그룹 해제
                      </button>
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : selectedEntityIds.length ? (
              <div className="transform-panel">
                <p className="empty-state">{selectedEntityIds.length}개 객체가 선택되었습니다.</p>
                <div className="transform-actions">
                  <button className="mini-button" disabled={selectedEntityIds.length < 2 || activeReadonly} onClick={groupSelectedEntities}>
                    그룹화
                  </button>
                  <button className="mini-button" disabled={!selectionHasGroup || activeReadonly} onClick={ungroupSelectedEntities}>
                    그룹 해제
                  </button>
                </div>
                <div className="align-grid">
                  <button className="mini-button" disabled={activeReadonly} onClick={() => alignSelectedEntities('left')}>왼쪽</button>
                  <button className="mini-button" disabled={activeReadonly} onClick={() => alignSelectedEntities('center-x')}>가운데</button>
                  <button className="mini-button" disabled={activeReadonly} onClick={() => alignSelectedEntities('right')}>오른쪽</button>
                  <button className="mini-button" disabled={activeReadonly} onClick={() => alignSelectedEntities('top')}>위</button>
                  <button className="mini-button" disabled={activeReadonly} onClick={() => alignSelectedEntities('center-y')}>중앙</button>
                  <button className="mini-button" disabled={activeReadonly} onClick={() => alignSelectedEntities('bottom')}>아래</button>
                </div>
                <div className="transform-inline">
                  <label>회전</label>
                  <input
                    type="number"
                    value={rotationDegrees}
                    disabled={activeReadonly}
                    onChange={(event) => setRotationDegrees(event.target.value)}
                  />
                  <button className="mini-button" disabled={activeReadonly} onClick={() => rotateSelectedEntities()}>
                    적용
                  </button>
                </div>
              </div>
            ) : (
              <p className="empty-state">선택된 객체가 없습니다.</p>
            )}
          </div>

          <div className="panel-section">
            <div className="panel-heading">
              <h2>레이어</h2>
              <button className="mini-button" disabled={activeReadonly} onClick={addLayer}>
                추가
              </button>
            </div>
            <div className="layer-list">
              {document.layers.map((layer) => (
                <div className="layer-row" key={layer.id}>
                  <input
                    type="color"
                    value={layer.color}
                    title="레이어 색상"
                    disabled={activeReadonly}
                    onChange={(event) => updateLayer(layer.id, { color: event.target.value })}
                  />
                  <input
                    className="layer-name-input"
                    value={layer.name}
                    disabled={activeReadonly}
                    onChange={(event) => updateLayer(layer.id, { name: event.target.value })}
                  />
                  <button
                    className={`mini-button ${layer.visible ? 'active' : ''}`}
                    disabled={activeReadonly}
                    onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                  >
                    {layer.visible ? '표시' : '숨김'}
                  </button>
                  <button
                    className={`mini-button ${layer.locked ? 'active' : ''}`}
                    disabled={activeReadonly}
                    onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
                  >
                    {layer.locked ? '잠금' : '열림'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h2>변환 상태</h2>
            <div className="warning-list">
              <div className="conversion-summary">
                <span>전체 {conversionWarnings.total}</span>
                <span>근사 {conversionWarnings.approximated}</span>
                <span>미지원 {conversionWarnings.unsupported}</span>
                <span>변환 {conversionWarnings.conversion}</span>
                {conversionWarnings.mock ? <span>mock {conversionWarnings.mock}</span> : null}
              </div>
              {conversionWarnings.modeLabel ? (
                <div className={`conversion-mode conversion-mode-${conversionWarnings.mode}`}>
                  {conversionWarnings.modeLabel}
                </div>
              ) : null}
              {conversionWarnings.groups.length ? (
                conversionWarnings.groups.map((warning, index) => (
                  <div
                    className={`warning-item warning-item-${warning.category}`}
                    key={`${warning.code}-${index}`}
                  >
                    <strong>{warning.code}</strong>
                    <span>
                      {warning.message}
                      {warning.count > 1 ? ` (${warning.count}개)` : ''}
                    </span>
                    <small>
                      {warning.sourceType ? `${warning.sourceType} · ` : ''}
                      {warning.category === 'approximated'
                        ? '근사됨'
                        : warning.category === 'unsupported'
                          ? '미지원 객체'
                          : warning.category === 'mock'
                            ? '개발용 mock 변환'
                            : '변환'}
                    </small>
                  </div>
                ))
              ) : (
                <p className="empty-state">변환 경고가 없습니다.</p>
              )}
            </div>
          </div>
        </aside>
        </section>
      ) : (
        <section className="start-page">
          <div className="start-page-inner">
            <div className="start-heading">
              <span className="brand-mark">SC</span>
              <div>
                <h1>SimpleCAD</h1>
                <p>도면을 열거나 새 작업을 시작하세요.</p>
              </div>
            </div>
            <div className="start-actions">
              <button className="start-action primary" data-testid="start-new-drawing" onClick={createNewDrawing}>
                <Plus size={20} />
                <span>새 도면</span>
              </button>
              <button className="start-action" data-testid="start-open-file" onClick={() => fileInputRef.current?.click()}>
                <FileUp size={20} />
                <span>파일 열기</span>
              </button>
            </div>
            <section className="recent-panel">
              <h2>최근 열기</h2>
              {recentDocuments.length ? (
                <div className="recent-list">
                  {recentDocuments.map((recent) => (
                    <button
                      className="recent-item"
                      key={recent.id}
                      onClick={() => openRecentDocument(recent)}
                    >
                      <FileText size={17} />
                      <span>{recent.title}</span>
                      <small>{new Date(recent.lastOpenedAt).toLocaleString()}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="empty-state">최근에 연 도면이 없습니다.</p>
              )}
            </section>
            <section className="server-panel">
              <h2>서버 도면</h2>
              {serverDocuments.length ? (
                <div className="server-document-list">
                  {serverDocuments.map((serverDocument) => (
                    <button
                      className="server-document"
                      data-testid="server-document-item"
                      key={serverDocument.id}
                      onClick={() => openServerDocument(serverDocument)}
                    >
                      <FileText size={17} />
                      <span>{serverDocument.title}</span>
                      <small>{new Date(serverDocument.updatedAt).toLocaleString()}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="empty-state">서버에 저장된 도면이 없습니다.</p>
              )}
            </section>
          </div>
        </section>
      )}

      <footer className="statusbar" data-testid="statusbar">
        <span>좌표 X {cursor.x.toFixed(1)} / Y {cursor.y.toFixed(1)}</span>
        <span>줌 {(viewport.scale * 100).toFixed(0)}%</span>
        <span>
          {selectedEntity
            ? `선택: ${selectedEntity.id}`
            : selectedEntityIds.length
              ? `선택: ${selectedEntityIds.length}개`
              : '선택 없음'}
        </span>
        <span>도구: {tools.find((tool) => tool.id === activeTool)?.label}</span>
        <span className={activeDirty ? 'save-state save-state-dirty' : 'save-state'}>
          {formatSaveState(saveState)}
        </span>
        <span className={serverStatus.dirty ? 'save-state save-state-dirty' : 'save-state'}>
          {serverStatus.label}
        </span>
        {conversionProgress ? (
          <span className="conversion-status" data-testid="conversion-status">
            {formatConversionProgress(conversionProgress)}
          </span>
        ) : null}
        <span>{fileMessage}</span>
      </footer>
    </main>
  );
}

function readRecentDocuments(): RecentDocument[] {
  try {
    const value = localStorage.getItem(recentStorageKey);
    if (!value) return [];
    const parsed = JSON.parse(value) as RecentDocument[];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function createSaveState(document: CadDocument, fallbackName = document.name): SaveState {
  const source = document.sourceFile;
  const targetType = source?.type ?? fileTypeFromName(source?.name ?? fallbackName);
  const targetName = source?.name ?? withExtension(fallbackName, targetType);
  return {
    targetName,
    targetType,
    fileHandleAvailable: source?.fileHandleAvailable ?? false,
    revision: 0,
    savedRevision: 0,
    lastSavedAt: source?.lastSavedAt,
    isSaving: false,
  };
}

function createCollaborationState(overrides: Partial<CollaborationState> = {}): CollaborationState {
  return {
    readonly: false,
    ...overrides,
  };
}

function isSaveStateDirty(saveState: SaveState): boolean {
  return saveState.revision !== saveState.savedRevision;
}

function formatSaveState(saveState: SaveState): string {
  if (saveState.isSaving) return '저장 중...';
  const dirtyLabel = isSaveStateDirty(saveState) ? '저장 안 됨' : '저장됨';
  const handleLabel = saveState.fileHandleAvailable ? '파일 직접 저장' : '다운로드 저장';
  if (!saveState.lastSavedAt) return `${dirtyLabel} · ${saveState.targetType.toUpperCase()} · ${handleLabel}`;
  return `${dirtyLabel} · ${saveState.targetType.toUpperCase()} · ${new Date(saveState.lastSavedAt).toLocaleTimeString()}`;
}

function formatServerState(
  collaborationState: CollaborationState,
  revision: number,
): { label: string; dirty: boolean } {
  if (!collaborationState.serverDocumentId) {
    return { label: '서버 미저장', dirty: false };
  }
  const dirty = collaborationState.serverSavedRevision !== revision;
  if (dirty) return { label: '서버 변경 있음', dirty: true };
  if (!collaborationState.lastServerSavedAt) return { label: '서버 저장됨', dirty: false };
  return {
    label: `서버 저장됨 · ${new Date(collaborationState.lastServerSavedAt).toLocaleTimeString()}`,
    dirty: false,
  };
}

function formatConversionProgress(progress: ConversionProgress): string {
  if (progress.message) return progress.message;
  const percent = typeof progress.progress === 'number' ? ` ${Math.round(progress.progress * 100)}%` : '';
  if (progress.status === 'queued') return `DWG 변환 대기 중${percent}`;
  if (progress.status === 'running') return `DWG 변환 진행 중${percent}`;
  if (progress.status === 'complete') return 'DWG 변환 완료';
  if (progress.status === 'failed') return 'DWG 변환 실패';
  return 'DWG 변환 요청 중...';
}

function formatConversionError(error: unknown, fallback: string): string {
  if (error instanceof ConversionApiError) {
    return `${fallback}: ${conversionErrorLabel(error.category)} - ${error.message}`;
  }
  return error instanceof Error ? error.message : fallback;
}

function conversionErrorLabel(category: string): string {
  if (category === 'network') return '네트워크 오류';
  if (category === 'server') return '서버 오류';
  if (category === 'unsupported') return '지원하지 않는 파일';
  if (category === 'timeout') return '시간 초과';
  if (category === 'invalid-response') return '잘못된 서버 응답';
  return '변환 실패';
}

function withSourceFile(
  document: CadDocument,
  sourceFile: NonNullable<CadDocument['sourceFile']>,
): CadDocument {
  return {
    ...document,
    name: sourceFile.name.replace(/\.[^.]+$/, '') || document.name,
    sourceFile: {
      ...document.sourceFile,
      ...sourceFile,
    },
  };
}

function stripRuntimeFileState(document: CadDocument): CadDocument {
  if (!document.sourceFile) return document;
  return {
    ...document,
    sourceFile: {
      ...document.sourceFile,
      fileHandleAvailable: false,
    },
  };
}

function isDocumentSourceType(type: CadFileType): boolean {
  return type === 'json' || type === 'dxf' || type === 'dwg';
}

function withExtension(fileName: string, type: CadFileType): string {
  const trimmed = (fileName || `drawing.${type}`).trim();
  const withoutCurrentExtension = trimmed.replace(/\.(json|svg|dxf|dwg)$/i, '');
  return `${withoutCurrentExtension || 'drawing'}.${type}`;
}

function fileTypeFromName(fileName: string): CadFileType {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith('.dxf')) return 'dxf';
  if (normalized.endsWith('.dwg')) return 'dwg';
  if (normalized.endsWith('.svg')) return 'svg';
  return 'json';
}
