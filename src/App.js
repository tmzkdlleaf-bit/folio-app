import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Sun, Moon, Leaf, Download, Grid, Type, Image as ImageIcon,
  Trash2, MoveHorizontal, MoveVertical, Maximize,
  Upload, Folder, FileText, ChevronLeft, LayoutGrid,
  Bold, Italic, Underline, Monitor,
  Plus, Layers, ArrowUpToLine, ArrowDownToLine, FilePlus,
  Square, Minus, Group, Ungroup, Sparkles, Save, X, ChevronDown
} from 'lucide-react';

// ─── 상수 ───
const fontOptions = [
  { name: '기본 고딕 (Noto)',    value: '"Noto Sans KR", sans-serif' },
  { name: '나눔 명조 (Myeongjo)', value: '"Nanum Myeongjo", serif' },
  { name: '고운 돋움 (Dodum)',   value: '"Gowun Dodum", sans-serif' },
];
const canvasPresets = {
  A4:     { width: 794,  height: 1123, label: 'A4 세로' },
  A4_L:   { width: 1123, height: 794,  label: 'A4 가로' },
  B4:     { width: 945,  height: 1338, label: 'B4 세로' },
  FHD:    { width: 1920, height: 1080, label: '웹/FHD' },
  CUSTOM: { width: 800,  height: 600,  label: '사용자 지정' },
};
const shapeTypes = [
  { id: 'rect',     label: '사각형',     icon: '▭' },
  { id: 'rect_r',   label: '둥근사각형',  icon: '▢' },
  { id: 'circle',   label: '원',         icon: '○' },
  { id: 'triangle', label: '삼각형',     icon: '△' },
  { id: 'diamond',  label: '마름모',     icon: '◇' },
  { id: 'pentagon', label: '오각형',     icon: '⬠' },
  { id: 'hexagon',  label: '육각형',     icon: '⬡' },
  { id: 'star',     label: '별',         icon: '★' },
  { id: 'arrow_r',  label: '화살표',     icon: '→' },
  { id: 'speech',   label: '말풍선',     icon: '💬' },
  { id: 'cylinder', label: '실린더',     icon: '⬛' },
  { id: 'cross',    label: '십자',       icon: '+' },
];
const aiTemplateOptions = [
  { id: 'resume',      label: '이력서',         prompt: '이력서 기본 레이아웃을 만들어주세요' },
  { id: 'portfolio',   label: '포트폴리오 표지',  prompt: '포트폴리오 표지 디자인을 만들어주세요' },
  { id: 'infographic', label: '인포그래픽',      prompt: '인포그래픽 레이아웃을 만들어주세요' },
  { id: 'business',    label: '명함',           prompt: '명함 레이아웃을 만들어주세요' },
];
const initialFolders = [
  { id:'f1', name:'철도 공기업 지원', files:[{ id:'file1', name:'코레일 직무수행계획서', pages:[{id:'p1',elements:[]}], lastModified:'2026-05-24' }] },
  { id:'f2', name:'창작 및 캐릭터 설정', files:[{ id:'file2', name:'슈니(Schnee) 여유/투덜 표정 시트', pages:[{id:'p1',elements:[]}], lastModified:'2026-05-20' }] },
];

// ─── 도형 SVG ───
function ShapeSVG({ shape, width:w=100, height:h=100, fill, stroke, strokeWidth:sw=2, innerText, textStyle }) {
  const c = { fill: fill||'#d1d5db', stroke: stroke||'#6b7280', strokeWidth: sw };
  const txt = innerText ? (
    <text x={w/2} y={h/2} textAnchor="middle" dominantBaseline="central"
      fill={textStyle?.color||'#374151'} fontSize={textStyle?.fontSize||16}
      fontFamily={textStyle?.fontFamily||'sans-serif'} fontWeight={textStyle?.fontWeight||'normal'}
      style={{userSelect:'none'}}>{innerText}</text>
  ) : null;
  const S = (body) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block',overflow:'visible'}}>{body}{txt}</svg>;
  switch(shape){
    case 'rect':    return S(<rect x={sw/2} y={sw/2} width={w-sw} height={h-sw} {...c}/>);
    case 'rect_r':  return S(<rect x={sw/2} y={sw/2} width={w-sw} height={h-sw} rx={12} ry={12} {...c}/>);
    case 'circle':  return S(<ellipse cx={w/2} cy={h/2} rx={w/2-sw/2} ry={h/2-sw/2} {...c}/>);
    case 'triangle':return S(<polygon points={`${w/2},${sw} ${w-sw},${h-sw} ${sw},${h-sw}`} {...c}/>);
    case 'diamond': return S(<polygon points={`${w/2},${sw} ${w-sw},${h/2} ${w/2},${h-sw} ${sw},${h/2}`} {...c}/>);
    case 'pentagon':{const pts=Array.from({length:5},(_,i)=>{const a=(i*72-90)*Math.PI/180;return `${w/2+(w/2-sw)*Math.cos(a)},${h/2+(h/2-sw)*Math.sin(a)}`;}).join(' ');return S(<polygon points={pts} {...c}/>);}
    case 'hexagon': {const pts=Array.from({length:6},(_,i)=>{const a=(i*60-30)*Math.PI/180;return `${w/2+(w/2-sw)*Math.cos(a)},${h/2+(h/2-sw)*Math.sin(a)}`;}).join(' ');return S(<polygon points={pts} {...c}/>);}
    case 'star':    {const cx=w/2,cy=h/2,oR=Math.min(w,h)/2-sw,iR=oR*0.4;const pts=Array.from({length:10},(_,i)=>{const a=(i*36-90)*Math.PI/180,r=i%2===0?oR:iR;return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;}).join(' ');return S(<polygon points={pts} {...c}/>);}
    case 'arrow_r': {const sh=h*0.35,mid=h/2,aw=w*0.35;const pts=`${sw},${mid-sh/2} ${w-aw},${mid-sh/2} ${w-aw},${sw} ${w-sw},${mid} ${w-aw},${h-sw} ${w-aw},${mid+sh/2} ${sw},${mid+sh/2}`;return S(<polygon points={pts} {...c}/>);}
    case 'speech':  {const tH=h*0.18,bH=h-tH-sw;return(<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block',overflow:'visible'}}><rect x={sw/2} y={sw/2} width={w-sw} height={bH} rx={10} {...c}/><polygon points={`${w*0.2},${bH} ${w*0.1},${h-sw} ${w*0.38},${bH}`} {...c}/>{txt&&React.cloneElement(txt,{y:bH/2})}</svg>);}
    case 'cylinder':{const ry2=h*0.12;return(<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block',overflow:'visible'}}><rect x={sw/2} y={ry2} width={w-sw} height={h-ry2*2-sw/2} {...c}/><ellipse cx={w/2} cy={ry2} rx={w/2-sw/2} ry={ry2} {...c}/><ellipse cx={w/2} cy={h-ry2-sw/2} rx={w/2-sw/2} ry={ry2} {...c}/>{txt&&React.cloneElement(txt,{y:h/2+ry2/2})}</svg>);}
    case 'cross':   {const t=Math.min(w,h)*0.28,cx=w/2,cy=h/2;const pts=`${cx-t/2},${sw} ${cx+t/2},${sw} ${cx+t/2},${cy-t/2} ${w-sw},${cy-t/2} ${w-sw},${cy+t/2} ${cx+t/2},${cy+t/2} ${cx+t/2},${h-sw} ${cx-t/2},${h-sw} ${cx-t/2},${cy+t/2} ${sw},${cy+t/2} ${sw},${cy-t/2} ${cx-t/2},${cy-t/2}`;return S(<polygon points={pts} {...c}/>);}
    default: return null;
  }
}

// ─── 선 SVG ───
function LineSVG({ width:w=200, height:h=4, stroke, strokeWidth:sw=2, lineStyle='solid', arrowStart=false, arrowEnd=false }) {
  const H=Math.max(h,sw+20), dash=lineStyle==='dashed'?'10,6':lineStyle==='dotted'?'3,5':undefined;
  const mid=`arr_${Math.abs(Math.sin(w*h)*1e6|0)}`;
  return(
    <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} style={{display:'block',overflow:'visible'}}>
      <defs><marker id={mid} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill={stroke||'#6b7280'}/></marker></defs>
      <line x1={sw} y1={H/2} x2={w-sw} y2={H/2} stroke={stroke||'#6b7280'} strokeWidth={sw} strokeDasharray={dash}
        markerStart={arrowStart?`url(#${mid})`:undefined} markerEnd={arrowEnd?`url(#${mid})`:undefined}/>
    </svg>
  );
}

// ─── APP ───
export default function App() {
  const [theme,setTheme]=useState('dark');
  const [view,setView]=useState('dashboard');
  const [folders,setFolders]=useState(initialFolders);
  const [currentFileId,setCurrentFileId]=useState(null);
  const [currentFolderId,setCurrentFolderId]=useState(null);
  const themeStyles = {
    dark:  { bg:'bg-[#0f1115]',  text:'text-gray-100',  panel:'bg-[#181b21]', border:'border-white/5' },
    green: { bg:'bg-[#121c17]',  text:'text-[#e0e8e4]', panel:'bg-[#1a2922]', border:'border-[#2a3d33]' },
    light: { bg:'bg-gray-50',    text:'text-gray-900',  panel:'bg-white',     border:'border-gray-200' },
  };
  const currentTheme = themeStyles[theme];
  const createNewFile = (folderId) => {
    const fileName = prompt('새 포트폴리오 파일 이름을 입력하세요:');
    if (!fileName) return;
    const newFile = { id:`file_${Date.now()}`, name:fileName, pages:[{id:'p1',elements:[]}], lastModified:new Date().toISOString().split('T')[0] };
    setFolders(folders.map(f => f.id===folderId ? {...f, files:[...f.files,newFile]} : f));
  };
  if (view === 'dashboard') return (
    <div className={`min-h-screen p-10 transition-colors duration-300 ${currentTheme.bg} ${currentTheme.text}`}>
      <header className="flex justify-between items-center mb-12 max-w-6xl mx-auto">
        <h1 className="text-2xl font-extrabold flex items-center gap-3"><div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-xl"><Folder size={24}/></div> Portfolio Studio</h1>
        <div className={`flex items-center p-1 rounded-full ${currentTheme.panel} border ${currentTheme.border} shadow-sm`}>
          <button onClick={()=>setTheme('light')} className={`p-2 rounded-full transition-all ${theme==='light'?'bg-white shadow-md text-amber-500':'text-gray-400 hover:text-gray-600'}`}><Sun size={16}/></button>
          <button onClick={()=>setTheme('dark')}  className={`p-2 rounded-full transition-all ${theme==='dark' ?'bg-gray-700 shadow-md text-indigo-400':'text-gray-400 hover:text-gray-300'}`}><Moon size={16}/></button>
          <button onClick={()=>setTheme('green')} className={`p-2 rounded-full transition-all ${theme==='green'?'bg-[#2a3d33] shadow-md text-emerald-400':'text-gray-400 hover:text-gray-300'}`}><Leaf size={16}/></button>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {folders.map(folder=>(
          <div key={folder.id} className={`${currentTheme.panel} p-6 rounded-2xl border ${currentTheme.border} shadow-sm`}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><Folder size={18} className="text-emerald-500"/> {folder.name}</h2>
              <button onClick={()=>createNewFile(folder.id)} className="p-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-md transition" title="새 파일 생성"><FilePlus size={16}/></button>
            </div>
            <div className="flex flex-col gap-3">
              {folder.files.map(file=>(
                <div key={file.id} onClick={()=>{setCurrentFileId(file.id);setCurrentFolderId(folder.id);setView('editor');}} className="p-4 rounded-xl cursor-pointer flex items-center justify-between border border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
                  <div className="flex items-center gap-3 font-medium"><FileText size={16} className="text-gray-400"/> {file.name}</div>
                  <span className="text-xs text-gray-500">{file.lastModified}</span>
                </div>
              ))}
              {folder.files.length===0&&<p className="text-xs text-gray-500 p-2">파일이 없습니다.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  const currentFolder = folders.find(f=>f.id===currentFolderId);
  const currentFile   = currentFolder.files.find(f=>f.id===currentFileId);
  const updateFileData = (updatedFile) => setFolders(folders.map(f=>f.id===currentFolderId?{...f,files:f.files.map(fi=>fi.id===currentFileId?updatedFile:fi)}:f));
  return <Editor file={currentFile} updateFile={updateFileData} goBack={()=>setView('dashboard')} theme={theme} currentTheme={currentTheme}/>;
}

// ─── EDITOR ───
function Editor({ file, updateFile, goBack, theme, currentTheme }) {
  const [pages,setPages]=useState(file.pages);
  const [currentPageIndex,setCurrentPageIndex]=useState(0);
  const elements=pages[currentPageIndex].elements;
  const [selectedIds,setSelectedIds]=useState([]);
  const selectedId=selectedIds[0]||null;
  const selectedEl=elements.find(el=>el.id===selectedId)||null;
  const [toolbarTab,setToolbarTab]=useState('style');
  const [canvasSizeKey,setCanvasSizeKey]=useState('A4');
  const [canvasSize,setCanvasSize]=useState(canvasPresets.A4);
  const [showGrid,setShowGrid]=useState(true);
  const [showCenterLines,setShowCenterLines]=useState(false);
  const [globalAssets,setGlobalAssets]=useState([]);
  const [zoom,setZoom]=useState(1);
  const [viewModeChangeTrigger,setViewModeChangeTrigger]=useState(0);
  // 사이드바 탭: tools | assets | templates
  const [sidebarTab,setSidebarTab]=useState('tools');
  const [shapesPanelOpen,setShapesPanelOpen]=useState(false);
  const [linePanelOpen,setLinePanelOpen]=useState(false);
  const [lineConfig,setLineConfig]=useState({style:'solid',arrowStart:false,arrowEnd:true,stroke:'#6b7280',strokeWidth:2});
  const [userTemplates,setUserTemplates]=useState([]);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiPrompt,setAiPrompt]=useState('');
  // 워터마크
  const [watermark,setWatermark]=useState('');
  const [showWatermark,setShowWatermark]=useState(false);

  const canvasRef=useRef(null);
  const viewportRef=useRef(null);
  const fileInputRef=useRef(null);

  useEffect(()=>{
    const s=localStorage.getItem('portfolio_assets'); if(s)setGlobalAssets(JSON.parse(s));
    const t=localStorage.getItem('portfolio_user_templates'); if(t)setUserTemplates(JSON.parse(t));
    const w=localStorage.getItem('portfolio_watermark'); if(w)setWatermark(w);
  },[]);
  useEffect(()=>{localStorage.setItem('portfolio_assets',JSON.stringify(globalAssets));},[globalAssets]);
  useEffect(()=>{localStorage.setItem('portfolio_user_templates',JSON.stringify(userTemplates));},[userTemplates]);
  useEffect(()=>{localStorage.setItem('portfolio_watermark',watermark);},[watermark]);
  useEffect(()=>{updateFile({...file,pages});},[pages]);
  useEffect(()=>{
    if(viewportRef.current){
      const vW=viewportRef.current.clientWidth-100, vH=viewportRef.current.clientHeight-100;
      const s=Math.min(vW/canvasSize.width,vH/canvasSize.height);
      setZoom(s>1?1:s);
    }
  },[canvasSize,viewModeChangeTrigger]);
  useEffect(()=>{
    const h=(e)=>{
      if((e.key==='Delete'||e.key==='Backspace')&&selectedIds.length>0&&e.target.tagName!=='TEXTAREA'&&e.target.tagName!=='INPUT'){
        updateElements(elements.filter(el=>!selectedIds.includes(el.id)));setSelectedIds([]);
      }
      if(e.ctrlKey&&!e.shiftKey&&e.key==='g'){e.preventDefault();groupSelected();}
      if(e.ctrlKey&&e.shiftKey&&e.key==='G'){e.preventDefault();ungroupSelected();}
    };
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[selectedIds,elements]);

  const updateElements=(newEls)=>setPages(prev=>prev.map((p,i)=>i===currentPageIndex?{...p,elements:newEls}:p));
  const updateElement=(id,props)=>updateElements(elements.map(el=>el.id===id?{...el,...props}:el));

  const addElement=(partial)=>{
    const el={id:`el_${Date.now()}`,x:canvasSize.width/2-100,y:canvasSize.height/2-60,width:200,height:120,zIndex:elements.length+1,...partial};
    updateElements([...elements,el]);setSelectedIds([el.id]);return el;
  };

  // 원본 방식: addToCanvas (에셋 클릭으로 캔버스에 추가)
  const addToCanvas=(asset)=>{
    const el={...asset,id:`el_${Date.now()}`,x:canvasSize.width/2-100,y:canvasSize.height/2-100,width:200,height:200,zIndex:elements.length+1,content:asset.type==='text'?'텍스트 입력':'',fontFamily:fontOptions[0].value,fontSize:24,locked:false};
    updateElements([...elements,el]);setSelectedIds([el.id]);
  };

  const addTextElement=()=>{
    const el={id:`el_${Date.now()}`,type:'text',content:'텍스트를 입력하세요',x:50,y:50,width:300,height:80,zIndex:elements.length+1,fontFamily:fontOptions[0].value,fontSize:24,fontWeight:'normal',color:'#374151',backgroundColor:'transparent'};
    updateElements([...elements,el]);setSelectedIds([el.id]);
  };
  const addShapeElement=(shapeId)=>addElement({type:'shape',shape:shapeId,fill:'#d1d5db',stroke:'#6b7280',strokeWidth:2,innerText:'',innerTextStyle:{fontFamily:fontOptions[0].value,fontSize:16,fontWeight:'normal',color:'#374151'}});
  const addLineElement=()=>addElement({type:'line',width:200,height:4,...lineConfig});

  const handleImageUpload=(e)=>{
    const f=e.target.files[0];if(!f)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const imageUrl=ev.target.result;
      const newAsset={id:`asset_${Date.now()}`,src:imageUrl,name:f.name,type:'image'};
      setGlobalAssets(prev=>[newAsset,...prev]);
      addToCanvas(newAsset);
    };
    reader.readAsDataURL(f);
  };

  const bringForward=()=>{if(!selectedEl)return;updateElement(selectedId,{zIndex:(selectedEl.zIndex||1)+1});};
  const sendBackward=()=>{if(!selectedEl)return;updateElement(selectedId,{zIndex:Math.max(1,(selectedEl.zIndex||1)-1)});};

  const groupSelected=()=>{
    if(selectedIds.length<2)return;
    const toGroup=elements.filter(el=>selectedIds.includes(el.id));
    const minX=Math.min(...toGroup.map(e=>e.x)),minY=Math.min(...toGroup.map(e=>e.y));
    const maxX=Math.max(...toGroup.map(e=>e.x+e.width)),maxY=Math.max(...toGroup.map(e=>e.y+e.height));
    const g={id:`el_${Date.now()}`,type:'group',x:minX,y:minY,width:maxX-minX,height:maxY-minY,zIndex:Math.max(...toGroup.map(e=>e.zIndex||1)),children:toGroup.map(e=>({...e,x:e.x-minX,y:e.y-minY}))};
    updateElements([...elements.filter(el=>!selectedIds.includes(el.id)),g]);setSelectedIds([g.id]);
  };
  const ungroupSelected=()=>{
    if(!selectedEl||selectedEl.type!=='group')return;
    const ungrouped=selectedEl.children.map((c,i)=>({...c,id:`el_${Date.now()}_${i}`,x:c.x+selectedEl.x,y:c.y+selectedEl.y}));
    updateElements([...elements.filter(e=>e.id!==selectedId),...ungrouped]);setSelectedIds(ungrouped.map(e=>e.id));
  };

  const handleDrag=(e,d,el)=>{
    let nx=d.x,ny=d.y;
    if(showCenterLines){const cx=(canvasSize.width-el.width)/2,cy=(canvasSize.height-el.height)/2;if(Math.abs(nx-cx)<15)nx=cx;if(Math.abs(ny-cy)<15)ny=cy;}
    updateElement(el.id,{x:nx,y:ny});
  };

  // 거리 가이드 (피그마 스타일 4방향)
  const renderDistanceGuides=()=>{
    if(!selectedEl)return null;
    const S=selectedEl,SL=S.x,SR=S.x+S.width,ST=S.y,SB=S.y+S.height,SCX=S.x+S.width/2,SCY=S.y+S.height/2;
    const guides=[];
    elements.forEach(el=>{
      if(el.id===selectedId)return;
      const EL=el.x,ER=el.x+el.width,ET=el.y,EB=el.y+el.height;
      const overlapY=ST<EB&&SB>ET, overlapX=SL<ER&&SR>EL;
      if(overlapY){
        if(EL>SR){const gap=EL-SR;guides.push(<div key={`R-${el.id}`} className="absolute pointer-events-none z-40" style={{left:SR,top:SCY-0.5,width:gap,height:1}}><div className="w-full h-px bg-red-400"/><div className="absolute bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded" style={{left:'50%',top:-10,transform:'translateX(-50%)'}}>{Math.round(gap)}</div></div>);}
        if(ER<SL){const gap=SL-ER;guides.push(<div key={`L-${el.id}`} className="absolute pointer-events-none z-40" style={{left:ER,top:SCY-0.5,width:gap,height:1}}><div className="w-full h-px bg-red-400"/><div className="absolute bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded" style={{left:'50%',top:-10,transform:'translateX(-50%)'}}>{Math.round(gap)}</div></div>);}
      }
      if(overlapX){
        if(ET>SB){const gap=ET-SB;guides.push(<div key={`D-${el.id}`} className="absolute pointer-events-none z-40" style={{left:SCX-0.5,top:SB,width:1,height:gap}}><div className="h-full w-px bg-red-400"/><div className="absolute bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded" style={{top:'50%',left:4,transform:'translateY(-50%)'}}>{Math.round(gap)}</div></div>);}
        if(EB<ST){const gap=ST-EB;guides.push(<div key={`U-${el.id}`} className="absolute pointer-events-none z-40" style={{left:SCX-0.5,top:EB,width:1,height:gap}}><div className="h-full w-px bg-red-400"/><div className="absolute bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded" style={{top:'50%',left:4,transform:'translateY(-50%)'}}>{Math.round(gap)}</div></div>);}
      }
    });
    return guides;
  };

  const generateAITemplate=async(promptText)=>{
    setAiLoading(true);
    try{
      const system=`당신은 포트폴리오 레이아웃 디자이너입니다. 설명 없이 JSON 배열만 출력하세요.
캔버스 크기: ${canvasSize.width}x${canvasSize.height}
반환 형식: [{"type":"text"|"shape","x":숫자,"y":숫자,"width":숫자,"height":숫자,"content":"텍스트","shape":"rect"|"circle"|"rect_r","fill":"#색상","stroke":"#색상","fontSize":숫자,"fontWeight":"normal"|"bold","color":"#색상"}]
요소 6~12개. 좌표는 캔버스 범위 내.`;
      const res=await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1500,system,messages:[{role:'user',content:promptText}]})});
      if(!res.ok)throw new Error(`서버 오류: ${res.status}`);
      const data=await res.json();if(data.error)throw new Error(data.error);
      const raw=data.content?.map(b=>b.text||'').join('')||'';
      const match=raw.match(/\[[\s\S]*\]/);if(!match)throw new Error('JSON 형식 없음');
      const parsed=JSON.parse(match[0]);
      const newEls=parsed.map((el,i)=>({id:`el_${Date.now()}_${i}`,zIndex:elements.length+i+1,fontFamily:fontOptions[0].value,fontSize:16,fontWeight:'normal',color:'#374151',backgroundColor:'transparent',fill:'#e5e7eb',stroke:'#9ca3af',strokeWidth:2,innerText:'',innerTextStyle:{fontFamily:fontOptions[0].value,fontSize:14,fontWeight:'normal',color:'#374151'},...el}));
      updateElements([...elements,...newEls]);
    }catch(err){alert('AI 템플릿 생성 오류:\n'+err.message);}
    finally{setAiLoading(false);}
  };
  const saveAsUserTemplate=()=>{const name=prompt('템플릿 이름:');if(!name)return;setUserTemplates(prev=>[{id:`tpl_${Date.now()}`,name,elements:JSON.parse(JSON.stringify(elements)),canvasSize},...prev]);alert(`"${name}" 저장됨`);};
  const loadUserTemplate=(tpl)=>{if(!window.confirm(`"${tpl.name}" 불러오기?\n현재 요소가 교체됩니다.`))return;updateElements(tpl.elements);};

  const exportPDF=async()=>{
    if(!canvasRef.current)return;
    setSelectedIds([]);setShowCenterLines(false);setShowGrid(false);
    setTimeout(async()=>{
      const canvas=await html2canvas(canvasRef.current,{scale:2});
      const pdf=new jsPDF(canvasSize.width>canvasSize.height?'l':'p','px',[canvasSize.width,canvasSize.height]);
      pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,canvasSize.width,canvasSize.height);
      pdf.save(`${file.name}_page${currentPageIndex+1}.pdf`);
    },100);
  };

  // ─── 플로팅 툴바 ───
  const renderToolbar=()=>{
    if(!selectedEl)return null;
    const StyleTab=()=>(
      <div className="flex items-center gap-2 flex-wrap">
        {selectedEl.type==='shape'&&<>
          <label className="text-xs text-gray-400">채우기</label>
          <div className="relative w-7 h-7 rounded border border-gray-600 overflow-hidden cursor-pointer"><div className="w-full h-full" style={{backgroundColor:selectedEl.fill||'#d1d5db'}}/><input type="color" value={selectedEl.fill||'#d1d5db'} onChange={e=>updateElement(selectedId,{fill:e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/></div>
          <label className="text-xs text-gray-400">테두리</label>
          <div className="relative w-7 h-7 rounded border border-gray-600 overflow-hidden cursor-pointer"><div className="w-full h-full" style={{backgroundColor:selectedEl.stroke||'#6b7280'}}/><input type="color" value={selectedEl.stroke||'#6b7280'} onChange={e=>updateElement(selectedId,{stroke:e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/></div>
          <input type="number" min={0} max={20} value={selectedEl.strokeWidth||2} onChange={e=>updateElement(selectedId,{strokeWidth:Number(e.target.value)})} className="w-10 text-xs text-center bg-gray-800 rounded py-1 outline-none border border-gray-700"/>
        </>}
        {selectedEl.type==='line'&&<>
          <label className="text-xs text-gray-400">색상</label>
          <div className="relative w-7 h-7 rounded border border-gray-600 overflow-hidden cursor-pointer"><div className="w-full h-full" style={{backgroundColor:selectedEl.stroke||'#6b7280'}}/><input type="color" value={selectedEl.stroke||'#6b7280'} onChange={e=>updateElement(selectedId,{stroke:e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/></div>
          <input type="number" min={1} max={20} value={selectedEl.strokeWidth||2} onChange={e=>updateElement(selectedId,{strokeWidth:Number(e.target.value)})} className="w-10 text-xs text-center bg-gray-800 rounded py-1 outline-none border border-gray-700"/>
          <select value={selectedEl.lineStyle||'solid'} onChange={e=>updateElement(selectedId,{lineStyle:e.target.value})} className="bg-gray-800 text-xs rounded px-2 py-1 outline-none border border-gray-700">
            <option value="solid">실선</option><option value="dashed">점선</option><option value="dotted">점점선</option>
          </select>
          <button onClick={()=>updateElement(selectedId,{arrowStart:!selectedEl.arrowStart})} className={`px-2 py-1 text-xs rounded border ${selectedEl.arrowStart?'border-emerald-500 bg-emerald-500/20 text-emerald-300':'border-gray-700 text-gray-400'}`}>←시작</button>
          <button onClick={()=>updateElement(selectedId,{arrowEnd:!selectedEl.arrowEnd})} className={`px-2 py-1 text-xs rounded border ${selectedEl.arrowEnd?'border-emerald-500 bg-emerald-500/20 text-emerald-300':'border-gray-700 text-gray-400'}`}>끝→</button>
        </>}
      </div>
    );
    const TextTab=()=>{
      const isShape=selectedEl.type==='shape';
      const tv=isShape?selectedEl.innerText||''  :selectedEl.content||'';
      const ts=isShape?(selectedEl.innerTextStyle||{}):selectedEl;
      const upd=(props)=>{if(isShape){updateElement(selectedId,{innerText:props.content!==undefined?props.content:tv,innerTextStyle:{...ts,...props}});}else{updateElement(selectedId,props);}};
      return(
        <div className="flex items-center gap-1.5 flex-wrap">
          {isShape&&<input value={tv} onChange={e=>upd({content:e.target.value})} placeholder="도형 내 텍스트" className="bg-gray-800 text-sm rounded px-2 py-1 outline-none border border-gray-700 w-32"/>}
          <select value={ts.fontFamily||fontOptions[0].value} onChange={e=>upd({fontFamily:e.target.value})} className="bg-transparent hover:bg-gray-800 text-sm px-2 py-1.5 rounded-lg outline-none">
            {fontOptions.map(f=><option key={f.name} value={f.value} className="bg-gray-800">{f.name}</option>)}
          </select>
          <input type="number" value={ts.fontSize||24} onChange={e=>upd({fontSize:Number(e.target.value)})} className="w-10 bg-transparent text-sm text-center outline-none hover:bg-gray-800 rounded-lg py-1"/>
          <div className="w-px h-4 bg-gray-700 mx-1"/>
          <button onClick={()=>upd({fontWeight:ts.fontWeight==='bold'?'normal':'bold'})} className={`p-2 rounded-lg ${ts.fontWeight==='bold'?'bg-gray-700 text-emerald-400':'hover:bg-gray-800'}`}><Bold size={16}/></button>
          <button onClick={()=>upd({fontStyle:ts.fontStyle==='italic'?'normal':'italic'})} className={`p-2 rounded-lg ${ts.fontStyle==='italic'?'bg-gray-700 text-emerald-400':'hover:bg-gray-800'}`}><Italic size={16}/></button>
          <button onClick={()=>upd({textDecoration:ts.textDecoration==='underline'?'none':'underline'})} className={`p-2 rounded-lg ${ts.textDecoration==='underline'?'bg-gray-700 text-emerald-400':'hover:bg-gray-800'}`}><Underline size={16}/></button>
          <div className="relative w-8 h-8 rounded-full hover:bg-gray-800 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full" style={{backgroundColor:ts.color||'#374151'}}/>
            <input type="color" value={ts.color||'#374151'} onChange={e=>upd({color:e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer"/>
          </div>
          {!isShape&&<>
            <div className="relative w-8 h-8 rounded-full hover:bg-gray-800 flex items-center justify-center">
              <div className="w-4 h-4 rounded-sm border border-gray-600" style={{backgroundColor:selectedEl.backgroundColor==='transparent'?'#ffffff':selectedEl.backgroundColor||'#ffffff'}}/>
              <input type="color" value={selectedEl.backgroundColor==='transparent'?'#ffffff':selectedEl.backgroundColor||'#ffffff'} onChange={e=>updateElement(selectedId,{backgroundColor:e.target.value})} className="absolute inset-0 opacity-0 cursor-pointer"/>
            </div>
            <button onClick={()=>updateElement(selectedId,{backgroundColor:'transparent'})} className="text-[11px] text-gray-400 hover:text-white px-1">배경X</button>
          </>}
        </div>
      );
    };
    const ArrangeTab=()=>(
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={bringForward} title="앞으로" className="p-2 hover:bg-gray-800 text-gray-300 rounded-lg"><ArrowUpToLine size={16}/></button>
        <button onClick={sendBackward} title="뒤로" className="p-2 hover:bg-gray-800 text-gray-300 rounded-lg"><ArrowDownToLine size={16}/></button>
        <div className="w-px h-4 bg-gray-700 mx-1"/>
        <button onClick={()=>updateElement(selectedId,{x:(canvasSize.width-selectedEl.width)/2})} title="수평 중앙" className="p-2 hover:bg-gray-800 text-gray-300 rounded-lg"><MoveHorizontal size={16}/></button>
        <button onClick={()=>updateElement(selectedId,{y:(canvasSize.height-selectedEl.height)/2})} title="수직 중앙" className="p-2 hover:bg-gray-800 text-gray-300 rounded-lg"><MoveVertical size={16}/></button>
        <div className="w-px h-4 bg-gray-700 mx-1"/>
        {selectedIds.length>=2&&<button onClick={groupSelected} title="그룹(Ctrl+G)" className="p-2 hover:bg-gray-800 text-emerald-400 rounded-lg"><Group size={16}/></button>}
        {selectedEl?.type==='group'&&<button onClick={ungroupSelected} title="그룹해제(Ctrl+Shift+G)" className="p-2 hover:bg-gray-800 text-amber-400 rounded-lg"><Ungroup size={16}/></button>}
      </div>
    );
    const showStyle=selectedEl.type==='shape'||selectedEl.type==='line';
    const showText=selectedEl.type==='text'||selectedEl.type==='shape';
    const tabs=[showStyle&&{id:'style',label:'스타일'},showText&&{id:'text',label:'텍스트'},{id:'arrange',label:'배치'}].filter(Boolean);
    const activeTab=tabs.find(t=>t.id===toolbarTab)?toolbarTab:tabs[0]?.id;
    return(
      <div className="flex flex-col items-center gap-1" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-0.5 bg-gray-800/90 rounded-2xl px-1 py-0.5 backdrop-blur-md shadow-lg">
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setToolbarTab(t.id)}
              className={`px-3 py-1 text-xs rounded-xl font-medium transition ${activeTab===t.id?'bg-emerald-600 text-white':'text-gray-400 hover:text-gray-200'}`}>
              {t.label}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-700 mx-1"/>
          <button onClick={()=>{updateElements(elements.filter(el=>!selectedIds.includes(el.id)));setSelectedIds([]);}} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={16}/></button>
        </div>
        <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700 text-white px-3 py-2 rounded-2xl shadow-2xl min-w-max">
          {activeTab==='style'&&<StyleTab/>}
          {activeTab==='text'&&<TextTab/>}
          {activeTab==='arrange'&&<ArrangeTab/>}
        </div>
      </div>
    );
  };

  // ─── 요소 렌더 ───
  const renderElement=(el)=>{
    if(el.type==='text')return(<div className="w-full h-full relative group"><div className="drag-handle absolute -top-4 left-0 w-full h-4 cursor-move opacity-0 group-hover:opacity-100 bg-emerald-500 flex items-center justify-center rounded-t-md"><Maximize size={10} className="text-white"/></div><textarea value={el.content} onChange={e=>updateElement(el.id,{content:e.target.value})} style={{fontFamily:el.fontFamily,fontSize:`${el.fontSize}px`,fontWeight:el.fontWeight,fontStyle:el.fontStyle,textDecoration:el.textDecoration,color:el.color,backgroundColor:el.backgroundColor}} className="w-full h-full resize-none outline-none p-1 bg-transparent"/></div>);
    if(el.type==='shape')return(<div className="w-full h-full drag-handle cursor-move"><ShapeSVG shape={el.shape} width={el.width} height={el.height} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} innerText={el.innerText} textStyle={el.innerTextStyle}/></div>);
    if(el.type==='line')return(<div className="w-full h-full drag-handle cursor-move"><LineSVG width={el.width} height={el.height} stroke={el.stroke} strokeWidth={el.strokeWidth} lineStyle={el.lineStyle} arrowStart={el.arrowStart} arrowEnd={el.arrowEnd}/></div>);
    if(el.type==='image')return(<div className="w-full h-full relative drag-handle cursor-move"><img src={el.src} alt="" className="w-full h-full object-cover pointer-events-none"/></div>);
    if(el.type==='group')return(<div className="w-full h-full relative drag-handle cursor-move border-2 border-dashed border-blue-400/50 rounded">{el.children?.map(child=>(<div key={child.id} className="absolute pointer-events-none" style={{left:child.x,top:child.y,width:child.width,height:child.height}}>{renderElement(child)}</div>))}</div>);
    return null;
  };

  return(
    <div className={`flex h-screen w-full transition-colors ${currentTheme.bg} ${currentTheme.text}`} onClick={()=>setSelectedIds([])}>

      {/* ── 사이드바 (원본 레이아웃 유지 + 탭 추가) ── */}
      <aside className={`w-80 flex flex-col ${currentTheme.panel} border-r ${currentTheme.border} z-20 shadow-xl`} onClick={e=>e.stopPropagation()}>
        <div className="p-6 flex flex-col h-full overflow-hidden">
          <button onClick={goBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-500 font-medium mb-6 transition-colors shrink-0">
            <ChevronLeft size={18}/> 대시보드
          </button>

          {/* 사이드바 탭 */}
          <div className={`flex border-b ${currentTheme.border} mb-4 shrink-0`}>
            {[{id:'tools',label:'도구'},{id:'assets',label:'에셋'},{id:'templates',label:'템플릿'}].map(t=>(
              <button key={t.id} onClick={()=>setSidebarTab(t.id)} className={`flex-1 py-2 text-xs font-bold transition ${sidebarTab===t.id?'text-emerald-500 border-b-2 border-emerald-500':'text-gray-500 hover:text-gray-300'}`}>{t.label}</button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3">

            {/* 도구 탭 */}
            {sidebarTab==='tools'&&<>
              <button onClick={addTextElement} className={`py-3 rounded-xl border ${currentTheme.border} hover:border-emerald-500/50 flex justify-center items-center gap-2 font-medium`}><Type size={18}/> 텍스트 박스</button>
              {/* 도형 */}
              <div className={`rounded-xl border ${currentTheme.border} overflow-hidden`}>
                <button onClick={()=>setShapesPanelOpen(v=>!v)} className="w-full py-3 px-4 flex items-center justify-between font-medium hover:bg-white/5">
                  <span className="flex items-center gap-2"><Square size={16}/> 도형</span>
                  <ChevronDown size={14} className={`transition-transform ${shapesPanelOpen?'rotate-180':''}`}/>
                </button>
                {shapesPanelOpen&&<div className="grid grid-cols-4 gap-1 p-2 border-t border-white/5">{shapeTypes.map(s=><button key={s.id} onClick={()=>addShapeElement(s.id)} className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[11px] text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400 transition" title={s.label}><span className="text-lg leading-none">{s.icon}</span><span className="truncate w-full text-center">{s.label}</span></button>)}</div>}
              </div>
              {/* 선 */}
              <div className={`rounded-xl border ${currentTheme.border} overflow-hidden`}>
                <button onClick={()=>setLinePanelOpen(v=>!v)} className="w-full py-3 px-4 flex items-center justify-between font-medium hover:bg-white/5">
                  <span className="flex items-center gap-2"><Minus size={16}/> 선 / 화살표</span>
                  <ChevronDown size={14} className={`transition-transform ${linePanelOpen?'rotate-180':''}`}/>
                </button>
                {linePanelOpen&&<div className="p-3 border-t border-white/5 flex flex-col gap-2">
                  <div className="grid grid-cols-3 gap-1">{['solid','dashed','dotted'].map(s=><button key={s} onClick={()=>setLineConfig(c=>({...c,style:s}))} className={`py-1.5 text-xs rounded border transition ${lineConfig.style===s?'border-emerald-500 text-emerald-400 bg-emerald-500/10':'border-white/10 text-gray-400 hover:border-white/30'}`}>{s==='solid'?'실선':s==='dashed'?'점선':'점점선'}</button>)}</div>
                  <div className="flex items-center gap-2"><span className="text-xs text-gray-400 w-8">두께</span><input type="range" min={1} max={10} value={lineConfig.strokeWidth} onChange={e=>setLineConfig(c=>({...c,strokeWidth:Number(e.target.value)}))} className="flex-1"/><span className="text-xs text-gray-400 w-4">{lineConfig.strokeWidth}</span></div>
                  <div className="flex gap-2">
                    <button onClick={()=>setLineConfig(c=>({...c,arrowStart:!c.arrowStart}))} className={`flex-1 py-1.5 text-xs rounded border transition ${lineConfig.arrowStart?'border-emerald-500 text-emerald-400 bg-emerald-500/10':'border-white/10 text-gray-400'}`}>←시작 화살표</button>
                    <button onClick={()=>setLineConfig(c=>({...c,arrowEnd:!c.arrowEnd}))} className={`flex-1 py-1.5 text-xs rounded border transition ${lineConfig.arrowEnd?'border-emerald-500 text-emerald-400 bg-emerald-500/10':'border-white/10 text-gray-400'}`}>끝 화살표→</button>
                  </div>
                  <button onClick={addLineElement} className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition">선 추가</button>
                </div>}
              </div>
              <button onClick={()=>fileInputRef.current.click()} className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg flex justify-center items-center gap-2 font-medium"><Upload size={18}/> PC 사진 등록</button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden"/>
              {/* 워터마크 */}
              <div className={`p-3 rounded-xl border ${currentTheme.border} flex flex-col gap-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">워터마크</span>
                  <button onClick={()=>setShowWatermark(v=>!v)} className={`text-xs px-2 py-0.5 rounded-full border transition ${showWatermark?'border-emerald-500 text-emerald-400 bg-emerald-500/10':'border-white/10 text-gray-500'}`}>{showWatermark?'ON':'OFF'}</button>
                </div>
                <input value={watermark} onChange={e=>setWatermark(e.target.value)} placeholder="워터마크 텍스트 입력" className={`text-xs px-2 py-1.5 rounded-lg bg-black/20 border ${currentTheme.border} outline-none w-full`}/>
              </div>
            </>}

            {/* 에셋 탭 */}
            {sidebarTab==='assets'&&<>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><LayoutGrid size={14}/> 글로벌 에셋</h3>
              <p className="text-xs text-gray-500">클릭하면 캔버스에 추가됩니다.</p>
              {globalAssets.length===0&&<p className="text-xs text-gray-600 py-4 text-center">에셋이 없습니다.<br/>도구 탭에서 이미지를 업로드하세요.</p>}
              <div className="grid grid-cols-2 gap-3">
                {globalAssets.map(asset=>(
                  <div key={asset.id} onClick={()=>addToCanvas(asset)} className="group relative cursor-pointer rounded-xl overflow-hidden hover:border-emerald-500 border border-transparent hover:shadow-md transition-all aspect-square bg-black/10">
                    <img src={asset.src} className="w-full h-full object-cover" alt={asset.name}/>
                    <div className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                      <span className="text-xs font-bold text-white tracking-wide">불러오기</span>
                    </div>
                  </div>
                ))}
              </div>
            </>}

            {/* 템플릿 탭 */}
            {sidebarTab==='templates'&&<>
              <div className={`p-3 rounded-xl border ${currentTheme.border} flex flex-col gap-2`}>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400"><Sparkles size={13}/> AI 템플릿 생성</div>
                <div className="grid grid-cols-2 gap-1">{aiTemplateOptions.map(opt=><button key={opt.id} onClick={()=>generateAITemplate(opt.prompt)} disabled={aiLoading} className="py-1.5 text-xs rounded border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-gray-300 transition disabled:opacity-40">{opt.label}</button>)}</div>
                <div className="flex gap-1"><input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="직접 입력..." className={`flex-1 text-xs px-2 py-1.5 rounded bg-black/20 border ${currentTheme.border} outline-none`}/><button onClick={()=>aiPrompt&&generateAITemplate(aiPrompt)} disabled={aiLoading||!aiPrompt} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded transition disabled:opacity-40">{aiLoading?'...':'생성'}</button></div>
              </div>
              <button onClick={saveAsUserTemplate} className={`py-2.5 rounded-xl border ${currentTheme.border} hover:border-emerald-500/50 flex justify-center items-center gap-2 text-sm font-medium`}><Save size={15}/> 현재 페이지를 템플릿으로 저장</button>
              {userTemplates.length>0&&<><p className="text-xs text-gray-500">저장된 템플릿</p><div className="flex flex-col gap-1.5">{userTemplates.map(tpl=>(<div key={tpl.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${currentTheme.border} hover:border-emerald-500/30 transition`}><div><p className="text-sm font-medium">{tpl.name}</p><p className="text-[10px] text-gray-500">{tpl.elements.length}개 요소</p></div><div className="flex gap-1"><button onClick={()=>loadUserTemplate(tpl)} className="p-1.5 hover:bg-emerald-500/10 text-emerald-400 rounded text-xs">불러오기</button><button onClick={()=>setUserTemplates(prev=>prev.filter(t=>t.id!==tpl.id))} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded"><X size={12}/></button></div></div>))}</div></>}
              {userTemplates.length===0&&<p className="text-xs text-gray-600 py-2 text-center">저장된 템플릿이 없습니다</p>}
            </>}
          </div>
        </div>
      </aside>

      {/* ── 메인 ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* 헤더 */}
        <header className={`h-16 flex items-center justify-between px-6 ${currentTheme.panel} border-b ${currentTheme.border} z-20`} onClick={e=>e.stopPropagation()}>
          <div className="font-semibold">{file.name}</div>
          <div className="flex items-center gap-2 bg-black/5 dark:bg-black/20 p-1 rounded-lg border border-gray-500/10">
            <div className="flex items-center px-2 border-r border-gray-500/20">
              <Monitor size={14} className="text-gray-400 mr-2"/>
              <select className="bg-transparent text-sm font-medium outline-none cursor-pointer text-emerald-500" value={canvasSizeKey} onChange={e=>{setCanvasSizeKey(e.target.value);setCanvasSize(canvasPresets[e.target.value]);setViewModeChangeTrigger(p=>p+1);}}>
                {Object.entries(canvasPresets).map(([k,v])=><option key={k} value={k} className="bg-gray-800">{v.label}</option>)}
              </select>
            </div>
            {canvasSizeKey==='CUSTOM'&&<div className="flex items-center gap-2 text-xs text-gray-500 px-2 border-r border-gray-500/20">W:<input type="number" value={canvasSize.width} onChange={e=>{setCanvasSize(c=>({...c,width:Number(e.target.value)}));setViewModeChangeTrigger(p=>p+1);}} className="w-12 bg-transparent text-center border-b border-gray-500 outline-none"/>H:<input type="number" value={canvasSize.height} onChange={e=>{setCanvasSize(c=>({...c,height:Number(e.target.value)}));setViewModeChangeTrigger(p=>p+1);}} className="w-12 bg-transparent text-center border-b border-gray-500 outline-none"/></div>}
            <button onClick={()=>setShowGrid(v=>!v)} className={`p-1.5 px-3 rounded-md text-sm font-medium flex items-center gap-1.5 ${showGrid?'bg-white dark:bg-gray-700 text-emerald-500':'text-gray-500'}`}><Grid size={14}/> 눈금</button>
            <button onClick={()=>setShowCenterLines(v=>!v)} className={`p-1.5 px-3 rounded-md text-sm font-medium flex items-center gap-1.5 ${showCenterLines?'bg-white dark:bg-gray-700 text-emerald-500':'text-gray-500'}`}><Maximize size={14}/> 스냅</button>
          </div>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all"><Download size={16}/> 현재 화면 PDF</button>
        </header>

        {/* 플로팅 툴바 fixed — 헤더(64px)+사이드바(320px) 반영 */}
        {selectedEl&&(
          <div className="fixed z-50 flex flex-col items-center"
            style={{top:'68px', left:'calc(320px + (100vw - 320px)/2)', transform:'translateX(-50%)'}}
            onClick={e=>e.stopPropagation()}>
            {renderToolbar()}
          </div>
        )}

        {/* 뷰포트 */}
        <div ref={viewportRef} className="flex-1 overflow-auto bg-gray-900/5 dark:bg-black/40 flex justify-center items-center p-10 relative" onClick={()=>setSelectedIds([])}>
          <div style={{transform:`scale(${zoom})`,transformOrigin:'center center',transition:'transform 0.2s ease-in-out'}}>
            <div id="portfolio-canvas" ref={canvasRef}
              style={{width:`${canvasSize.width}px`,height:`${canvasSize.height}px`}}
              className={`bg-white relative shadow-2xl overflow-hidden ${showGrid?'bg-grid-pattern':''}`}
              onClick={e=>e.stopPropagation()}>
              {showCenterLines&&<><div className="absolute top-0 left-1/2 w-0 h-full center-guideline-v z-30 pointer-events-none"/><div className="absolute left-0 top-1/2 w-full h-0 center-guideline-h z-30 pointer-events-none"/></>}
              {/* 워터마크 */}
              {showWatermark&&watermark&&(
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20" style={{transform:'rotate(-30deg)'}}>
                  <span className="text-gray-300/40 font-bold select-none whitespace-nowrap" style={{fontSize:`${Math.min(canvasSize.width,canvasSize.height)*0.08}px`}}>{watermark}</span>
                </div>
              )}
              {renderDistanceGuides()}
              {elements.map(el=>(
                <Rnd key={el.id}
                  size={{width:el.width,height:el.type==='line'?Math.max(el.height||4,(el.strokeWidth||2)+20):el.height}}
                  position={{x:el.x,y:el.y}}
                  onDrag={(e,d)=>handleDrag(e,d,el)}
                  onDragStop={(e,d)=>updateElement(el.id,{x:d.x,y:d.y})}
                  onResizeStop={(e,dir,ref,delta,pos)=>updateElement(el.id,{width:parseInt(ref.style.width),height:parseInt(ref.style.height),...pos})}
                  lockAspectRatio={el.type==='image'}
                  bounds="parent" dragHandleClassName="drag-handle"
                  onClick={e=>{e.stopPropagation();setSelectedIds([el.id]);setToolbarTab(el.type==='line'||el.type==='shape'?'style':'text');}}
                  style={{zIndex:el.zIndex||1}}
                  className={`absolute group ${selectedIds.includes(el.id)?'ring-2 ring-emerald-500':'hover:ring-1 ring-blue-400/50'}`}
                >
                  {selectedIds.includes(el.id)&&<div className="absolute -top-7 left-0 bg-gray-900/90 text-white text-[11px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100">W: {Math.round(el.width)} | H: {Math.round(el.height)}</div>}
                  {renderElement(el)}
                </Rnd>
              ))}
            </div>
          </div>
        </div>

        {/* 페이지 탭 */}
        <div className={`h-12 flex items-center px-6 ${currentTheme.panel} border-t ${currentTheme.border} z-20 gap-2 overflow-x-auto`}>
          <Layers size={14} className="text-gray-500 mr-2"/>
          {pages.map((p,idx)=>(
            <button key={p.id} onClick={()=>{setSelectedIds([]);setCurrentPageIndex(idx);}} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${currentPageIndex===idx?'bg-emerald-500 text-white shadow-md':'text-gray-500 hover:bg-gray-500/10'}`}>Page {idx+1}</button>
          ))}
          <button onClick={()=>{const p={id:`p_${Date.now()}`,elements:[]};setPages(prev=>[...prev,p]);setCurrentPageIndex(pages.length);}} className="px-3 py-1.5 rounded-md text-sm flex items-center gap-1 text-emerald-500 hover:bg-emerald-500/10 font-bold transition"><Plus size={14}/> 페이지 추가</button>
        </div>
      </main>
    </div>
  );
}
