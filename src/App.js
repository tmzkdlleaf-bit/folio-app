import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Sun, Moon, Leaf, Download, Grid, Type,
  Trash2, MoveHorizontal, MoveVertical, Maximize,
  Upload, Folder, FileText, ChevronLeft,
  Bold, Italic, Underline, Monitor,
  Plus, Layers, ArrowUpToLine, ArrowDownToLine, FilePlus,
  Square, Minus,
  Group, Ungroup, Sparkles, Save, X, ChevronDown
} from 'lucide-react';

// ─────────────────────────────────────────────
// 상수 정의
// ─────────────────────────────────────────────
const fontOptions = [
  { name: '기본 고딕 (Noto)', value: '"Noto Sans KR", sans-serif' },
  { name: '나눔 명조 (Myeongjo)', value: '"Nanum Myeongjo", serif' },
  { name: '고운 돋움 (Dodum)', value: '"Gowun Dodum", sans-serif' },
];

const canvasPresets = {
  A4:     { width: 794,  height: 1123, label: 'A4 세로' },
  A4_L:   { width: 1123, height: 794,  label: 'A4 가로' },
  B4:     { width: 945,  height: 1338, label: 'B4 세로' },
  FHD:    { width: 1920, height: 1080, label: '웹/FHD' },
  CUSTOM: { width: 800,  height: 600,  label: '사용자 지정' },
};

// 도형 종류 목록
const shapeTypes = [
  { id: 'rect',      label: '사각형',   icon: '▭' },
  { id: 'rect_r',    label: '둥근 사각형', icon: '▢' },
  { id: 'circle',    label: '원',       icon: '○' },
  { id: 'triangle',  label: '삼각형',   icon: '△' },
  { id: 'diamond',   label: '마름모',   icon: '◇' },
  { id: 'pentagon',  label: '오각형',   icon: '⬠' },
  { id: 'hexagon',   label: '육각형',   icon: '⬡' },
  { id: 'star',      label: '별',       icon: '★' },
  { id: 'arrow_r',   label: '오른쪽 화살표', icon: '→' },
  { id: 'speech',    label: '말풍선',   icon: '💬' },
  { id: 'cylinder',  label: '실린더',   icon: '⬛' },
  { id: 'cross',     label: '십자',     icon: '+' },
];

// AI 템플릿 프롬프트 옵션
const aiTemplateOptions = [
  { id: 'resume',   label: '이력서 레이아웃',    prompt: '이력서 기본 레이아웃' },
  { id: 'portfolio',label: '포트폴리오 표지',     prompt: '포트폴리오 표지 디자인' },
  { id: 'infographic', label: '인포그래픽',      prompt: '인포그래픽 레이아웃' },
  { id: 'business', label: '명함',              prompt: '명함 레이아웃' },
];

const initialFolders = [
  {
    id: 'f1', name: '철도 공기업 지원',
    files: [{ id: 'file1', name: '코레일 직무수행계획서', pages: [{ id: 'p1', elements: [] }], lastModified: '2026-05-24' }]
  },
  {
    id: 'f2', name: '창작 및 캐릭터 설정',
    files: [{ id: 'file2', name: '슈니(Schnee) 여유/투덜 표정 시트', pages: [{ id: 'p1', elements: [] }], lastModified: '2026-05-20' }]
  }
];

// ─────────────────────────────────────────────
// 도형 SVG 렌더러
// ─────────────────────────────────────────────
function ShapeSVG({ shape, width, height, fill, stroke, strokeWidth = 2, innerText, textStyle }) {
  const w = width  || 100;
  const h = height || 100;
  const sw = strokeWidth;

  const textEl = innerText ? (
    <text
      x={w / 2} y={h / 2}
      textAnchor="middle" dominantBaseline="central"
      fill={textStyle?.color || '#374151'}
      fontSize={textStyle?.fontSize || 16}
      fontFamily={textStyle?.fontFamily || 'sans-serif'}
      fontWeight={textStyle?.fontWeight || 'normal'}
      fontStyle={textStyle?.fontStyle || 'normal'}
      style={{ userSelect: 'none', whiteSpace: 'pre-wrap' }}
    >{innerText}</text>
  ) : null;

  const common = { fill: fill || '#d1d5db', stroke: stroke || '#6b7280', strokeWidth: sw };

  switch (shape) {
    case 'rect':
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
          <rect x={sw/2} y={sw/2} width={w-sw} height={h-sw} {...common} />
          {textEl}
        </svg>
      );
    case 'rect_r':
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
          <rect x={sw/2} y={sw/2} width={w-sw} height={h-sw} rx={12} ry={12} {...common} />
          {textEl}
        </svg>
      );
    case 'circle':
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
          <ellipse cx={w/2} cy={h/2} rx={w/2-sw/2} ry={h/2-sw/2} {...common} />
          {textEl}
        </svg>
      );
    case 'triangle': {
      const pts = `${w/2},${sw} ${w-sw},${h-sw} ${sw},${h-sw}`;
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
          <polygon points={pts} {...common} />
          {textEl}
        </svg>
      );
    }
    case 'diamond': {
      const pts = `${w/2},${sw} ${w-sw},${h/2} ${w/2},${h-sw} ${sw},${h/2}`;
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
          <polygon points={pts} {...common} />
          {textEl}
        </svg>
      );
    }
    case 'pentagon': {
      const cx=w/2, cy=h/2, rx2=w/2-sw, ry2=h/2-sw;
      const pts = Array.from({length:5},(_,i) => {
        const a = (i*72 - 90) * Math.PI/180;
        return `${cx+rx2*Math.cos(a)},${cy+ry2*Math.sin(a)}`;
      }).join(' ');
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
          <polygon points={pts} {...common} />
          {textEl}
        </svg>
      );
    }
    case 'hexagon': {
      const cx=w/2, cy=h/2, rx2=w/2-sw, ry2=h/2-sw;
      const pts = Array.from({length:6},(_,i) => {
        const a = (i*60 - 30) * Math.PI/180;
        return `${cx+rx2*Math.cos(a)},${cy+ry2*Math.sin(a)}`;
      }).join(' ');
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
          <polygon points={pts} {...common} />
          {textEl}
        </svg>
      );
    }
    case 'star': {
      const cx=w/2, cy=h/2;
      const outerR = Math.min(w,h)/2 - sw;
      const innerR = outerR * 0.4;
      const pts = Array.from({length:10},(_,i) => {
        const a = (i*36 - 90) * Math.PI/180;
        const r = i%2===0 ? outerR : innerR;
        return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;
      }).join(' ');
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
          <polygon points={pts} {...common} />
          {textEl}
        </svg>
      );
    }
    case 'arrow_r': {
      const shaft = h * 0.35;
      const midY = h / 2;
      const arrowW = w * 0.35;
      const pts = `${sw},${midY-shaft/2} ${w-arrowW},${midY-shaft/2} ${w-arrowW},${sw} ${w-sw},${midY} ${w-arrowW},${h-sw} ${w-arrowW},${midY+shaft/2} ${sw},${midY+shaft/2}`;
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
          <polygon points={pts} {...common} />
          {textEl}
        </svg>
      );
    }
    case 'speech': {
      const tailH = h * 0.18;
      const bodyH = h - tailH - sw;
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
          <rect x={sw/2} y={sw/2} width={w-sw} height={bodyH} rx={10} {...common} />
          <polygon points={`${w*0.2},${bodyH} ${w*0.1},${h-sw} ${w*0.38},${bodyH}`} {...common} />
          {textEl && React.cloneElement(textEl, { y: bodyH/2 })}
        </svg>
      );
    }
    case 'cylinder': {
      const ry2 = h * 0.12;
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
          <rect x={sw/2} y={ry2} width={w-sw} height={h-ry2*2-sw/2} {...common} />
          <ellipse cx={w/2} cy={ry2} rx={w/2-sw/2} ry={ry2} {...common} />
          <ellipse cx={w/2} cy={h-ry2-sw/2} rx={w/2-sw/2} ry={ry2} {...common} />
          {textEl && React.cloneElement(textEl, { y: h/2 + ry2/2 })}
        </svg>
      );
    }
    case 'cross': {
      const t = Math.min(w,h) * 0.28;
      const cx=w/2, cy=h/2;
      const pts = `${cx-t/2},${sw} ${cx+t/2},${sw} ${cx+t/2},${cy-t/2} ${w-sw},${cy-t/2} ${w-sw},${cy+t/2} ${cx+t/2},${cy+t/2} ${cx+t/2},${h-sw} ${cx-t/2},${h-sw} ${cx-t/2},${cy+t/2} ${sw},${cy+t/2} ${sw},${cy-t/2} ${cx-t/2},${cy-t/2}`;
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
          <polygon points={pts} {...common} />
          {textEl}
        </svg>
      );
    }
    default:
      return null;
  }
}

// ─────────────────────────────────────────────
// 선(Line) SVG 렌더러
// ─────────────────────────────────────────────
function LineSVG({ width, height, stroke, strokeWidth = 2, lineStyle = 'solid', arrowStart = false, arrowEnd = false }) {
  const w = width || 200;
  const h = height || 4;
  const sw = strokeWidth;
  const dasharray = lineStyle === 'dashed' ? '10,6' : lineStyle === 'dotted' ? '3,5' : undefined;
  const markerId = `arrow_${Math.random().toString(36).slice(2,7)}`;
  return (
    <svg width={w} height={Math.max(h, sw+20)} viewBox={`0 0 ${w} ${Math.max(h, sw+20)}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={stroke || '#6b7280'} />
        </marker>
      </defs>
      <line
        x1={sw} y1={Math.max(h, sw+20)/2}
        x2={w-sw} y2={Math.max(h, sw+20)/2}
        stroke={stroke || '#6b7280'}
        strokeWidth={sw}
        strokeDasharray={dasharray}
        markerStart={arrowStart ? `url(#${markerId})` : undefined}
        markerEnd={arrowEnd ? `url(#${markerId})` : undefined}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
// APP (최상위)
// ─────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState('dashboard');
  const [folders, setFolders] = useState(initialFolders);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);

  const themeStyles = {
    dark:  { bg: 'bg-[#0f1115]', text: 'text-gray-100',  panel: 'bg-[#181b21]', border: 'border-white/5' },
    green: { bg: 'bg-[#121c17]', text: 'text-[#e0e8e4]', panel: 'bg-[#1a2922]', border: 'border-[#2a3d33]' },
    light: { bg: 'bg-gray-50',   text: 'text-gray-900',  panel: 'bg-white',      border: 'border-gray-200' }
  };
  const currentTheme = themeStyles[theme];

  const createNewFile = (folderId) => {
    const fileName = prompt('새 포트폴리오 파일 이름을 입력하세요:');
    if (!fileName) return;
    const newFile = {
      id: `file_${Date.now()}`, name: fileName,
      pages: [{ id: 'p1', elements: [] }],
      lastModified: new Date().toISOString().split('T')[0]
    };
    setFolders(folders.map(f => f.id === folderId ? { ...f, files: [...f.files, newFile] } : f));
  };

  if (view === 'dashboard') {
    return (
      <div className={`min-h-screen p-10 transition-colors duration-300 ${currentTheme.bg} ${currentTheme.text}`}>
        <header className="flex justify-between items-center mb-12 max-w-6xl mx-auto">
          <h1 className="text-2xl font-extrabold flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-xl"><Folder size={24}/></div>
            Portfolio Studio
          </h1>
          <div className={`flex items-center p-1 rounded-full ${currentTheme.panel} border ${currentTheme.border} shadow-sm`}>
            <button onClick={() => setTheme('light')} className={`p-2 rounded-full transition-all ${theme==='light' ? 'bg-white shadow-md text-amber-500' : 'text-gray-400 hover:text-gray-600'}`}><Sun size={16}/></button>
            <button onClick={() => setTheme('dark')}  className={`p-2 rounded-full transition-all ${theme==='dark'  ? 'bg-gray-700 shadow-md text-indigo-400' : 'text-gray-400 hover:text-gray-300'}`}><Moon size={16}/></button>
            <button onClick={() => setTheme('green')} className={`p-2 rounded-full transition-all ${theme==='green' ? 'bg-[#2a3d33] shadow-md text-emerald-400' : 'text-gray-400 hover:text-gray-300'}`}><Leaf size={16}/></button>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {folders.map(folder => (
            <div key={folder.id} className={`${currentTheme.panel} p-6 rounded-2xl border ${currentTheme.border} shadow-sm`}>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2"><Folder size={18} className="text-emerald-500"/> {folder.name}</h2>
                <button onClick={() => createNewFile(folder.id)} className="p-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-md transition" title="새 파일 생성"><FilePlus size={16}/></button>
              </div>
              <div className="flex flex-col gap-3">
                {folder.files.map(file => (
                  <div key={file.id}
                    onClick={() => { setCurrentFileId(file.id); setCurrentFolderId(folder.id); setView('editor'); }}
                    className="p-4 rounded-xl cursor-pointer flex items-center justify-between border border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
                    <div className="flex items-center gap-3 font-medium"><FileText size={16} className="text-gray-400"/> {file.name}</div>
                    <span className="text-xs text-gray-500">{file.lastModified}</span>
                  </div>
                ))}
                {folder.files.length === 0 && <p className="text-xs text-gray-500 p-2">파일이 없습니다.</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentFolder = folders.find(f => f.id === currentFolderId);
  const currentFile   = currentFolder.files.find(f => f.id === currentFileId);
  const updateFileData = (updatedFile) => {
    setFolders(folders.map(f => f.id === currentFolderId
      ? { ...f, files: f.files.map(file => file.id === currentFileId ? updatedFile : file) }
      : f
    ));
  };

  return <Editor file={currentFile} updateFile={updateFileData} goBack={() => setView('dashboard')} theme={theme} currentTheme={currentTheme} />;
}

// ─────────────────────────────────────────────
// EDITOR
// ─────────────────────────────────────────────
function Editor({ file, updateFile, goBack, theme, currentTheme }) {
  const [pages, setPages] = useState(file.pages);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const elements = pages[currentPageIndex].elements;

  const [selectedIds, setSelectedIds] = useState([]); // 다중 선택
  const selectedId = selectedIds[0] || null;

  // 선 도구 세부 설정
  const [lineConfig, setLineConfig]     = useState({ style: 'solid', arrowStart: false, arrowEnd: true, stroke: '#6b7280', strokeWidth: 2 });
  // 선택 툴바 탭: 'style' | 'text' | 'arrange'
  const [toolbarTab, setToolbarTab]     = useState('style');

  const [canvasSizeKey, setCanvasSizeKey] = useState('A4');
  const [canvasSize, setCanvasSize]       = useState(canvasPresets.A4);
  const [showGrid, setShowGrid]           = useState(true);
  const [showCenterLines, setShowCenterLines] = useState(false);
  const [globalAssets, setGlobalAssets]   = useState([]);
  const [zoom, setZoom]                   = useState(1);
  const [viewModeChangeTrigger, setViewModeChangeTrigger] = useState(0);

  // 사이드바 탭: 'tools' | 'assets' | 'templates'
  const [sidebarTab, setSidebarTab]       = useState('tools');
  // 사용자 지정 템플릿 목록
  const [userTemplates, setUserTemplates] = useState([]);
  // AI 생성 상태
  const [aiLoading, setAiLoading]         = useState(false);
  const [aiPrompt, setAiPrompt]           = useState('');
  // 도형/선 도구 패널 펼침
  const [shapesPanelOpen, setShapesPanelOpen] = useState(false);
  const [linePanelOpen, setLinePanelOpen]     = useState(false);

  const canvasRef   = useRef(null);
  const viewportRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── localStorage 동기화 ──
  useEffect(() => {
    const saved = localStorage.getItem('portfolio_assets');
    if (saved) setGlobalAssets(JSON.parse(saved));
    const savedTpl = localStorage.getItem('portfolio_user_templates');
    if (savedTpl) setUserTemplates(JSON.parse(savedTpl));
  }, []);
  useEffect(() => { localStorage.setItem('portfolio_assets', JSON.stringify(globalAssets)); }, [globalAssets]);
  useEffect(() => { localStorage.setItem('portfolio_user_templates', JSON.stringify(userTemplates)); }, [userTemplates]);

  // ── 상위 파일 동기화 ──
  useEffect(() => { updateFile({ ...file, pages }); }, [pages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 자동 줌 ──
  useEffect(() => {
    if (viewportRef.current) {
      const vW = viewportRef.current.clientWidth - 100;
      const vH = viewportRef.current.clientHeight - 100;
      const scale = Math.min(vW / canvasSize.width, vH / canvasSize.height);
      setZoom(scale > 1 ? 1 : scale);
    }
  }, [canvasSize, viewModeChangeTrigger]);

  // ── 키보드 단축키 ──
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
          updateElements(elements.filter(el => !selectedIds.includes(el.id)));
          setSelectedIds([]);
        }
      }
      // Ctrl+G: 그룹, Ctrl+Shift+G: 그룹해제
      if (e.ctrlKey && !e.shiftKey && e.key === 'g') { e.preventDefault(); groupSelected(); }
      if (e.ctrlKey && e.shiftKey && e.key === 'G')  { e.preventDefault(); ungroupSelected(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, elements]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 요소 업데이트 헬퍼 ──
  const updateElements = (newEls) => {
    const newPages = pages.map((p, i) => i === currentPageIndex ? { ...p, elements: newEls } : p);
    setPages(newPages);
  };
  const updateElement = (id, props) => {
    updateElements(elements.map(el => el.id === id ? { ...el, ...props } : el));
  };

  // ── 요소 추가 ──
  const addElement = (partial) => {
    const el = {
      id: `el_${Date.now()}`,
      x: canvasSize.width / 2 - 100,
      y: canvasSize.height / 2 - 60,
      width: 200, height: 120,
      zIndex: elements.length + 1,
      ...partial,
    };
    updateElements([...elements, el]);
    setSelectedIds([el.id]);
  };

  const addTextElement = () => addElement({
    type: 'text', content: '텍스트를 입력하세요',
    width: 300, height: 80,
    fontFamily: fontOptions[0].value, fontSize: 24,
    fontWeight: 'normal', color: '#374151',
    backgroundColor: 'transparent',
  });

  const addShapeElement = (shapeId) => addElement({
    type: 'shape', shape: shapeId,
    fill: '#d1d5db', stroke: '#6b7280', strokeWidth: 2,
    innerText: '', innerTextStyle: {
      fontFamily: fontOptions[0].value, fontSize: 16,
      fontWeight: 'normal', color: '#374151',
    },
  });

  const addLineElement = () => addElement({
    type: 'line', width: 200, height: 4,
    ...lineConfig,
  });

  const handleImageUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      const asset = { id: `asset_${Date.now()}`, src, name: f.name, type: 'image' };
      setGlobalAssets(prev => [asset, ...prev]);
      addElement({ type: 'image', src, width: 200, height: 200 });
    };
    reader.readAsDataURL(f);
  };

  // ── 레이어 ──
  const bringForward = () => { if (!selectedId) return; const el = elements.find(e=>e.id===selectedId); updateElement(selectedId, { zIndex: (el.zIndex||1)+1 }); };
  const sendBackward = () => { if (!selectedId) return; const el = elements.find(e=>e.id===selectedId); updateElement(selectedId, { zIndex: Math.max(1,(el.zIndex||1)-1) }); };

  // ── 그룹화 / 해제 (수정 2) ──
  const groupSelected = () => {
    if (selectedIds.length < 2) return;
    const toGroup = elements.filter(el => selectedIds.includes(el.id));
    const minX = Math.min(...toGroup.map(e=>e.x));
    const minY = Math.min(...toGroup.map(e=>e.y));
    const maxX = Math.max(...toGroup.map(e=>e.x+e.width));
    const maxY = Math.max(...toGroup.map(e=>e.y+e.height));
    const groupEl = {
      id: `el_${Date.now()}`,
      type: 'group',
      x: minX, y: minY,
      width: maxX-minX, height: maxY-minY,
      zIndex: Math.max(...toGroup.map(e=>e.zIndex||1)),
      children: toGroup.map(e=>({...e, x: e.x-minX, y: e.y-minY})),
    };
    const remaining = elements.filter(el => !selectedIds.includes(el.id));
    updateElements([...remaining, groupEl]);
    setSelectedIds([groupEl.id]);
  };

  const ungroupSelected = () => {
    if (!selectedId) return;
    const groupEl = elements.find(e=>e.id===selectedId && e.type==='group');
    if (!groupEl) return;
    const ungrouped = groupEl.children.map((c,i) => ({
      ...c, id: `el_${Date.now()}_${i}`,
      x: c.x + groupEl.x, y: c.y + groupEl.y,
    }));
    const remaining = elements.filter(e=>e.id!==selectedId);
    updateElements([...remaining, ...ungrouped]);
    setSelectedIds(ungrouped.map(e=>e.id));
  };

  // ── 스냅 드래그 ──
  const handleDrag = (e, d, el) => {
    let newX = d.x, newY = d.y;
    if (showCenterLines) {
      const cx = (canvasSize.width - el.width) / 2;
      const cy = (canvasSize.height - el.height) / 2;
      if (Math.abs(newX-cx) < 15) newX = cx;
      if (Math.abs(newY-cy) < 15) newY = cy;
    }
    updateElement(el.id, { x: newX, y: newY });
  };

  // ── 거리 가이드 (버그 수정: 캔버스 위에 정상 표시) ──
  const renderDistanceGuides = () => {
    if (!selectedId) return null;
    const selEl = elements.find(e=>e.id===selectedId);
    if (!selEl) return null;
    return elements.flatMap(el => {
      if (el.id === selectedId) return [];
      const guides = [];
      const alignV = selEl.y < el.y+el.height && selEl.y+selEl.height > el.y;
      const alignH = selEl.x < el.x+el.width  && selEl.x+selEl.width  > el.x;
      if (alignV) {
        let gapX=0, lineX=0;
        if (el.x > selEl.x+selEl.width)       { gapX=el.x-(selEl.x+selEl.width); lineX=selEl.x+selEl.width; }
        else if (el.x+el.width < selEl.x)      { gapX=selEl.x-(el.x+el.width);   lineX=el.x+el.width; }
        if (gapX>0 && gapX<400) guides.push(
          <div key={`hx-${el.id}`} className="absolute z-40 flex items-center justify-center pointer-events-none"
            style={{ left: lineX, top: selEl.y+selEl.height/2-0.5, width: gapX, height: 1 }}>
            <div className="w-full h-px bg-emerald-500/80"/>
            <div className="absolute bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{Math.round(gapX)}</div>
          </div>
        );
      }
      if (alignH) {
        let gapY=0, lineY=0;
        if (el.y > selEl.y+selEl.height)       { gapY=el.y-(selEl.y+selEl.height); lineY=selEl.y+selEl.height; }
        else if (el.y+el.height < selEl.y)      { gapY=selEl.y-(el.y+el.height);   lineY=el.y+el.height; }
        if (gapY>0 && gapY<400) guides.push(
          <div key={`vy-${el.id}`} className="absolute z-40 flex flex-col items-center justify-center pointer-events-none"
            style={{ left: selEl.x+selEl.width/2-0.5, top: lineY, height: gapY, width: 1 }}>
            <div className="h-full w-px bg-emerald-500/80"/>
            <div className="absolute bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{Math.round(gapY)}</div>
          </div>
        );
      }
      return guides;
    });
  };

  // ── AI 템플릿 생성 (/api/claude 프록시 — CORS 해결) ──
  const generateAITemplate = async (promptText) => {
    setAiLoading(true);
    try {
      const system = `당신은 포트폴리오 레이아웃 디자이너입니다.
주어진 설명에 맞는 레이아웃 요소 배열을 JSON으로만 반환하세요. 설명 없이 JSON 배열만 출력하세요.
캔버스 크기는 ${canvasSize.width}x${canvasSize.height}입니다.
반환 형식: [{ "type":"text"|"shape", "x":숫자, "y":숫자, "width":숫자, "height":숫자, "content":"텍스트", "shape":"rect"|"circle"|"rect_r", "fill":"#색상", "stroke":"#색상", "fontSize":숫자, "fontWeight":"normal"|"bold", "color":"#색상" }]
요소는 6~12개. 좌표는 캔버스 범위 내로 지정하세요.`;
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system,
          messages: [{ role: 'user', content: promptText }],
        }),
      });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const raw = data.content?.map(b=>b.text||'').join('') || '';
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('JSON 파싱 실패');
      const parsed = JSON.parse(jsonMatch[0]);
      const newEls = parsed.map((el, i) => ({
        id: `el_${Date.now()}_${i}`,
        zIndex: elements.length + i + 1,
        fontFamily: fontOptions[0].value,
        fontSize: 16, fontWeight: 'normal', color: '#374151',
        backgroundColor: 'transparent',
        fill: '#e5e7eb', stroke: '#9ca3af', strokeWidth: 2,
        innerText: '',
        innerTextStyle: { fontFamily: fontOptions[0].value, fontSize: 14, fontWeight: 'normal', color: '#374151' },
        ...el,
      }));
      updateElements([...elements, ...newEls]);
    } catch (err) {
      alert('AI 템플릿 생성 오류: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // ── 현재 페이지를 사용자 지정 템플릿으로 저장 ──
  const saveAsUserTemplate = () => {
    const name = prompt('템플릿 이름을 입력하세요:');
    if (!name) return;
    const tpl = { id: `tpl_${Date.now()}`, name, elements: JSON.parse(JSON.stringify(elements)), canvasSize };
    setUserTemplates(prev => [tpl, ...prev]);
    alert(`"${name}" 템플릿이 저장되었습니다.`);
  };

  const loadUserTemplate = (tpl) => {
    if (!window.confirm(`"${tpl.name}" 템플릿을 불러오시겠습니까? 현재 페이지 요소가 교체됩니다.`)) return;
    updateElements(tpl.elements);
  };

  // ── PDF 내보내기 ──
  const exportPDF = async () => {
    if (!canvasRef.current) return;
    setSelectedIds([]); setShowCenterLines(false); setShowGrid(false);
    setTimeout(async () => {
      const canvas = await html2canvas(canvasRef.current, { scale: 2 });
      const pdf = new jsPDF(canvasSize.width > canvasSize.height ? 'l' : 'p', 'px', [canvasSize.width, canvasSize.height]);
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvasSize.width, canvasSize.height);
      pdf.save(`${file.name}_page${currentPageIndex + 1}.pdf`);
    }, 100);
  };

  const selectedEl = elements.find(el => el.id === selectedId);

  // ── 플로팅 툴바 탭 렌더 ──
  const renderToolbarContent = () => {
    if (!selectedEl) return null;

    // 스타일 탭
    const StyleTab = () => (
      <div className="flex items-center gap-1.5">
        {/* 도형 채우기 색상 */}
        {(selectedEl.type === 'shape') && (
          <>
            <label className="text-xs text-gray-400">채우기</label>
            <div className="relative w-7 h-7 rounded-md overflow-hidden border border-gray-600 cursor-pointer">
              <div className="w-full h-full" style={{ backgroundColor: selectedEl.fill||'#d1d5db' }}/>
              <input type="color" value={selectedEl.fill||'#d1d5db'} onChange={e=>updateElement(selectedId,{fill:e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
            </div>
            <label className="text-xs text-gray-400">선</label>
            <div className="relative w-7 h-7 rounded-md overflow-hidden border border-gray-600 cursor-pointer">
              <div className="w-full h-full" style={{ backgroundColor: selectedEl.stroke||'#6b7280' }}/>
              <input type="color" value={selectedEl.stroke||'#6b7280'} onChange={e=>updateElement(selectedId,{stroke:e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
            </div>
            <input type="number" min={0} max={20} value={selectedEl.strokeWidth||2} onChange={e=>updateElement(selectedId,{strokeWidth:Number(e.target.value)})} className="w-10 text-xs text-center bg-gray-800 rounded-md py-1 outline-none border border-gray-700"/>
          </>
        )}
        {/* 선 스타일 */}
        {selectedEl.type === 'line' && (
          <>
            <label className="text-xs text-gray-400">선색</label>
            <div className="relative w-7 h-7 rounded-md overflow-hidden border border-gray-600">
              <div className="w-full h-full" style={{ backgroundColor: selectedEl.stroke||'#6b7280' }}/>
              <input type="color" value={selectedEl.stroke||'#6b7280'} onChange={e=>updateElement(selectedId,{stroke:e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
            </div>
            <input type="number" min={1} max={20} value={selectedEl.strokeWidth||2} onChange={e=>updateElement(selectedId,{strokeWidth:Number(e.target.value)})} className="w-10 text-xs text-center bg-gray-800 rounded-md py-1 outline-none border border-gray-700"/>
            <select value={selectedEl.lineStyle||'solid'} onChange={e=>updateElement(selectedId,{lineStyle:e.target.value})} className="bg-gray-800 text-xs rounded-md px-2 py-1 outline-none border border-gray-700">
              <option value="solid">실선</option>
              <option value="dashed">점선</option>
              <option value="dotted">점점선</option>
            </select>
            <button onClick={()=>updateElement(selectedId,{arrowStart:!selectedEl.arrowStart})} className={`px-2 py-1 text-xs rounded-md ${selectedEl.arrowStart?'bg-emerald-700 text-white':'bg-gray-800 text-gray-300'} border border-gray-700`}>←화살표</button>
            <button onClick={()=>updateElement(selectedId,{arrowEnd:!selectedEl.arrowEnd})} className={`px-2 py-1 text-xs rounded-md ${selectedEl.arrowEnd?'bg-emerald-700 text-white':'bg-gray-800 text-gray-300'} border border-gray-700`}>화살표→</button>
          </>
        )}
      </div>
    );

    // 텍스트 탭 (텍스트 요소 & 도형 내부 텍스트)
    const TextTab = () => {
      const isShape   = selectedEl.type === 'shape';
      const textVal   = isShape ? selectedEl.innerText||'' : selectedEl.content||'';
      const textStyle = isShape ? selectedEl.innerTextStyle||{} : selectedEl;
      const updateText = (props) => {
        if (isShape) updateElement(selectedId, { innerText: props.content!==undefined ? props.content : textVal, innerTextStyle: { ...textStyle, ...props } });
        else         updateElement(selectedId, props);
      };
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          {isShape && (
            <input
              value={textVal}
              onChange={e=>updateText({content:e.target.value})}
              placeholder="도형 내 텍스트"
              className="bg-gray-800 text-sm rounded-lg px-2 py-1 outline-none border border-gray-700 w-32"
            />
          )}
          <select className="bg-transparent hover:bg-gray-800 text-xs px-2 py-1 rounded-lg outline-none" value={textStyle.fontFamily||fontOptions[0].value} onChange={e=>updateText({fontFamily:e.target.value})}>
            {fontOptions.map(f=><option key={f.name} value={f.value} className="bg-gray-800">{f.name}</option>)}
          </select>
          <input type="number" value={textStyle.fontSize||16} onChange={e=>updateText({fontSize:Number(e.target.value)})} className="w-10 bg-transparent text-xs text-center outline-none hover:bg-gray-800 rounded-lg py-1 border border-gray-700"/>
          <button onClick={()=>updateText({fontWeight:textStyle.fontWeight==='bold'?'normal':'bold'})} className={`p-1.5 rounded-lg ${textStyle.fontWeight==='bold'?'bg-gray-700 text-emerald-400':'hover:bg-gray-800'}`}><Bold size={14}/></button>
          <button onClick={()=>updateText({fontStyle:textStyle.fontStyle==='italic'?'normal':'italic'})} className={`p-1.5 rounded-lg ${textStyle.fontStyle==='italic'?'bg-gray-700 text-emerald-400':'hover:bg-gray-800'}`}><Italic size={14}/></button>
          <button onClick={()=>updateText({textDecoration:textStyle.textDecoration==='underline'?'none':'underline'})} className={`p-1.5 rounded-lg ${textStyle.textDecoration==='underline'?'bg-gray-700 text-emerald-400':'hover:bg-gray-800'}`}><Underline size={14}/></button>
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-600 cursor-pointer">
            <div className="w-full h-full rounded-full" style={{ backgroundColor: textStyle.color||'#374151' }}/>
            <input type="color" value={textStyle.color||'#374151'} onChange={e=>updateText({color:e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
          </div>
          {!isShape && (
            <>
              <div className="relative w-7 h-7 rounded overflow-hidden border border-gray-600 cursor-pointer">
                <div className="w-full h-full" style={{ backgroundColor: selectedEl.backgroundColor==='transparent'?'#fff':selectedEl.backgroundColor||'#fff' }}/>
                <input type="color" value={selectedEl.backgroundColor==='transparent'?'#ffffff':selectedEl.backgroundColor||'#ffffff'} onChange={e=>updateElement(selectedId,{backgroundColor:e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
              </div>
              <button onClick={()=>updateElement(selectedId,{backgroundColor:'transparent'})} className="text-[11px] text-gray-400 hover:text-white px-1">배경X</button>
            </>
          )}
        </div>
      );
    };

    // 배치 탭
    const ArrangeTab = () => (
      <div className="flex items-center gap-1">
        <button onClick={bringForward} className="p-1.5 hover:bg-gray-800 text-gray-300 rounded-lg" title="앞으로"><ArrowUpToLine size={15}/></button>
        <button onClick={sendBackward} className="p-1.5 hover:bg-gray-800 text-gray-300 rounded-lg" title="뒤로"><ArrowDownToLine size={15}/></button>
        <div className="w-px h-4 bg-gray-700 mx-1"/>
        <button onClick={()=>updateElement(selectedId,{x:(canvasSize.width-selectedEl.width)/2})} className="p-1.5 hover:bg-gray-800 text-gray-300 rounded-lg" title="수평 중앙"><MoveHorizontal size={15}/></button>
        <button onClick={()=>updateElement(selectedId,{y:(canvasSize.height-selectedEl.height)/2})} className="p-1.5 hover:bg-gray-800 text-gray-300 rounded-lg" title="수직 중앙"><MoveVertical size={15}/></button>
        {selectedIds.length >= 2 && (
          <button onClick={groupSelected} className="p-1.5 hover:bg-gray-800 text-emerald-400 rounded-lg" title="그룹(Ctrl+G)"><Group size={15}/></button>
        )}
        {selectedEl?.type === 'group' && (
          <button onClick={ungroupSelected} className="p-1.5 hover:bg-gray-800 text-amber-400 rounded-lg" title="그룹해제(Ctrl+Shift+G)"><Ungroup size={15}/></button>
        )}
      </div>
    );

    const tabs = [
      { id: 'style', label: '스타일', show: selectedEl.type === 'shape' || selectedEl.type === 'line' },
      { id: 'text',  label: '텍스트', show: selectedEl.type === 'text'  || selectedEl.type === 'shape' },
      { id: 'arrange', label: '배치', show: true },
    ].filter(t => t.show);

    return (
      <div className="flex flex-col items-center gap-1">
        {/* 탭 헤더 */}
        <div className="flex items-center gap-0.5 bg-gray-800/80 rounded-xl px-1 py-0.5">
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setToolbarTab(t.id)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition ${toolbarTab===t.id ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              {t.label}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-700 mx-1"/>
          <button onClick={()=>{updateElements(elements.filter(el=>!selectedIds.includes(el.id)));setSelectedIds([]);}} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={14}/></button>
        </div>
        {/* 탭 내용 */}
        <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 text-white px-3 py-2 rounded-xl shadow-2xl">
          {toolbarTab === 'style'   && <StyleTab/>}
          {toolbarTab === 'text'    && <TextTab/>}
          {toolbarTab === 'arrange' && <ArrangeTab/>}
        </div>
      </div>
    );
  };

  // ── 요소 렌더 ──
  const renderElement = (el) => {
    if (el.type === 'text') {
      return (
        <div className="w-full h-full relative group">
          <div className="drag-handle absolute -top-5 left-0 w-full h-5 cursor-move opacity-0 group-hover:opacity-100 bg-emerald-500 flex items-center justify-center rounded-t-md">
            <Maximize size={10} className="text-white"/>
          </div>
          <textarea
            value={el.content} onChange={e=>updateElement(el.id,{content:e.target.value})}
            style={{ fontFamily:el.fontFamily, fontSize:`${el.fontSize}px`, fontWeight:el.fontWeight, fontStyle:el.fontStyle, textDecoration:el.textDecoration, color:el.color, backgroundColor:el.backgroundColor }}
            className="w-full h-full resize-none outline-none p-1 bg-transparent"
          />
        </div>
      );
    }
    if (el.type === 'shape') {
      return (
        <div className="w-full h-full relative drag-handle cursor-move">
          <ShapeSVG
            shape={el.shape} width={el.width} height={el.height}
            fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth}
            innerText={el.innerText} textStyle={el.innerTextStyle}
          />
        </div>
      );
    }
    if (el.type === 'line') {
      return (
        <div className="w-full h-full relative drag-handle cursor-move">
          <LineSVG
            width={el.width} height={el.height}
            stroke={el.stroke} strokeWidth={el.strokeWidth}
            lineStyle={el.lineStyle} arrowStart={el.arrowStart} arrowEnd={el.arrowEnd}
          />
        </div>
      );
    }
    if (el.type === 'image') {
      return (
        <div className="w-full h-full relative drag-handle cursor-move">
          <img src={el.src} alt="" className="w-full h-full object-cover pointer-events-none"/>
        </div>
      );
    }
    if (el.type === 'group') {
      return (
        <div className="w-full h-full relative drag-handle cursor-move border-2 border-dashed border-blue-400/40 rounded">
          {el.children?.map(child => (
            <div key={child.id} className="absolute" style={{ left:child.x, top:child.y, width:child.width, height:child.height }}>
              {renderElement(child)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`flex h-screen w-full transition-colors ${currentTheme.bg} ${currentTheme.text}`} onClick={()=>setSelectedIds([])}>

      {/* ══ 좌측 사이드바 ══ */}
      <aside className={`w-72 flex flex-col ${currentTheme.panel} border-r ${currentTheme.border} z-20 shadow-xl`} onClick={e=>e.stopPropagation()}>
        <div className="flex flex-col h-full">
          {/* 뒤로가기 */}
          <div className="p-4 border-b border-white/5">
            <button onClick={goBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-500 font-medium transition-colors">
              <ChevronLeft size={18}/> 대시보드
            </button>
          </div>

          {/* 사이드바 탭 */}
          <div className={`flex border-b ${currentTheme.border}`}>
            {[{id:'tools',label:'도구'},{id:'assets',label:'에셋'},{id:'templates',label:'템플릿'}].map(t=>(
              <button key={t.id} onClick={()=>setSidebarTab(t.id)}
                className={`flex-1 py-2.5 text-xs font-bold transition ${sidebarTab===t.id ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-300'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

            {/* ── 도구 탭 ── */}
            {sidebarTab === 'tools' && (
              <>
                {/* 텍스트 */}
                <button onClick={addTextElement} className={`py-2.5 rounded-xl border ${currentTheme.border} hover:border-emerald-500/50 flex justify-center items-center gap-2 font-medium text-sm`}>
                  <Type size={16}/> 텍스트 박스
                </button>

                {/* 도형 도구 */}
                <div className={`rounded-xl border ${currentTheme.border} overflow-hidden`}>
                  <button
                    onClick={()=>setShapesPanelOpen(!shapesPanelOpen)}
                    className="w-full py-2.5 px-4 flex items-center justify-between font-medium text-sm hover:bg-white/5">
                    <span className="flex items-center gap-2"><Square size={16}/> 도형</span>
                    <ChevronDown size={14} className={`transition-transform ${shapesPanelOpen?'rotate-180':''}`}/>
                  </button>
                  {shapesPanelOpen && (
                    <div className="grid grid-cols-4 gap-1 p-2 border-t border-white/5">
                      {shapeTypes.map(s => (
                        <button key={s.id}
                          onClick={()=>{ addShapeElement(s.id); }}
                          className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[11px] text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition"
                          title={s.label}>
                          <span className="text-lg leading-none">{s.icon}</span>
                          <span className="truncate w-full text-center">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 선 도구 */}
                <div className={`rounded-xl border ${currentTheme.border} overflow-hidden`}>
                  <button
                    onClick={()=>setLinePanelOpen(!linePanelOpen)}
                    className="w-full py-2.5 px-4 flex items-center justify-between font-medium text-sm hover:bg-white/5">
                    <span className="flex items-center gap-2"><Minus size={16}/> 선 / 화살표</span>
                    <ChevronDown size={14} className={`transition-transform ${linePanelOpen?'rotate-180':''}`}/>
                  </button>
                  {linePanelOpen && (
                    <div className="p-3 border-t border-white/5 flex flex-col gap-2">
                      <div className="grid grid-cols-3 gap-1">
                        {['solid','dashed','dotted'].map(s=>(
                          <button key={s} onClick={()=>setLineConfig(c=>({...c,style:s}))}
                            className={`py-1.5 text-xs rounded-lg border transition ${lineConfig.style===s?'border-emerald-500 text-emerald-400':'border-white/10 text-gray-400 hover:border-white/30'}`}>
                            {s==='solid'?'실선':s==='dashed'?'점선':'점점선'}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-400 w-8">두께</label>
                        <input type="range" min={1} max={10} value={lineConfig.strokeWidth} onChange={e=>setLineConfig(c=>({...c,strokeWidth:Number(e.target.value)}))} className="flex-1"/>
                        <span className="text-xs text-gray-400 w-4">{lineConfig.strokeWidth}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>setLineConfig(c=>({...c,arrowStart:!c.arrowStart}))}
                          className={`flex-1 py-1.5 text-xs rounded-lg border transition ${lineConfig.arrowStart?'border-emerald-500 text-emerald-400 bg-emerald-500/10':'border-white/10 text-gray-400'}`}>
                          ←시작 화살표
                        </button>
                        <button onClick={()=>setLineConfig(c=>({...c,arrowEnd:!c.arrowEnd}))}
                          className={`flex-1 py-1.5 text-xs rounded-lg border transition ${lineConfig.arrowEnd?'border-emerald-500 text-emerald-400 bg-emerald-500/10':'border-white/10 text-gray-400'}`}>
                          끝 화살표→
                        </button>
                      </div>
                      <button onClick={addLineElement} className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition">
                        선 추가
                      </button>
                    </div>
                  )}
                </div>

                {/* 이미지 업로드 */}
                <button onClick={()=>fileInputRef.current.click()} className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex justify-center items-center gap-2 font-medium text-sm">
                  <Upload size={16}/> PC 사진 등록
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden"/>
              </>
            )}

            {/* ── 에셋 탭 ── */}
            {sidebarTab === 'assets' && (
              <>
                <p className="text-xs text-gray-500">업로드한 이미지를 클릭하면 캔버스에 추가됩니다.</p>
                {globalAssets.length === 0 && <p className="text-xs text-gray-600 py-4 text-center">에셋이 없습니다</p>}
                <div className="grid grid-cols-2 gap-2">
                  {globalAssets.map(asset=>(
                    <div key={asset.id} onClick={()=>addElement({type:'image',src:asset.src,width:200,height:200})}
                      className="group relative cursor-pointer rounded-xl overflow-hidden border border-transparent hover:border-emerald-500/30 aspect-square bg-black/10">
                      <img src={asset.src} alt={asset.name} className="w-full h-full object-cover"/>
                      <div className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                        <span className="text-xs font-bold text-white">불러오기</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── 템플릿 탭 ── */}
            {sidebarTab === 'templates' && (
              <>
                {/* AI 템플릿 생성 */}
                <div className={`p-3 rounded-xl border ${currentTheme.border} flex flex-col gap-2`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Sparkles size={14}/> AI 템플릿 생성
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {aiTemplateOptions.map(opt=>(
                      <button key={opt.id} onClick={()=>generateAITemplate(opt.prompt)}
                        disabled={aiLoading}
                        className="py-1.5 text-xs rounded-lg border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-gray-300 transition disabled:opacity-40">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="직접 입력..." className={`flex-1 text-xs px-2 py-1.5 rounded-lg bg-black/20 border ${currentTheme.border} outline-none`}/>
                    <button onClick={()=>aiPrompt&&generateAITemplate(aiPrompt)} disabled={aiLoading||!aiPrompt}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition disabled:opacity-40">
                      {aiLoading ? '...' : '생성'}
                    </button>
                  </div>
                </div>

                {/* 사용자 지정 템플릿 저장 */}
                <button onClick={saveAsUserTemplate} className={`py-2.5 rounded-xl border ${currentTheme.border} hover:border-emerald-500/50 flex justify-center items-center gap-2 text-sm font-medium`}>
                  <Save size={16}/> 현재 페이지를 템플릿으로 저장
                </button>

                {/* 저장된 템플릿 목록 */}
                {userTemplates.length > 0 && (
                  <>
                    <p className="text-xs text-gray-500 mt-1">저장된 템플릿</p>
                    <div className="flex flex-col gap-1.5">
                      {userTemplates.map(tpl=>(
                        <div key={tpl.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${currentTheme.border} hover:border-emerald-500/30 transition`}>
                          <div>
                            <p className="text-sm font-medium">{tpl.name}</p>
                            <p className="text-[10px] text-gray-500">{tpl.elements.length}개 요소</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={()=>loadUserTemplate(tpl)} className="p-1.5 hover:bg-emerald-500/10 text-emerald-400 rounded-lg text-xs">불러오기</button>
                            <button onClick={()=>setUserTemplates(prev=>prev.filter(t=>t.id!==tpl.id))} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg"><X size={12}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {userTemplates.length === 0 && <p className="text-xs text-gray-600 py-2 text-center">저장된 템플릿이 없습니다</p>}
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ══ 메인 영역 ══ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* ── 상단 헤더 ── */}
        <header className={`h-14 flex items-center justify-between px-4 ${currentTheme.panel} border-b ${currentTheme.border} z-20 shrink-0`} onClick={e=>e.stopPropagation()}>
          <div className="font-semibold text-sm truncate max-w-[200px]">{file.name}</div>

          <div className="flex items-center gap-1.5 bg-black/5 p-1 rounded-lg border border-gray-500/10">
            <div className="flex items-center px-2 border-r border-gray-500/20">
              <Monitor size={13} className="text-gray-400 mr-1.5"/>
              <select className="bg-transparent text-xs font-medium outline-none cursor-pointer text-emerald-500"
                value={canvasSizeKey}
                onChange={e=>{ setCanvasSizeKey(e.target.value); setCanvasSize(canvasPresets[e.target.value]); setViewModeChangeTrigger(p=>p+1); }}>
                {Object.entries(canvasPresets).map(([k,v])=><option key={k} value={k} className="bg-gray-800">{v.label}</option>)}
              </select>
            </div>
            {canvasSizeKey === 'CUSTOM' && (
              <div className="flex items-center gap-1 text-xs text-gray-500 px-2 border-r border-gray-500/20">
                W:<input type="number" value={canvasSize.width}  onChange={e=>{setCanvasSize(c=>({...c,width:Number(e.target.value)}));setViewModeChangeTrigger(p=>p+1);}} className="w-14 bg-transparent text-center border-b border-gray-500 outline-none"/>
                H:<input type="number" value={canvasSize.height} onChange={e=>{setCanvasSize(c=>({...c,height:Number(e.target.value)}));setViewModeChangeTrigger(p=>p+1);}} className="w-14 bg-transparent text-center border-b border-gray-500 outline-none"/>
              </div>
            )}
            <button onClick={()=>setShowGrid(v=>!v)} className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${showGrid?'bg-white/10 text-emerald-400':'text-gray-500'}`}><Grid size={13}/> 눈금</button>
            <button onClick={()=>setShowCenterLines(v=>!v)} className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${showCenterLines?'bg-white/10 text-emerald-400':'text-gray-500'}`}><Maximize size={13}/> 스냅</button>
          </div>

          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all">
            <Download size={14}/> PDF 내보내기
          </button>
        </header>

        {/* ── 뷰포트 ── */}
        <div ref={viewportRef} className="flex-1 overflow-auto bg-gray-900/5 flex justify-center items-center p-10 relative" onClick={()=>setSelectedIds([])}>

          {/* 플로팅 툴바 — fixed로 헤더 아래 고정, 사이드바(w-72=288px) + 헤더(h-14=56px) 반영 */}
          {selectedEl && (
            <div
              className="fixed z-50 flex flex-col items-center"
              style={{ top: '60px', left: 'calc(288px + (100vw - 288px) / 2)', transform: 'translateX(-50%)' }}
              onClick={e=>e.stopPropagation()}>
              {renderToolbarContent()}
            </div>
          )}

          {/* 줌 래퍼 */}
          <div style={{ transform:`scale(${zoom})`, transformOrigin:'center center', transition:'transform 0.2s ease-in-out', position:'relative' }}>

            {/* 거리 가이드 — overflow-hidden 밖, 줌 래퍼 안에서 절대좌표로 렌더 */}
            {renderDistanceGuides()}

            <div
              id="portfolio-canvas" ref={canvasRef}
              style={{ width:`${canvasSize.width}px`, height:`${canvasSize.height}px` }}
              className={`bg-white relative shadow-2xl overflow-hidden ${showGrid ? 'bg-grid-pattern' : ''}`}
              onClick={e=>e.stopPropagation()}>

              {/* 중앙 가이드라인 */}
              {showCenterLines && (
                <>
                  <div className="absolute top-0 left-1/2 w-0 h-full center-guideline-v z-30 pointer-events-none"/>
                  <div className="absolute left-0 top-1/2 w-full h-0 center-guideline-h z-30 pointer-events-none"/>
                </>
              )}

              {/* 요소 렌더 */}
              {elements.map(el => (
                <Rnd key={el.id}
                  size={{ width: el.width, height: el.type==='line' ? Math.max(el.height||4, (el.strokeWidth||2)+20) : el.height }}
                  position={{ x: el.x, y: el.y }}
                  onDrag={(e,d)=>handleDrag(e,d,el)}
                  onDragStop={(e,d)=>updateElement(el.id,{x:d.x,y:d.y})}
                  onResizeStop={(e,dir,ref,delta,pos)=>updateElement(el.id,{width:parseInt(ref.style.width),height:parseInt(ref.style.height),...pos})}
                  lockAspectRatio={el.type==='image'}
                  bounds="parent"
                  dragHandleClassName="drag-handle"
                  onClick={e=>{ e.stopPropagation(); setSelectedIds([el.id]); setToolbarTab(el.type==='shape'?'style':el.type==='line'?'style':'text'); }}
                  style={{ zIndex: el.zIndex||1 }}
                  className={`absolute group ${selectedIds.includes(el.id) ? 'ring-2 ring-emerald-500' : 'hover:ring-1 ring-blue-400/50'}`}
                >
                  {/* 크기 뱃지 */}
                  {selectedIds.includes(el.id) && (
                    <div className="absolute -top-6 left-0 bg-gray-900/90 text-white text-[10px] px-1.5 py-0.5 rounded-md pointer-events-none opacity-80">
                      {Math.round(el.width)} × {Math.round(el.height)}
                    </div>
                  )}
                  {renderElement(el)}
                </Rnd>
              ))}
            </div>
          </div>
        </div>

        {/* ── 페이지 탭 바 ── */}
        <div className={`h-11 flex items-center px-4 ${currentTheme.panel} border-t ${currentTheme.border} z-20 gap-1.5 overflow-x-auto shrink-0`}>
          <Layers size={13} className="text-gray-500 mr-1.5 shrink-0"/>
          {pages.map((p,idx)=>(
            <button key={p.id} onClick={()=>{ setSelectedIds([]); setCurrentPageIndex(idx); }}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${currentPageIndex===idx ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-500/10'}`}>
              Page {idx+1}
            </button>
          ))}
          <button onClick={()=>{ const p={id:`p_${Date.now()}`,elements:[]}; setPages([...pages,p]); setCurrentPageIndex(pages.length); }}
            className="px-2.5 py-1 rounded-md text-xs flex items-center gap-1 text-emerald-500 hover:bg-emerald-500/10 font-bold transition shrink-0">
            <Plus size={13}/> 추가
          </button>
        </div>
      </main>
    </div>
  );
}
