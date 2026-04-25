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
import { FileManager } from '../cad/io/fileManager';
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
const maxAutosaveEntities = 4000;
const recentStorageKey = 'webcad.recentDocuments';

type WorkspaceTab = {
  id: string;
  title: string;
  document: CadDocument;
  history: DocumentHistorySnapshot;
  viewport: Viewport;
  selectedEntityIds: string[];
  lastOpenedAt: string;
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
type CadEntityPatch = Partial<CadEntity> & Partial<DimensionEntity>;

function formatDimensionLabel(entity: DimensionEntity): string {
  return Math.hypot(
    entity.endPoint.x - entity.startPoint.x,
    entity.endPoint.y - entity.startPoint.y,
  ).toFixed(1);
}

export function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('select');
  const {
    document,
    updateDocument,
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
  const [viewport, setViewport] = useState<Viewport>({ offsetX: 480, offsetY: 320, scale: 1 });
  const [cursor, setCursor] = useState<CadPoint>({ x: 0, y: 0 });
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>(['rect-1']);
  const [gridVisible, setGridVisible] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [fileMessage, setFileMessage] = useState('자동 저장 준비됨');
  const [cadClipboard, setCadClipboard] = useState<CadClipboardPayload | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedEntity = useMemo(
    () =>
      selectedEntityIds.length === 1
        ? document.entities.find((entity) => entity.id === selectedEntityIds[0]) ?? null
        : null,
    [document.entities, selectedEntityIds],
  );
  const groupedImportWarnings = useMemo(() => {
    const groups = new Map<string, { code: string; message: string; count: number }>();
    for (const warning of document.importWarnings ?? []) {
      const key = `${warning.code}:${warning.message}`;
      const current = groups.get(key);
      if (current) current.count += 1;
      else groups.set(key, { code: warning.code, message: warning.message, count: 1 });
    }
    return [...groups.values()];
  }, [document.importWarnings]);
  const canvasApiRef = useRef<{ zoomBy: (factor: number) => void } | null>(null);

  const setCanvasApi = useCallback((api: { zoomBy: (factor: number) => void }) => {
    canvasApiRef.current = api;
  }, []);

  const downloadBlob = useCallback((blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const saveAs = useCallback(
    async (type: 'json' | 'svg' | 'dxf' | 'dwg') => {
      if (!activeTabId) return;
      try {
        setFileMessage(`${type.toUpperCase()} 파일을 준비하는 중...`);
        const blob = await fileManager.save(document, {
          fileName: document.name,
          type,
        });
        downloadBlob(blob, `${document.name.replace(/\s+/g, '-')}.${type}`);
        setFileMessage(`${type.toUpperCase()} 파일을 내보냈습니다.`);
      } catch (error) {
        setFileMessage(error instanceof Error ? error.message : `${type.toUpperCase()} 내보내기에 실패했습니다.`);
      }
    },
    [activeTabId, document, downloadBlob],
  );

  const persistRecentDocument = useCallback((title: string, nextDocument = document) => {
    if (nextDocument.entities.length > maxAutosaveEntities) return;

    const recent: RecentDocument = {
      id: `${Date.now()}`,
      title,
      document: nextDocument,
      lastOpenedAt: new Date().toISOString(),
    };
    setRecentDocuments((items) => {
      const next = [recent, ...items.filter((item) => item.title !== title)].slice(0, 8);
      localStorage.setItem(recentStorageKey, JSON.stringify(next));
      return next;
    });
  }, [document]);

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
              viewport,
              selectedEntityIds,
              lastOpenedAt: new Date().toISOString(),
            }
          : tab,
      ),
    );
    setActiveTabId(tabId);
    loadSnapshot(nextTab.history);
    setViewport(nextTab.viewport);
    setSelectedEntityIds(nextTab.selectedEntityIds);
    setFileMessage(`${nextTab.title} 탭을 열었습니다.`);
  }, [activeTabId, getSnapshot, loadSnapshot, selectedEntityIds, tabs, viewport]);

  const createTab = useCallback((title: string, nextDocument: CadDocument) => {
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
      viewport: { offsetX: 480, offsetY: 320, scale: 1 },
      selectedEntityIds: [],
      lastOpenedAt: new Date().toISOString(),
    };
    setTabs((items) => [...items, tab]);
    setActiveTabId(tab.id);
    loadSnapshot(history);
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
    setTabs((items) => {
      const next = items.filter((tab) => tab.id !== tabId);
      if (tabId === activeTabId) {
        const fallback = next[next.length - 1] ?? null;
        setActiveTabId(fallback?.id ?? null);
        if (fallback) {
          loadSnapshot(fallback.history);
          setViewport(fallback.viewport);
          setSelectedEntityIds(fallback.selectedEntityIds);
        } else {
          setSelectedEntityIds([]);
        }
      }
      return next;
    });
  }, [activeTabId, loadSnapshot]);

  const openFile = useCallback(async (file: File) => {
    try {
      const nextDocument = await fileManager.open(file);
      const openedDocument = {
        ...nextDocument,
        name: nextDocument.name || file.name,
        sourceFile: {
          name: file.name,
          type: fileTypeFromName(file.name),
          lastSavedAt: new Date().toISOString(),
          fileHandleAvailable: false,
        },
      };
      createTab(file.name, openedDocument);
      setFileMessage(`${file.name} 파일을 열었습니다.`);
    } catch (error) {
      setFileMessage(error instanceof Error ? error.message : '파일을 열 수 없습니다.');
    }
  }, [createTab]);

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
              viewport,
              selectedEntityIds,
              lastOpenedAt: new Date().toISOString(),
            }
          : tab,
      ),
    );
  }, [activeTabId, getSnapshot, selectedEntityIds, viewport]);

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

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
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
    if (!cadClipboard) {
      setFileMessage('복사된 객체가 없습니다.');
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
  }, [cadClipboard, closeContextMenu, document, updateDocument]);

  const startReferenceCopy = useCallback(() => {
    if (!selectedEntityIds.length) {
      setFileMessage('복사할 객체를 선택하세요.');
      return;
    }

    closeContextMenu();
    setReferenceMode('copy-base');
    setFileMessage('참조할 다른 객체의 중심점, 끝점, 교차점을 선택하세요.');
  }, [closeContextMenu, selectedEntityIds.length]);

  const startReferencePaste = useCallback(() => {
    if (!cadClipboard) {
      setFileMessage('복사된 객체가 없습니다.');
      return;
    }

    closeContextMenu();
    setReferenceMode('paste-base');
    setFileMessage('붙여넣을 파일에서 대응되는 중심점, 끝점, 교차점을 선택하세요.');
  }, [cadClipboard, closeContextMenu]);

  const handleReferencePointPick = useCallback(
    (point: CadPoint) => {
      if (referenceMode === 'copy-base') {
        const selectedEntities = document.entities.filter((entity) => selectedEntityIds.includes(entity.id));
        if (!selectedEntities.length) {
          setReferenceMode(null);
          setFileMessage('복사할 객체를 선택하세요.');
          return;
        }

        setCadClipboard(createClipboardPayload(selectedEntities, point));
        setReferenceMode(null);
        setFileMessage('참조 기준점과 함께 복사했습니다.');
        return;
      }

      if (referenceMode === 'paste-base') {
        if (!cadClipboard) {
          setReferenceMode(null);
          setFileMessage('복사된 객체가 없습니다.');
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
        y: Math.min(payload.screenPoint.y, window.innerHeight - 180),
        worldPoint: payload.worldPoint,
      });
    },
    [activeTabId, cadClipboard, selectedEntityIds],
  );

  const deleteSelectedEntity = useCallback(() => {
    if (!selectedEntityIds.length) return;
    updateDocument((current) => ({
      ...current,
      entities: current.entities.filter((entity) => !selectedEntityIds.includes(entity.id)),
    }));
    setSelectedEntityIds([]);
    closeContextMenu();
  }, [closeContextMenu, selectedEntityIds, updateDocument]);

  const updateSelectedEntity = useCallback(
    (patch: CadEntityPatch) => {
      if (!selectedEntity) return;
      updateDocument((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          entity.id === selectedEntity.id ? ({ ...entity, ...patch } as CadEntity) : entity,
        ),
      }));
    },
    [selectedEntity, updateDocument],
  );

  const updateLayer = useCallback(
    (layerId: string, patch: Partial<CadLayer>) => {
      updateDocument((current) => ({
        ...current,
        layers: current.layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...patch } : layer,
        ),
      }));
    },
    [updateDocument],
  );

  const addLayer = useCallback(() => {
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
  }, [document.layers.length, updateDocument]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!activeTabId) return;
      if (document.entities.length > maxAutosaveEntities) {
        setFileMessage(`큰 도면: 자동 저장 생략됨 (${document.entities.length}개 객체)`);
        return;
      }
      localStorage.setItem('webcad.autosave', JSON.stringify(document));
      setFileMessage(`자동 저장됨 ${new Date().toLocaleTimeString()}`);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [activeTabId, document]);

  useEffect(() => {
    setContextMenu(null);
    setReferenceMode(null);
  }, [activeTabId]);

  useEffect(() => {
    setContextMenu(null);
    setReferenceMode(null);
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
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditingText =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isEditingText) return;

      if (event.key === 'Escape') {
        if (referenceMode) {
          event.preventDefault();
          setReferenceMode(null);
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
        redo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
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
  }, [contextMenu, copySelectedEntities, deleteSelectedEntity, pasteEntities, redo, referenceMode, undo]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <input
          ref={fileInputRef}
          className="hidden-input"
          type="file"
          accept=".json,.dxf,.dwg"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void openFile(file);
            event.currentTarget.value = '';
          }}
        />
        <div className="brand">
          <span className="brand-mark">WC</span>
          <span>Web CAD</span>
        </div>
        <div className="toolbar-group">
          <button className="tool-button wide" title="새 도면" onClick={createNewDrawing}>
            <Plus size={17} />
            새 도면
          </button>
          <button
            className="tool-button wide"
            title="열기"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp size={17} />
            열기
          </button>
          <button
            className="tool-button wide"
            title="JSON 저장"
            disabled={!activeTabId}
            onClick={() => void saveAs('json')}
          >
            <Save size={17} />
            저장
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
            onClick={undo}
          >
            <Undo2 size={17} />
          </button>
          <button
            className="tool-button icon"
            title="다시 실행"
            disabled={!canRedo}
            onClick={redo}
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
          tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => activateTab(tab.id)}
              title={tab.title}
            >
              <FileText size={14} />
              <span>{tab.title}</span>
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
          ))
        ) : (
          <span className="tabbar-empty">열린 도면 없음</span>
        )}
      </nav>

      {activeTabId ? (
        <section className="workspace">
        <aside className="tool-panel" aria-label="도구">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                className={`tool-tile ${activeTool === tool.id ? 'active' : ''}`}
                title={tool.label}
                onClick={() => setActiveTool(tool.id)}
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
          viewport={viewport}
          selectedEntityIds={selectedEntityIds}
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
          onReferencePointPick={handleReferencePointPick}
          onCanvasContextMenu={openCanvasContextMenu}
        />

        {contextMenu ? (
          <div
            className="cad-context-menu"
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
              disabled={!selectedEntityIds.length}
              onClick={startReferenceCopy}
            >
              <Crosshair size={16} />
              <span>참조 복사</span>
            </button>
            <div className="cad-context-menu-divider" />
            <button
              type="button"
              role="menuitem"
              disabled={!cadClipboard}
              onClick={pasteEntities}
            >
              <ClipboardPaste size={16} />
              <span>붙여넣기</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!cadClipboard}
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
                  <dd>{selectedEntity.type}</dd>
                </div>
                <div>
                  <dt>레이어</dt>
                  <dd className="property-control">
                    <select
                      value={selectedEntity.layerId}
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
              </dl>
            ) : selectedEntityIds.length ? (
              <p className="empty-state">{selectedEntityIds.length}개 객체가 선택되었습니다.</p>
            ) : (
              <p className="empty-state">선택된 객체가 없습니다.</p>
            )}
          </div>

          <div className="panel-section">
            <div className="panel-heading">
              <h2>레이어</h2>
              <button className="mini-button" onClick={addLayer}>
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
                    onChange={(event) => updateLayer(layer.id, { color: event.target.value })}
                  />
                  <input
                    className="layer-name-input"
                    value={layer.name}
                    onChange={(event) => updateLayer(layer.id, { name: event.target.value })}
                  />
                  <button
                    className={`mini-button ${layer.visible ? 'active' : ''}`}
                    onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                  >
                    {layer.visible ? '표시' : '숨김'}
                  </button>
                  <button
                    className={`mini-button ${layer.locked ? 'active' : ''}`}
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
              {groupedImportWarnings.length ? (
                groupedImportWarnings.map((warning, index) => (
                  <div className="warning-item" key={`${warning.code}-${index}`}>
                    <strong>{warning.code}</strong>
                    <span>
                      {warning.message}
                      {warning.count > 1 ? ` (${warning.count}개)` : ''}
                    </span>
                  </div>
                ))
              ) : (
                <p className="empty-state">변환 경고가 없습니다.</p>
              )}
              {document.unsupportedEntities?.length ? (
                <div className="warning-item">
                  <strong>미지원 객체</strong>
                  <span>{document.unsupportedEntities.length}개 객체가 변환되지 않았습니다.</span>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
        </section>
      ) : (
        <section className="start-page">
          <div className="start-page-inner">
            <div className="start-heading">
              <span className="brand-mark">WC</span>
              <div>
                <h1>Web CAD</h1>
                <p>도면을 열거나 새 작업을 시작하세요.</p>
              </div>
            </div>
            <div className="start-actions">
              <button className="start-action primary" onClick={createNewDrawing}>
                <Plus size={20} />
                <span>새 도면</span>
              </button>
              <button className="start-action" onClick={() => fileInputRef.current?.click()}>
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
          </div>
        </section>
      )}

      <footer className="statusbar">
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

function fileTypeFromName(fileName: string): CadFileType {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith('.dxf')) return 'dxf';
  if (normalized.endsWith('.dwg')) return 'dwg';
  if (normalized.endsWith('.svg')) return 'svg';
  return 'json';
}
