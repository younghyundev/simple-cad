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
import { sampleDocument } from '../cad/sampleDocument';
import type { CadDocument, CadPoint, ToolId, Viewport } from '../cad/types';
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

export function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('select');
  const [document, setDocument] = useState<CadDocument>(sampleDocument);
  const [viewport, setViewport] = useState<Viewport>({ offsetX: 480, offsetY: 320, scale: 1 });
  const [cursor, setCursor] = useState<CadPoint>({ x: 0, y: 0 });
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>('rect-1');
  const [gridVisible, setGridVisible] = useState(true);
  const selectedEntity = useMemo(
    () => document.entities.find((entity) => entity.id === selectedEntityId) ?? null,
    [document.entities, selectedEntityId],
  );
  const canvasApiRef = useRef<{ zoomBy: (factor: number) => void } | null>(null);

  const setCanvasApi = useCallback((api: { zoomBy: (factor: number) => void }) => {
    canvasApiRef.current = api;
  }, []);

  const deleteSelectedEntity = useCallback(() => {
    if (!selectedEntityId) return;
    setDocument((current) => ({
      ...current,
      entities: current.entities.filter((entity) => entity.id !== selectedEntityId),
    }));
    setSelectedEntityId(null);
  }, [selectedEntityId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelectedEntity();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteSelectedEntity]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">WC</span>
          <span>Web CAD</span>
        </div>
        <div className="toolbar-group">
          <button className="tool-button wide" title="열기">
            <FileUp size={17} />
            열기
          </button>
          <button className="tool-button wide" title="저장">
            <Save size={17} />
            저장
          </button>
          <button className="tool-button wide" title="내보내기">
            <FileDown size={17} />
            내보내기
          </button>
        </div>
        <div className="toolbar-group">
          <button className="tool-button icon" title="실행 취소">
            <Undo2 size={17} />
          </button>
          <button className="tool-button icon" title="다시 실행">
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
          onDocumentChange={setDocument}
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
                  <dd>{document.layers.find((layer) => layer.id === selectedEntity.layerId)?.name}</dd>
                </div>
                <div>
                  <dt>색상</dt>
                  <dd>
                    <span className="swatch" style={{ background: selectedEntity.strokeColor }} />
                    {selectedEntity.strokeColor}
                  </dd>
                </div>
                <div>
                  <dt>선 두께</dt>
                  <dd>{selectedEntity.strokeWidth}</dd>
                </div>
              </dl>
            ) : (
              <p className="empty-state">선택된 객체가 없습니다.</p>
            )}
          </div>

          <div className="panel-section">
            <h2>레이어</h2>
            <div className="layer-list">
              {document.layers.map((layer) => (
                <div className="layer-row" key={layer.id}>
                  <span className="swatch" style={{ background: layer.color }} />
                  <span>{layer.name}</span>
                  <span className="layer-state">{layer.visible ? '표시' : '숨김'}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <footer className="statusbar">
        <span>좌표 X {cursor.x.toFixed(1)} / Y {cursor.y.toFixed(1)}</span>
        <span>줌 {(viewport.scale * 100).toFixed(0)}%</span>
        <span>{selectedEntity ? `선택: ${selectedEntity.id}` : '선택 없음'}</span>
        <span>도구: {tools.find((tool) => tool.id === activeTool)?.label}</span>
      </footer>
    </main>
  );
}
