import {
  Circle,
  FileDown,
  FileUp,
  Grid3X3,
  Hand,
  MousePointer2,
  Move,
  Redo2,
  Save,
  Square,
  Trash2,
  Type,
  Undo2,
  Waypoints,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { FileManager } from '../cad/io/fileManager';
import { sampleDocument } from '../cad/sampleDocument';
import type { CadEntity, CadLayer, CadPoint, ToolId, Viewport } from '../cad/types';
import { useDocumentHistory } from '../cad/useDocumentHistory';
import { CadCanvas } from './CadCanvas';

const tools: Array<{ id: ToolId; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: 'select', label: '선택', icon: MousePointer2 },
  { id: 'pan', label: '화면 이동', icon: Hand },
  { id: 'line', label: '선', icon: Move },
  { id: 'rect', label: '사각형', icon: Square },
  { id: 'circle', label: '원', icon: Circle },
  { id: 'polyline', label: '폴리라인', icon: Waypoints },
  { id: 'text', label: '텍스트', icon: Type },
  { id: 'erase', label: '삭제', icon: Trash2 },
];

const fileManager = new FileManager();

export function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('select');
  const {
    document,
    updateDocument,
    replaceDocument,
    beginHistoryBatch,
    commitHistoryBatch,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDocumentHistory(sampleDocument);
  const [viewport, setViewport] = useState<Viewport>({ offsetX: 480, offsetY: 320, scale: 1 });
  const [cursor, setCursor] = useState<CadPoint>({ x: 0, y: 0 });
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>('rect-1');
  const [gridVisible, setGridVisible] = useState(true);
  const [fileMessage, setFileMessage] = useState('자동 저장 준비됨');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedEntity = useMemo(
    () => document.entities.find((entity) => entity.id === selectedEntityId) ?? null,
    [document.entities, selectedEntityId],
  );
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
    [document, downloadBlob],
  );

  const openFile = useCallback(async (file: File) => {
    try {
      const nextDocument = await fileManager.open(file);
      replaceDocument({
        ...nextDocument,
        name: nextDocument.name || file.name,
        sourceFile: {
          name: file.name,
          type: file.name.endsWith('.dxf') ? 'dxf' : file.name.endsWith('.dwg') ? 'dwg' : 'json',
          lastSavedAt: new Date().toISOString(),
          fileHandleAvailable: false,
        },
      });
      setSelectedEntityId(null);
      setFileMessage(`${file.name} 파일을 열었습니다.`);
    } catch (error) {
      setFileMessage(error instanceof Error ? error.message : '파일을 열 수 없습니다.');
    }
  }, [replaceDocument]);

  const deleteSelectedEntity = useCallback(() => {
    if (!selectedEntityId) return;
    updateDocument((current) => ({
      ...current,
      entities: current.entities.filter((entity) => entity.id !== selectedEntityId),
    }));
    setSelectedEntityId(null);
  }, [selectedEntityId, updateDocument]);

  const updateSelectedEntity = useCallback(
    (patch: Partial<CadEntity>) => {
      if (!selectedEntityId) return;
      updateDocument((current) => ({
        ...current,
        entities: current.entities.map((entity) =>
          entity.id === selectedEntityId ? ({ ...entity, ...patch } as CadEntity) : entity,
        ),
      }));
    },
    [selectedEntityId, updateDocument],
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
      localStorage.setItem('webcad.autosave', JSON.stringify(document));
      setFileMessage(`자동 저장됨 ${new Date().toLocaleTimeString()}`);
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [document]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditingText =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isEditingText) return;

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

      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelectedEntity();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteSelectedEntity, redo, undo]);

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
          <button
            className="tool-button wide"
            title="열기"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp size={17} />
            열기
          </button>
          <button className="tool-button wide" title="JSON 저장" onClick={() => void saveAs('json')}>
            <Save size={17} />
            저장
          </button>
          <button className="tool-button wide" title="SVG 내보내기" onClick={() => void saveAs('svg')}>
            <FileDown size={17} />
            SVG
          </button>
          <button className="tool-button wide" title="DXF 내보내기" onClick={() => void saveAs('dxf')}>
            <FileDown size={17} />
            DXF
          </button>
          <button className="tool-button wide" title="DWG 내보내기" onClick={() => void saveAs('dwg')}>
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
        </div>
      </header>

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
          selectedEntityId={selectedEntityId}
          gridVisible={gridVisible}
          onViewportChange={setViewport}
          onCursorChange={setCursor}
          onDocumentChange={updateDocument}
          onDocumentBatchStart={beginHistoryBatch}
          onDocumentBatchCommit={commitHistoryBatch}
          onSelectedEntityChange={setSelectedEntityId}
          onReady={setCanvasApi}
        />

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
              </dl>
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
              {document.importWarnings?.length ? (
                document.importWarnings.map((warning, index) => (
                  <div className="warning-item" key={`${warning.code}-${index}`}>
                    <strong>{warning.code}</strong>
                    <span>{warning.message}</span>
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

      <footer className="statusbar">
        <span>좌표 X {cursor.x.toFixed(1)} / Y {cursor.y.toFixed(1)}</span>
        <span>줌 {(viewport.scale * 100).toFixed(0)}%</span>
        <span>{selectedEntity ? `선택: ${selectedEntity.id}` : '선택 없음'}</span>
        <span>도구: {tools.find((tool) => tool.id === activeTool)?.label}</span>
        <span>{fileMessage}</span>
      </footer>
    </main>
  );
}
