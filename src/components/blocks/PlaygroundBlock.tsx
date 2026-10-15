import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import type { PlaygroundBlock as PlaygroundBlockType } from '../../types';
import { CDN_URL } from '../../data/docPages';
import { loadMonaco, loadTypeScript } from '../../lib/editor-runtime';

declare global {
  interface Window {
    monaco: any;
    require: {
      config: (opts: object) => void;
      (deps: string[], cb: () => void, onError?: (error: unknown) => void): void;
    };
    ts: {
      transpileModule: (code: string, opts: object) => { outputText: string };
      ModuleKind: { ESNext: number };
      ScriptTarget: { ES2022: number };
    };
  }
}

interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'error' | 'warn';
}

let logIdCounter = 0;

const PlaygroundBlock: React.FC<{ block: PlaygroundBlockType }> = ({ block }) => {
  const { theme } = useTheme();
  
  const monacoContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const currentSceneRef = useRef<{ destroy?: () => void } | null>(null);
  const consoleOutputRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<any>(null);
  const compilingRef = useRef(false);
  const rerunRequestedRef = useRef(false);
  const runVersionRef = useRef(0);

  const pgId = block.id || `pg-${block.filename.replace(/[^a-zA-Z0-9]/g, '')}`;

  // State
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 0, text: "> Ready. Press 'Run' to compile...", type: 'info' },
  ]);
  const [isMonacoReady, setIsMonacoReady] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  
  // Toggles
  const [isLive, setIsLive] = useState(() => localStorage.getItem('retiam_pg_live') === 'true');
  const [isPreserveState, setIsPreserveState] = useState(() => {
    const stored = localStorage.getItem('retiam_pg_preserve');
    // Default is true (preserve on). Write default if first visit.
    if (stored === null) {
      localStorage.setItem('retiam_pg_preserve', 'true');
      return true;
    }
    return stored !== 'false';
  });
  const [showCode, setShowCode] = useState(true);
  const [showCanvas, setShowCanvas] = useState(true);
  const [showConsole, setShowConsole] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCanvasAuto, setIsCanvasAuto] = useState(() => localStorage.getItem('retiam_pg_auto') === 'true');

  // Refs for current toggle values (for use in Monaco callbacks without stale closures)
  const isLiveRef = useRef(isLive);
  const isPreserveStateRef = useRef(isPreserveState);
  const isCanvasAutoRef = useRef(isCanvasAuto);
  // Holds scene state snapshot to restore after re-run (like studio)
  const pendingRestoreStateRef = useRef<any>(null);

  useEffect(() => { isLiveRef.current = isLive; }, [isLive]);
  useEffect(() => { isPreserveStateRef.current = isPreserveState; }, [isPreserveState]);
  useEffect(() => { isCanvasAutoRef.current = isCanvasAuto; }, [isCanvasAuto]);

  const appendLog = useCallback((text: string, type: 'info' | 'error' | 'warn' = 'info') => {
    setLogs((prev) => [...prev, { id: ++logIdCounter, text: `> ${text}`, type }]);
  }, []);

  const compileAndRun = useCallback(async () => {
    if (!editorRef.current || !canvasWrapperRef.current) return;
    if (compilingRef.current) {
      rerunRequestedRef.current = true;
      return;
    }
    compilingRef.current = true;
    setIsCompiling(true);
    const version = ++runVersionRef.current;
    let blobUrl: string | null = null;
    let startingScene: { start: (canvas: HTMLCanvasElement) => Promise<void>; destroy?: () => void } | null = null;

    const userTsCode = editorRef.current.getValue();
    const libUrl = block.url || CDN_URL;

    // Snapshot scene state before destroying (like studio)
    if (isPreserveStateRef.current && currentSceneRef.current) {
      const s = currentSceneRef.current as any;
      pendingRestoreStateRef.current = {
        time: s.time,
        isPaused: s.isPaused,
        camera: s.camera ? {
          position: s.camera.position ? [s.camera.position.x, s.camera.position.y, s.camera.position.z] : null,
          rotation: s.camera.rotation ? [s.camera.rotation.x, s.camera.rotation.y, s.camera.rotation.z, s.camera.rotation.w] : null,
          pitch: s.camera.pitch,
          yaw: s.camera.yaw,
          fov: s.camera.fov,
          model: s.camera.model,
          orthoScale: s.camera.orthoScale,
          targetCenter: s.controls?.targetCenter ? [s.controls.targetCenter.x, s.controls.targetCenter.y, s.controls.targetCenter.z] : null,
          targetRadius: s.controls?.targetRadius,
        } : null,
      };
    } else {
      pendingRestoreStateRef.current = null;
    }

    setLogs([]);
    appendLog('Compiling TypeScript...');

    // For auto size, read dimensions AFTER CSS has settled
    const readDimensions = () => {
      const cWidth = isCanvasAutoRef.current ? canvasWrapperRef.current!.clientWidth : 512;
      const cHeight = isCanvasAutoRef.current ? canvasWrapperRef.current!.clientHeight : 512;
      return { cWidth: cWidth || 512, cHeight: cHeight || 512 };
    };
    const { cWidth, cHeight } = readDimensions();

    currentSceneRef.current?.destroy?.();
    currentSceneRef.current = null;
    canvasWrapperRef.current.innerHTML = `<canvas id="retiam-canvas-${pgId}" width="${cWidth}" height="${cHeight}"></canvas>`;
    const canvas = canvasWrapperRef.current.querySelector('canvas') as HTMLCanvasElement;

    try {
      await loadTypeScript();
      const RetiamModule = await import(/* @vite-ignore */ libUrl);
      if (version !== runVersionRef.current) return;
      const exportedKeys = Object.keys(RetiamModule).filter((k) => k !== 'default');

      const fullTsModule = `
import * as R_Internal from '${libUrl}';
const { ${exportedKeys.join(', ')} } = R_Internal;

${userTsCode}
      `;

      const transpileResult = window.ts.transpileModule(fullTsModule, {
        compilerOptions: {
          module: window.ts.ModuleKind.ESNext,
          target: window.ts.ScriptTarget.ES2022,
        },
      });

      const blob = new Blob([transpileResult.outputText], { type: 'application/javascript' });
      blobUrl = URL.createObjectURL(blob);
      const mod = await import(/* @vite-ignore */ blobUrl);

      const SceneClass = mod.default;
      if (!SceneClass) {
        throw new Error("No default export found. Use 'export default class MyScene extends Scene'");
      }

      appendLog('Starting Renderer...');
      startingScene = new SceneClass();
      await startingScene!.start(canvas);
      if (version !== runVersionRef.current) return;
      currentSceneRef.current = startingScene;
      startingScene = null;

      // Restore scene state snapshot after start (like studio)
      const restore = pendingRestoreStateRef.current;
      if (restore) {
        const scene = currentSceneRef.current as any;
        const restoreCamera = (cam: any, saved: any) => {
          if (!cam || !saved) return;
          if (saved.position && cam.position) cam.position.set(saved.position);
          if (saved.rotation && cam.rotation) {
            if (Array.isArray(saved.rotation)) cam.rotation.set(...saved.rotation);
            else if (typeof cam.rotation.copy === 'function') cam.rotation.copy(saved.rotation);
          }
          for (const name of ['pitch', 'yaw', 'fov', 'model', 'orthoScale']) {
            if (saved[name] !== undefined) cam[name] = saved[name];
          }
          cam.invalidateTransform?.();
          if (saved.targetCenter && scene.controls?.targetCenter) scene.controls.targetCenter.set(saved.targetCenter);
          if (saved.targetRadius !== undefined && scene.controls) scene.controls.targetRadius = saved.targetRadius;
          if (scene.controls && typeof scene.controls.syncFromCamera === 'function') {
            scene.controls.syncFromCamera();
          }
        };

        if (scene.camera && restore.camera) {
          restoreCamera(scene.camera, restore.camera);
        }

        if (typeof restore.time === 'number' && restore.time > 0 && typeof scene.seekTo === 'function') {
          try {
            await scene.seekTo(restore.time);
          } catch (e: any) {
            if (e?.message !== 'Scene Reset') console.warn('seekTo warning:', e);
          }
        } else if (typeof restore.time === 'number') {
          scene.time = restore.time;
        }

        if (scene.camera && restore.camera) {
          restoreCamera(scene.camera, restore.camera);
        }

        if (restore.isPaused && typeof scene.pause === 'function') scene.pause();
        scene.invalidate?.();
        pendingRestoreStateRef.current = null;
      }
    } catch (err) {
      if (version !== runVersionRef.current) return;
      pendingRestoreStateRef.current = null;
      const message = err instanceof Error ? err.message : String(err);
      appendLog('Execution Error: ' + message, 'error');

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = theme === 'dark' ? '#1E1E1E' : '#FFFFFF';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#BA1A1A';
        ctx.font = '14px "Fira Code"';
        ctx.fillText('Failed to build/load Retiam Scene.', 20, 40);
        ctx.fillStyle = '#72777C';
        ctx.fillText('URL: ' + libUrl, 20, 70);
      }
    } finally {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      startingScene?.destroy?.();
      compilingRef.current = false;
      if (version === runVersionRef.current) {
        setIsCompiling(false);
        if (rerunRequestedRef.current) {
          rerunRequestedRef.current = false;
          queueMicrotask(() => compileAndRunRef.current());
        }
      }
    }
  }, [appendLog, theme, block.url, pgId]);

  const compileAndRunRef = useRef(compileAndRun);
  useEffect(() => { compileAndRunRef.current = compileAndRun; }, [compileAndRun]);

  useEffect(() => () => {
    runVersionRef.current++;
    rerunRequestedRef.current = false;
    clearTimeout(debounceTimer.current);
    currentSceneRef.current?.destroy?.();
    currentSceneRef.current = null;
  }, []);

  const compileAndRunDebounced = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      compileAndRunRef.current();
    }, 500);
  }, []);

  // Initialize Monaco
  useEffect(() => {
    // React Strict Mode mounts, cleans up, then mounts development components
    // once more. Monaco's AMD loader resolves asynchronously, so a callback
    // from the first mount can otherwise try to create a second editor in the
    // same DOM container.
    let cancelled = false;
    let localEditor: any = null;

    loadMonaco().then(monaco => {
      const container = monacoContainerRef.current;
      if (cancelled || !container || editorRef.current) return;

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2022,
        allowNonTsExtensions: true,
        noImplicitThis: false,
      });
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });

      localEditor = monaco.editor.create(container, {
        value: block.code,
        language: 'typescript',
        theme: theme === 'dark' ? 'vs-dark' : 'vs',
        automaticLayout: false,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'Fira Code', monospace",
        fontLigatures: true,
        padding: { top: 16, bottom: 16 },
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        }
      });
      editorRef.current = localEditor;

      localEditor.onDidChangeModelContent(() => {
        if (isLiveRef.current) {
          compileAndRunDebounced();
        }
      });

      resizeObserverRef.current = new ResizeObserver(() => {
        editorRef.current?.layout();
      });
      resizeObserverRef.current.observe(container);

      setIsMonacoReady(true);
    }).catch(() => appendLog('The editor could not load. Check your connection and reload to retry.', 'error'));

    return () => {
      cancelled = true;
      if (editorRef.current === localEditor) {
        resizeObserverRef.current?.disconnect();
        localEditor?.dispose();
        editorRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isMonacoReady) return;
    window.monaco?.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
  }, [theme, isMonacoReady]);

  // Auto-run on mount
  useEffect(() => {
    if (isMonacoReady) {
      compileAndRunRef.current();
    }
  }, [isMonacoReady]);

  // No code-sync effect needed — preserve state is scene-state only

  useEffect(() => {
    if (consoleOutputRef.current) {
      consoleOutputRef.current.scrollTop = consoleOutputRef.current.scrollHeight;
    }
  }, [logs]);

  // Handlers for Toggles
  const handleToggleLive = () => {
    const next = !isLive;
    setIsLive(next);
    localStorage.setItem('retiam_pg_live', String(next));
  };

  const handleTogglePreserve = () => {
    const next = !isPreserveState;
    setIsPreserveState(next);
    localStorage.setItem('retiam_pg_preserve', String(next));
    // Turning off: discard any pending restore snapshot
    if (!next) pendingRestoreStateRef.current = null;
  };

  const handleReset = () => {
    if (editorRef.current) {
      editorRef.current.setValue(block.code);
      pendingRestoreStateRef.current = null; // don't restore old scene state on reset
      compileAndRun();
    }
  };

  const triggerLayoutUpdate = () => {
    setTimeout(() => {
      editorRef.current?.layout();
      window.dispatchEvent(new Event('resize'));
    }, 50);
    // Also trigger after the CSS transition finishes
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 350); 
  };

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    triggerLayoutUpdate();
  };

  const toggleCode = () => {
    setShowCode(!showCode);
    triggerLayoutUpdate();
  };
  
  const toggleCanvas = () => {
    setShowCanvas(!showCanvas);
    triggerLayoutUpdate();
  };
  
  const toggleConsole = () => {
    setShowConsole(!showConsole);
    triggerLayoutUpdate();
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleToggleCanvasAuto = () => {
    const next = !isCanvasAuto;
    setIsCanvasAuto(next);
    localStorage.setItem('retiam_pg_auto', String(next));
    // Re-run after CSS transition settles so we read correct dimensions
    setTimeout(() => {
      compileAndRunRef.current();
    }, 400);
  };

  // Build Classes
  let playgroundClass = "playground-card";
  if (isFullScreen) playgroundClass += " fullscreen";
  if (!showCode) playgroundClass += " hide-code";
  if (!showCanvas) playgroundClass += " hide-canvas";
  if (!showConsole) playgroundClass += " hide-console";

  return (
    <div className="playground-section">

      <div className={playgroundClass}>
        {/* Toolbar */}
        <div className="playground-toolbar">
          <div className="toolbar-group">
            <span className="material-symbols-outlined" style={{ color: 'var(--md-primary)' }}>
              code_blocks
            </span>
            <span className="toolbar-label" style={{ marginRight: 16 }}>Live Editor</span>
            
            <button className={`icon-btn ${isLive ? 'active' : ''}`} onClick={handleToggleLive} title="Live Auto-Run">
              <span className="material-symbols-outlined">bolt</span>
            </button>
            <button className={`icon-btn ${isPreserveState ? 'active' : ''}`} onClick={handleTogglePreserve} title="Preserve State">
              <span className="material-symbols-outlined">save</span>
            </button>
            <button className="icon-btn" onClick={handleReset} title="Reset Code">
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
          
          <div className="toolbar-group">
            <button className="icon-btn" onClick={compileAndRun} title="Run Scene" disabled={!isMonacoReady || isCompiling}>
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
            <button className="icon-btn" onClick={handleToggleFullScreen} title="Toggle Fullscreen">
              <span className="material-symbols-outlined">{isFullScreen ? 'fullscreen_exit' : 'fullscreen'}</span>
            </button>
            <button className={`icon-btn ${isSettingsOpen ? 'active' : ''}`} onClick={toggleSettings} title="View Settings">
              <span className="material-symbols-outlined">settings</span>
            </button>
            {isSettingsOpen && (
              <div className="settings-dropdown">
                <button className={`dropdown-item ${showCode ? 'active' : ''}`} onClick={toggleCode}>
                  <span>Show Code</span>
                  {showCode && <span className="material-symbols-outlined">check</span>}
                </button>
                <button className={`dropdown-item ${showCanvas ? 'active' : ''}`} onClick={toggleCanvas}>
                  <span>Show Result</span>
                  {showCanvas && <span className="material-symbols-outlined">check</span>}
                </button>
                <button className={`dropdown-item ${showConsole ? 'active' : ''}`} onClick={toggleConsole}>
                  <span>Show Console</span>
                  {showConsole && <span className="material-symbols-outlined">check</span>}
                </button>
                <div style={{ height: 1, background: 'var(--md-outline-variant)', margin: '4px 0' }} />
                <button className={`dropdown-item ${isCanvasAuto ? 'active' : ''}`} onClick={handleToggleCanvasAuto}>
                  <span>Auto Canvas Size</span>
                  {isCanvasAuto && <span className="material-symbols-outlined">check</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* IDE Body */}
        <div className="ide-body">
          {/* Left: Code & Console */}
          <div className="code-panel">
            <div className="monaco-container" ref={monacoContainerRef} />

            <div className="console-panel">
                <div className="console-header">Terminal Output</div>
                  <div className="console-output" ref={consoleOutputRef} id="console-output">
                    {logs.map((log) => (
                      <div key={log.id} className={`log-entry ${log.type}`}>
                        {log.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          {/* Right: Canvas */}
          <div className={`canvas-panel`}>
            <div className={`canvas-bg ${isCanvasAuto ? 'auto-size' : ''}`}>
              <div className={`canvas-wrapper ${isCanvasAuto ? 'auto-size' : ''}`} ref={canvasWrapperRef} id="canvas-wrapper">
                <canvas id={`retiam-canvas-${pgId}`} width={512} height={512} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundBlock;
