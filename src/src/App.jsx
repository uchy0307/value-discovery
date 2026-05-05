import React, { useState, useRef, useEffect } from "react";

const C = {
  bg:"#f0ede8",surface:"#ffffff",surface2:"#e8e4de",surface3:"#ddd8d0",
  border:"#c8c0b4",borderActive:"#8a6030",
  gold:"#8a6030",goldLight:"#f5e8d0",goldDim:"#5a3a10",
  goldBg:"rgba(138,96,48,0.08)",text:"#1a1210",
  textSub:"#3a3028",textMuted:"#6a5e50",
  green:"#1a4a30",greenLight:"#d0eedd",
  userBubble:"#1a3828",userText:"#d8f0e0",
};

// ── グローバル音声管理（Reactのstateに依存しない） ──
window._tapOn = true;
window._speaking = false;

function T(type="tap") {
  if (!window._tapOn) return;
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    if (type==="tap") {
      o.frequency.setValueAtTime(880,ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(440,ctx.currentTime+0.06);
      g.gain.setValueAtTime(0.12,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.08);
      o.start(); o.stop(ctx.currentTime+0.08);
    } else if (type==="success") {
      [523,659,784].forEach((f,i)=>{
        const o2=ctx.createOscillator(),g2=ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.value=f;
        g2.gain.setValueAtTime(0.1,ctx.currentTime+i*0.1);
        g2.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.1+0.2);
        o2.start(ctx.currentTime+i*0.1); o2.stop(ctx.currentTime+i*0.1+0.25);
      });
    } else if (type==="send") {
      o.frequency.setValueAtTime(660,ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+0.06);
      g.gain.setValueAtTime(0.1,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.1);
      o.start(); o.stop(ctx.currentTime+0.1);
    }
  } catch(e) {}
}

function doSpeak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang="ja-JP"; u.rate=0.95;
    u.onend = () => { window._speaking=false; };
    const v = window.speechSynthesis.getVoices().find(v=>v.lang.includes("ja"));
    if (v) u.voice=v;
    window.speechSynthesis.speak(u);
    window._speaking = true;
  } catch(e) {}
}
function doStopSpeak() {
  try { window.speechSynthesis.cancel(); window._speaking=false; } catch(e) {}
}

const VALUES = [
  {id:"freedom",  icon:"🦅",label:"自由・独立",  desc:"自分の意思で動く・誰にも縛られない"},
  {id:"security", icon:"🏡",label:"安定・安全",  desc:"リスクを避け安心できる基盤を持つ"},
  {id:"growth",   icon:"🌱",label:"成長・挑戦",  desc:"常に学び昨日の自分を超え続ける"},
  {id:"connect",  icon:"❤️",label:"繋がり・愛",  desc:"深い人間関係と揺るぎない所属感"},
  {id:"achieve",  icon:"🏆",label:"達成・成功",  desc:"目標を超え結果で自分を証明する"},
  {id:"contrib",  icon:"🌍",label:"貢献・使命",  desc:"社会と人の役に立ち跡を残す"},
  {id:"create",   icon:"🎨",label:"創造・表現",  desc:"作り表現し世界に独自の何かを生む"},
  {id:"health",   icon:"⚡",label:"健康・活力",  desc:"心身の充実を保ちエネルギーに溢れる"},
  {id:"wealth",   icon:"💎",label:"富・豊かさ",  desc:"経済的自由を手にし選択肢を広げる"},
  {id:"wisdom",   icon:"🔭",label:"知恵・真理",  desc:"物事の本質を理解し深く考え続ける"},
  {id:"family",   icon:"🏮",label:"家族・伝統",  desc:"受け継ぎ守り次の世代に渡す"},
  {id:"fun",      icon:"🎭",label:"楽しみ・遊び",desc:"人生を謳歌し笑いと喜びに溢れる"},
];

const QUESTIONS = [
  {id:"regret",  title:"後悔という名の羅針盤",q:"人生でもっとも後悔している決断を教えてください。その時あなたは何を犠牲にし、何のためにその犠牲を払いましたか？",hint:"後悔の裏には本当に大切にしているものが眠っています。"},
  {id:"death",   title:"死の前夜という鏡",q:"死ぬ前日の夜、一人でいる自分を想像してください。「これだけはやっておけばよかった」と思うことは？「やり切れた」と思えることは？",hint:"死という視点だけが本当の優先順位を照らし出します。"},
  {id:"anger",   title:"怒りという告白",q:"あなたが最も深く怒りを感じる時はどんな時ですか？その怒りの裏に隠れている「絶対に曲げられないもの」は何ですか？",hint:"怒りはあなたの価値観への侵害のサインです。"},
  {id:"envy",    title:"羨望という地図",q:"誰かを羨ましいと感じた最も最近の経験を教えてください。その人の「何」が羨ましかったのでしょうか？",hint:"羨望はあなた自身が渇望している未来を指し示します。"},
  {id:"respect", title:"尊敬という投影",q:"心から尊敬する人を一人思い浮かべてください。その人の「どこ」を尊敬しますか？なぜその部分があなたの心を動かすのでしょうか？",hint:"尊敬する理由はあなた自身の価値観の鏡です。"},
];

const SYSTEM = `あなたは「価値観発掘コンサルタント」です。

### 【コアバリュー分析】
TOP3の価値観それぞれについて3〜4文の深い分析を書く。回答内容の具体的な言葉を引用し「なぜその価値観がその人の核にあるのか」を論じる。

### 【あなたの価値観の構造】
価値観同士がどう絡み合い影響し合っているかを2〜3段落で描写する。相互補完・相互矛盾の両面を含める。

### 【価値観の葛藤ポイント】
この人がどんな場面で葛藤しやすいかを2〜3つ具体的な状況で示す。

### 【あなたの人生の問い】
この人が一生をかけて向き合うであろう根本的な問いを1つ詩的に表現する。

### 【今週の決断テスト】
今週中にできる小さな選択で「本当の価値観を確かめる」具体的なアクションを1つ提示する。

必ず全セクションを書き切ること。途中で終わらないこと。1200〜1800字。`;

const SYSTEM_PERSPECTIVE = `あなたは「他者視点分析の専門家」です。ユーザーの価値観分析結果を基に、3つの異なる視点からその人がどう見えているかを分析します。

### 👫 親友・家族の視点
あなたをよく知る親友または家族として、「良いところ」「気になるところ」「一緒にいて感じること」を率直に語る。愛情ある正直さで。2〜3段落。

### ❤️ 大切なパートナー・家族の視点
あなたの身近にいる大切な人（パートナー・親・子など）として、「そばにいて感じること」「もっとこうしてほしいこと」「あなたの知らないあなたの姿」を語る。2〜3段落。

### 🔮 未来の自分の視点（10年後）
10年後のあなたが今を振り返って語る。「あの頃の自分は…」「今から見れば…」「変わったこと・変わらなかったこと」を語る。2〜3段落。

各視点は「〇〇さん（またはあなた）は〜」という語りかける形式で書く。鋭く、温かく、読んで「確かに…」と思わせる内容に。合計900〜1200字。途中で終わらないこと。`;


const HKEY = "value_discovery_history_v1";

const loadH = () => { try { return JSON.parse(localStorage.getItem(HKEY)||"[]"); } catch { return []; } };
const saveH = (h) => { try { localStorage.setItem(HKEY, JSON.stringify(h.slice(0,20))); } catch {} };

const Bubble = ({text,isUser}) => (
  <div style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",marginBottom:14}}>
    {!isUser&&<div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,marginRight:8,marginTop:2,flexShrink:0}}>⚖️</div>}
    <div style={{maxWidth:"85%",padding:"11px 14px",fontSize:13.5,lineHeight:1.9,whiteSpace:"pre-wrap",borderRadius:isUser?"18px 18px 4px 18px":"18px 18px 18px 4px",background:isUser?C.userBubble:C.surface,border:`1px solid ${isUser?"transparent":C.border}`,color:isUser?C.userText:C.text}}>{text}</div>
  </div>
);
const Dots = () => (
  <div style={{display:"flex",gap:5,paddingLeft:34,paddingBottom:12}}>
    {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.gold,animation:"pulse 1.2s ease infinite",animationDelay:`${i*0.2}s`}}/>)}
  </div>
);

// ── レーダーチャート（App外で定義） ─────────────────────────
const RadarChart = ({rankings}) => {
  const scores = [100,85,70,55,40,25];
  const top6 = Array.from({length:6}, (_,i) => {
    const id = rankings[i];
    const v = id ? VALUES.find(v=>v.id===id) : null;
    return v ? {...v, score:scores[i]} : {id:"",icon:"",label:"",score:0};
  });
  const W=280,H=280,cx=140,cy=140,r=90,n=6;
  const ang = (i) => (2*Math.PI/n)*i - Math.PI/2;
  const pt  = (i,rad) => ({x:cx+rad*Math.cos(ang(i)), y:cy+rad*Math.sin(ang(i))});
  const dataPath = top6.map((v,i)=>{const p=pt(i,(v.score/100)*r);return`${i===0?"M":"L"}${p.x},${p.y}`;}).join(" ")+" Z";
  const gridLevels = [0.33,0.66,1.0];
  const gridColors = ["#e8e4de","#d8d0c8","#c8c0b4"];
  return (
    <div style={{background:C.surface,borderRadius:14,padding:16,marginBottom:14,border:`1px solid ${C.border}`}}>
      <div style={{fontSize:12,color:C.gold,fontWeight:600,marginBottom:10,textAlign:"center"}}>価値観レーダーチャート</div>
      <div style={{display:"flex",justifyContent:"center"}}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
          <rect width={W} height={H} fill={C.surface}/>
          {gridLevels.map((lv,li) => {
            const d = Array.from({length:n},(_,i)=>{const p=pt(i,r*lv);return`${i===0?"M":"L"}${p.x},${p.y}`;}).join(" ")+" Z";
            return <path key={li} d={d} fill="none" stroke={gridColors[li]} strokeWidth={1}/>;
          })}
          {Array.from({length:n},(_,i) => {
            const p=pt(i,r);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={C.border} strokeWidth={1}/>;
          })}
          <path d={dataPath} fill="rgba(138,96,48,0.1)" stroke={C.gold} strokeWidth={2} strokeLinejoin="round"/>
          {top6.map((v,i) => {
            const p=pt(i,(v.score/100)*r);
            return v.score>0 ? <circle key={i} cx={p.x} cy={p.y} r={5} fill={C.gold}/> : null;
          })}
          {top6.map((v,i) => {
            const lp=pt(i,r+28);
            return v.label ? (
              <g key={i}>
                <text x={lp.x} y={lp.y-7} textAnchor="middle" fontSize={15} dominantBaseline="middle">{v.icon}</text>
                <text x={lp.x} y={lp.y+9} textAnchor="middle" fontSize={8} fill={C.textSub} fontFamily="sans-serif">{v.label}</text>
              </g>
            ) : null;
          })}
        </svg>
      </div>
      {rankings.slice(0,5).map((id,i) => {
        const v=VALUES.find(v=>v.id===id);
        const sc=[100,85,70,55,40][i];
        return (
          <div key={id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:16,fontSize:11,color:C.gold,fontWeight:700}}>{i+1}</div>
            <div style={{fontSize:13}}>{v?.icon}</div>
            <div style={{fontSize:11,color:C.text,width:80,flexShrink:0}}>{v?.label}</div>
            <div style={{flex:1,height:5,background:C.surface2,borderRadius:3}}>
              <div style={{height:"100%",width:`${sc}%`,background:`linear-gradient(90deg,${C.gold},${C.goldDim})`,borderRadius:3}}/>
            </div>
            <div style={{fontSize:10,color:C.textSub,width:28,textAlign:"right"}}>{sc}</div>
          </div>
        );
      })}
    </div>
  );
};

export default function App() {
  useEffect(()=>{
    document.body.style.background="#f0ede8";
    document.documentElement.style.background="#f0ede8";
  },[]);

  const tapOnRef = useRef(true);
  const [tapOn, setTapOn] = useState(true);
  const toggleTap = () => {
    const n = !tapOnRef.current;
    tapOnRef.current = n;
    window._tapOn = n;
    setTapOn(n);
  };
  const isSpeakingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const toggleSpeak = (text) => {
    if (window._speaking) {
      doStopSpeak();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    } else if (text) {
      doSpeak(text);
      isSpeakingRef.current = true;
      setIsSpeaking(true);
    }
  };

  const [screen, setScreen] = useState("home");
  const [tab, setTab] = useState("chat");
  const [userName, setUserName] = useState("");
  const [rankings, setRankings] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [curAns, setCurAns] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [analysisOk, setAnalysisOk] = useState(false);
  const [history, setHistory] = useState(loadH);
  const [selH, setSelH] = useState(null);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  const toggleRank = (id) => {
    T("tap");
    setRankings(prev=>prev.includes(id)?prev.filter(v=>v!==id):prev.length<5?[...prev,id]:prev);
  };

  const submitAnswer = () => {
    if(!curAns.trim()) return;
    T("tap");
    const q=QUESTIONS[step];
    const newA={...answers,[q.id]:curAns};
    setAnswers(newA); setCurAns("");
    if(step<QUESTIONS.length-1){setStep(s=>s+1);}
    else{generateAnalysis(newA);}
  };

  const generateAnalysis = async(finalAnswers) => {
    setScreen("result"); setLoading(true);
    const top5=rankings.slice(0,5).map((id,i)=>{const v=VALUES.find(v=>v.id===id);return`${i+1}位: ${v?.label}（${v?.desc}）`;});
    const content=`【選んだ価値観】\n${top5.join("\n")}\n\n【5つの問いへの回答】\n${QUESTIONS.map(q=>`▼${q.title}\n${finalAnswers[q.id]||"未回答"}`).join("\n\n")}${userName?`\n\n【名前】${userName}`:""}`;
    setMsgs([{role:"ai",text:`${userName?userName+"さん、":""}ありがとうございます。\n価値観の地図を描きます...`}]);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4000,system:SYSTEM,messages:[{role:"user",content}]})});
      const data=await res.json();
      const text=data.content?.[0]?.text||"分析の生成に失敗しました。";
      setMsgs(prev=>[...prev,{role:"ai",text}]);
      setAnalysisText(text); setAnalysisOk(true); T("success");
      const rec={date:new Date().toLocaleDateString("ja-JP"),userName:userName||"匿名",top3:rankings.slice(0,3).map(id=>VALUES.find(v=>v.id===id)?.label||id),rankings,analysis:text};
      const newH=[rec,...history].slice(0,20);
      setHistory(newH); saveH(newH);
    } catch{setMsgs(prev=>[...prev,{role:"ai",text:"通信エラーが発生しました。"}]);}
    finally{setLoading(false);}
  };

  const sendChat = async() => {
    if(!chatInput.trim()||loading) return;
    T("send");
    const msg=chatInput;
    setMsgs(prev=>[...prev,{role:"user",text:msg}]);
    setChatInput(""); setLoading(true);
    try {
      const hist=msgs.map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text}));
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:SYSTEM,messages:[...hist,{role:"user",content:msg}]})});
      const data=await res.json();
      setMsgs(prev=>[...prev,{role:"ai",text:data.content?.[0]?.text||"エラー"}]);
    } catch{setMsgs(prev=>[...prev,{role:"ai",text:"通信エラーが発生しました。"}]);}
    finally{setLoading(false);}
  };

  const copyResult = async(text) => {
    T("tap");
    try{await navigator.clipboard.writeText(text);}
    catch{const el=document.createElement("textarea");el.value=text;el.style.cssText="position:fixed;opacity:0";document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);}
    setCopied(true); setTimeout(()=>setCopied(false),2500);
  };

  const [perspText, setPerspText] = useState("");
  const [perspLoading, setPerspLoading] = useState(false);
  const [perspDone, setPerspDone] = useState(false);

  const generatePerspective = async () => {
    T("tap"); setPerspLoading(true); setPerspDone(false);
    const top5 = rankings.slice(0,5).map((id,i)=>`${i+1}位:${VALUES.find(v=>v.id===id)?.label}`).join("、");
    const content = `【この人の価値観分析結果】\nTOP5: ${top5}\n\n${analysisText.slice(0,800)}`;
    setMsgs(prev=>[...prev, {role:"ai", text:"👥 他者視点で分析します...\n\n親友・家族・未来の自分、3つの視点からあなたを見てみます。"}]);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514", max_tokens:2000, system:SYSTEM_PERSPECTIVE, messages:[{role:"user",content}]}),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "生成に失敗しました。";
      setPerspText(text);
      setMsgs(prev=>[...prev, {role:"ai", text}]);
      setPerspDone(true); T("success");
    } catch { setMsgs(prev=>[...prev, {role:"ai", text:"通信エラーが発生しました。"}]); }
    finally { setPerspLoading(false); }
  };

  const resetAll = () => { T("tap"); setScreen("home"); setRankings([]); setStep(0); setAnswers({}); setCurAns(""); setMsgs([]); setAnalysisText(""); setAnalysisOk(false); setTab("chat"); setIsSpeaking(false); };

  const deleteAll = () => {
    T("tap"); setHistory([]); saveH([]); setSelH(null);
  };

  const hBtn = (active) => ({padding:"4px 8px",background:active?C.goldBg:C.surface2,border:`1px solid ${active?C.borderActive:C.border}`,borderRadius:7,fontSize:10,color:active?C.gold:C.textSub,fontWeight:active?700:400,cursor:"pointer",flexShrink:0});

  const Q = QUESTIONS[step];
  const progress = screen==="ranking"?1:screen==="questions"?2:3;

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"sans-serif",maxWidth:520,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body,html{background:#f0ede8!important}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:0.2;transform:scale(0.7)}50%{opacity:1;transform:scale(1)}}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#c8c0b4}textarea:focus,input:focus{outline:none}button{font-family:inherit;cursor:pointer}`}</style>

      {/* ヘッダー */}
      <div style={{padding:"12px 14px 0",borderBottom:`1px solid ${C.border}`,background:C.surface,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⚖️</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:C.gold}}>価値観発掘コンサル</div>
            <div style={{fontSize:9,color:C.textMuted}}>VALUE DISCOVERY SESSION</div>
          </div>
          <button onClick={toggleTap} style={hBtn(tapOn)}>{tapOn?"🔔音ON":"🔕音OFF"}</button>
          <button onClick={()=>toggleSpeak(analysisText)} style={hBtn(isSpeaking)}>{isSpeaking?"⏹停止":"🔈読上"}</button>
          <button onClick={()=>{T("tap");setSelH(null);setScreen(s=>s==="history"?"home":"history");}} style={hBtn(screen==="history")}>📊履歴</button>
        </div>
        {screen!=="home"&&screen!=="history"&&(
          <div style={{display:"flex",gap:4,paddingBottom:10}}>
            {["ランキング","深掘り","分析"].map((lbl,i)=>(
              <div key={i} style={{flex:1,textAlign:"center"}}>
                <div style={{height:2,borderRadius:1,background:progress>i?C.gold:C.border,marginBottom:3,transition:"background 0.4s"}}/>
                <div style={{fontSize:9,color:progress>i?C.gold:C.textMuted}}>{lbl}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ホーム */}
      {screen==="home"&&(
        <div style={{flex:1,overflowY:"auto",padding:"24px 16px 40px",animation:"fadeUp 0.4s ease"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:44,marginBottom:12}}>⚖️</div>
            <div style={{fontSize:20,fontWeight:700,color:C.gold,marginBottom:10,lineHeight:1.5}}>あなたの価値観を発掘する</div>
            <div style={{fontSize:13,color:C.textSub,lineHeight:1.9}}>人生の多くの迷いは、自分の価値観を知らないまま決断していることから生まれます。12の価値観から優先順位を選び、5つの深い問いに向き合うことで、<span style={{color:C.goldDim,fontWeight:600}}>あなたが本当に大切にしているもの</span>を言語化します。</div>
          </div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:16}}>
            {[{n:"01",t:"価値観ランキング",d:"12の価値観から上位5つを選ぶ"},{n:"02",t:"5つの深い問い",d:"後悔・死・怒り・羨望・尊敬の視点から本音を掘り下げる"},{n:"03",t:"AI分析＋レーダーチャート",d:"価値観マップの生成＋六角形で数値化"}].map(item=>(
              <div key={item.n} style={{display:"flex",gap:12,marginBottom:10}}>
                <div style={{fontSize:10,color:C.goldDim,fontWeight:700,width:18,flexShrink:0,marginTop:2}}>{item.n}</div>
                <div><div style={{fontSize:13,color:C.text,fontWeight:600,marginBottom:2}}>{item.t}</div><div style={{fontSize:11,color:C.textSub,lineHeight:1.6}}>{item.d}</div></div>
              </div>
            ))}
            <div style={{fontSize:11,color:C.textMuted,paddingTop:10,borderTop:`1px solid ${C.border}`,marginTop:4}}>所要時間：約15〜20分</div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:C.textSub,marginBottom:6}}>お名前（任意）</div>
            <input value={userName} onChange={e=>setUserName(e.target.value)} placeholder="例:田中" style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.text,padding:"10px 14px",fontSize:14}}/>
          </div>
          <button onClick={()=>{T("tap");setScreen("ranking");}} style={{width:"100%",padding:"14px 0",background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,border:"none",borderRadius:14,color:"#fff",fontSize:14,fontWeight:700}}>セッションを始める →</button>
          {history.length>0&&<button onClick={()=>{T("tap");setScreen("history");}} style={{width:"100%",padding:"10px 0",marginTop:10,background:"transparent",border:`1px solid ${C.border}`,borderRadius:12,color:C.textSub,fontSize:12}}>📊 過去の記録を見る（{history.length}件）</button>}
        </div>
      )}

      {/* ランキング */}
      {screen==="ranking"&&(
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 40px",animation:"fadeUp 0.4s ease"}}>
          <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:6}}>価値観ランキング</div>
          <div style={{fontSize:12,color:C.textSub,marginBottom:14,lineHeight:1.8}}>大切なものを<span style={{color:C.gold,fontWeight:600}}>上位5つ</span>選んでください。（{rankings.length}/5）</div>
          {VALUES.map(v=>{
            const rank=rankings.indexOf(v.id)+1;
            const sel=rank>0;
            return(
              <div key={v.id} onClick={()=>toggleRank(v.id)} style={{padding:"12px 14px",borderRadius:12,border:`1px solid ${sel?C.borderActive:C.border}`,background:sel?C.goldBg:C.surface2,cursor:"pointer",display:"flex",alignItems:"center",gap:12,position:"relative",marginBottom:8}}>
                {sel&&<div style={{position:"absolute",top:-8,right:-8,width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{rank}</div>}
                <div style={{fontSize:20,flexShrink:0}}>{v.icon}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:sel?700:500,color:sel?C.goldDim:C.text,marginBottom:2}}>{v.label}</div><div style={{fontSize:10,color:C.textSub}}>{v.desc}</div></div>
              </div>
            );
          })}
          <div style={{height:14}}/>
          <button onClick={()=>{if(rankings.length===5){T("tap");setScreen("questions");}}} style={{width:"100%",padding:"13px 0",background:rankings.length===5?`linear-gradient(135deg,${C.gold},${C.goldDim})`:C.surface3,border:"none",borderRadius:14,color:rankings.length===5?"#fff":C.textMuted,fontSize:14,fontWeight:700}}>
            {rankings.length===5?"次へ →":`あと${5-rankings.length}つ選んでください`}
          </button>
        </div>
      )}

      {/* 問い */}
      {screen==="questions"&&(
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 40px",animation:"fadeUp 0.4s ease"}}>
          <div style={{fontSize:10,color:C.gold,fontWeight:600,marginBottom:4}}>問い {step+1} / {QUESTIONS.length}</div>
          <div style={{height:4,background:C.border,borderRadius:2,marginBottom:16}}>
            <div style={{height:"100%",width:`${(step/QUESTIONS.length)*100}%`,background:`linear-gradient(90deg,${C.gold},${C.goldDim})`,borderRadius:2,transition:"width 0.5s"}}/>
          </div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:14}}>
            <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:8}}>{Q.title}</div>
            <div style={{fontSize:14,color:C.text,lineHeight:1.9,marginBottom:12}}>{Q.q}</div>
            <div style={{fontSize:11,color:C.textSub,fontStyle:"italic",padding:"8px 12px",background:C.goldLight,borderRadius:8}}>💡 {Q.hint}</div>
          </div>
          <textarea value={curAns} onChange={e=>setCurAns(e.target.value)} placeholder="ここに回答を入力してください..." rows={5}
            style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,color:C.text,padding:"12px 14px",fontSize:13,resize:"none",lineHeight:1.8,fontFamily:"sans-serif",marginBottom:12}}/>
          <button onClick={submitAnswer} disabled={!curAns.trim()} style={{width:"100%",padding:"13px 0",background:curAns.trim()?`linear-gradient(135deg,${C.gold},${C.goldDim})`:C.surface3,border:"none",borderRadius:14,color:curAns.trim()?"#fff":C.textMuted,fontSize:14,fontWeight:700}}>
            {step<QUESTIONS.length-1?"次の問いへ →":"分析を生成する ✦"}
          </button>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            {step>0&&<button onClick={()=>{T("tap");setStep(s=>s-1);setCurAns("");}} style={{flex:1,padding:"9px 0",background:"transparent",border:"none",color:C.textMuted,fontSize:12}}>← 前へ</button>}
            <button onClick={resetAll} style={{flex:1,padding:"9px 0",background:"transparent",border:"none",color:C.textMuted,fontSize:12}}>🏠 ホームへ</button>
          </div>
        </div>
      )}

      {/* 結果 */}
      {screen==="result"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.surface,flexShrink:0}}>
            {["chat","chart"].map(t=>(
              <button key={t} onClick={()=>{T("tap");setTab(t);}} style={{flex:1,padding:"10px 0",background:"transparent",border:"none",borderBottom:`2.5px solid ${tab===t?C.gold:"transparent"}`,color:tab===t?C.gold:C.textMuted,fontSize:12,fontWeight:tab===t?700:400}}>
                {t==="chat"?"💬 AI分析":"📊 チャート"}
              </button>
            ))}
          </div>
          {tab==="chat"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
              <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
                {msgs.map((m,i)=><Bubble key={i} text={m.text} isUser={m.role==="user"}/>)}
                {loading&&<Dots/>}
                <div ref={bottomRef}/>
              </div>
              {analysisOk&&(
                <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,background:C.surface,flexShrink:0}}>
                  <div style={{display:"flex",gap:6,marginBottom:8}}>
                    <button onClick={()=>copyResult(`【価値観発掘コンサル】\n実施日:${new Date().toLocaleDateString("ja-JP")}\n${userName?`対象者:${userName}\n`:""}\n■TOP5\n${rankings.slice(0,5).map((id,i)=>`${i+1}位:${VALUES.find(v=>v.id===id)?.label}`).join("\n")}\n\n■AI分析\n${analysisText}`)} style={{flex:1,padding:"8px 0",background:copied?C.greenLight:C.surface2,border:`1px solid ${copied?C.green:C.border}`,borderRadius:8,color:copied?C.green:C.textSub,fontSize:11,fontWeight:copied?700:400}}>{copied?"✅コピー済":"📋コピー"}</button>
                    <button onClick={()=>toggleSpeak(analysisText)} style={{flex:1,padding:"8px 0",background:isSpeaking?C.greenLight:C.surface2,border:`1px solid ${isSpeaking?C.green:C.border}`,borderRadius:8,color:isSpeaking?C.green:C.textSub,fontSize:11}}>{isSpeaking?"⏹停止":"🔈読上"}</button>
                    <button onClick={resetAll} style={{flex:1,padding:"8px 0",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,fontSize:11}}>🏠ホーム</button>
                    <button onClick={resetAll} style={{flex:1,padding:"8px 0",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:8,color:C.textSub,fontSize:11}}>🔄再度</button>
                  </div>
                  <button onClick={generatePerspective} disabled={perspLoading} style={{width:"100%",padding:"10px 0",marginBottom:8,background:perspDone?C.surface2:`linear-gradient(135deg,#3a6a8a,#1a4a6a)`,border:`1px solid ${perspDone?C.border:"transparent"}`,borderRadius:10,color:perspDone?C.textSub:"#fff",fontSize:12,fontWeight:700}}>
                    {perspLoading?"👥 他者視点で分析中...":perspDone?"👥 他者視点（再生成）":"👥 他者視点で見る"}
                  </button>
                  <div style={{display:"flex",gap:8}}>
                    <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}} placeholder="さらに深く掘り下げたいことを..." rows={2}
                      style={{flex:1,background:C.surface2,border:`1.5px solid ${C.border}`,borderRadius:12,color:C.text,padding:"9px 12px",fontSize:13,resize:"none",lineHeight:1.5,fontFamily:"sans-serif"}}/>
                    <button style={{width:44,height:44,borderRadius:12,background:chatInput.trim()&&!loading?`linear-gradient(135deg,${C.gold},${C.goldDim})`:C.surface3,border:"none",color:"#fff",fontSize:20,alignSelf:"flex-end"}} onClick={()=>{if(chatInput.trim()&&!loading){if (tapOnRef.current) T("send");sendChat();}}}>↑</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {tab==="chart"&&(
            <div style={{flex:1,overflowY:"auto",padding:"16px 16px 40px"}}>
              {rankings.length>=5?<RadarChart rankings={rankings}/>:<div style={{textAlign:"center",padding:40,color:C.textMuted,fontSize:13}}>5つ選ぶとチャートが表示されます</div>}
              {analysisOk&&(
                <div style={{marginTop:8}}>
                  <div style={{display:"flex",gap:6,marginBottom:6}}>
                    <button onClick={()=>copyResult(`【価値観発掘コンサル】\n${new Date().toLocaleDateString("ja-JP")}\n\n${analysisText}`)} style={{flex:1,padding:"11px 0",background:copied?C.greenLight:C.surface2,border:`1px solid ${copied?C.green:C.border}`,borderRadius:12,color:copied?C.green:C.textSub,fontSize:11}}>{copied?"✅コピー済":"📋コピー"}</button>
                    <button onClick={()=>toggleSpeak(analysisText)} style={{flex:1,padding:"11px 0",background:isSpeaking?C.greenLight:C.surface2,border:`1px solid ${isSpeaking?C.green:C.border}`,borderRadius:12,color:isSpeaking?C.green:C.textSub,fontSize:11}}>{isSpeaking?"⏹停止":"🔈読上"}</button>
                    <button onClick={resetAll} style={{flex:1,padding:"11px 0",background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,border:"none",borderRadius:12,color:"#fff",fontSize:11,fontWeight:700}}>🔄再度</button>
                  </div>
                  <button onClick={generatePerspective} disabled={perspLoading} style={{width:"100%",padding:"10px 0",background:perspDone?C.surface2:`linear-gradient(135deg,#3a6a8a,#1a4a6a)`,border:`1px solid ${perspDone?C.border:"transparent"}`,borderRadius:10,color:perspDone?C.textSub:"#fff",fontSize:12,fontWeight:700}}>
                    {perspLoading?"👥 他者視点で分析中...":perspDone?"👥 他者視点（再生成）":"👥 他者視点で見る"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 履歴一覧 */}
      {screen==="history"&&!selH&&(
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 40px"}}>
          <div style={{fontSize:15,fontWeight:700,color:C.gold,marginBottom:14}}>📊 セッション履歴</div>
          {history.length===0
            ?<div style={{textAlign:"center",padding:40,color:C.textMuted,fontSize:13}}>まだ履歴がありません</div>
            :(
              <>
                <div style={{fontSize:11,color:C.textMuted,marginBottom:8}}>👆 タップすると詳細を確認できます</div>
                {history.map((h,i)=>(
                  <div key={i} onClick={()=>{T("tap");setSelH(h);}} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <div style={{fontSize:12,color:C.gold,fontWeight:600}}>{h.userName}</div>
                      <div style={{fontSize:11,color:C.textMuted}}>{h.date} ›</div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>
                      {h.top3.map((lbl,j)=>(
                        <div key={j} style={{fontSize:10,padding:"3px 8px",background:C.goldBg,border:`1px solid ${C.borderActive}`,borderRadius:10,color:C.gold}}>{["1st","2nd","3rd"][j]} {lbl}</div>
                      ))}
                    </div>
                    <div style={{fontSize:11,color:C.textSub}}>{h.analysis?.slice(0,60)}...</div>
                  </div>
                ))}
                <button onClick={deleteAll} style={{width:"100%",padding:"10px 0",marginTop:6,background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,color:C.textMuted,fontSize:11}}>🗑 履歴を全削除</button>
              </>
            )
          }
          <button onClick={resetAll} style={{width:"100%",padding:"12px 0",marginTop:12,background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,border:"none",borderRadius:12,color:"#fff",fontSize:13,fontWeight:700}}>🏠 ホームへ</button>
        </div>
      )}

      {/* 履歴詳細 */}
      {screen==="history"&&selH&&(
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 40px"}}>
          <div style={{fontSize:11,color:C.textMuted,marginBottom:12}}>{selH.date} のセッション</div>

          {/* タブ */}
          <div style={{display:"flex",gap:4,marginBottom:14,background:C.surface2,borderRadius:10,padding:3}}>
            {["chart","analysis"].map(t=>(
              <button key={t} onClick={()=>{T("tap");setTab(t);}} style={{flex:1,padding:"8px 0",background:tab===t?C.surface:"transparent",border:"none",borderRadius:8,color:tab===t?C.gold:C.textMuted,fontSize:12,fontWeight:tab===t?700:400}}>
                {t==="chart"?"📊 チャート":"💬 AI分析"}
              </button>
            ))}
          </div>

          {/* チャートタブ */}
          {tab==="chart"&&(
            selH.rankings&&selH.rankings.length>=5
              ?<RadarChart rankings={selH.rankings}/>
              :<div style={{textAlign:"center",padding:30,color:C.textMuted,fontSize:12}}>この履歴にはチャートデータがありません</div>
          )}

          {/* 分析タブ */}
          {tab==="analysis"&&(
            <>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:12}}>
                <div style={{fontSize:12,color:C.textSub,fontWeight:600,marginBottom:8}}>TOP3 価値観</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {selH.top3.map((lbl,j)=>(
                    <div key={j} style={{fontSize:11,padding:"5px 12px",background:C.goldBg,border:`1px solid ${C.borderActive}`,borderRadius:12,color:C.gold,fontWeight:600}}>{["1st","2nd","3rd"][j]} {lbl}</div>
                  ))}
                </div>
              </div>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:14}}>
                <div style={{fontSize:12,color:C.textSub,fontWeight:600,marginBottom:8}}>AI分析結果</div>
                <div style={{fontSize:12,color:C.text,lineHeight:1.9,whiteSpace:"pre-wrap"}}>{selH.analysis}</div>
              </div>
            </>
          )}

          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button onClick={()=>copyResult(`【価値観発掘コンサル】${selH.date}\nTOP3:${selH.top3.join(" / ")}\n\n${selH.analysis}`)} style={{flex:1,padding:"12px 0",background:copied?C.greenLight:C.surface,border:`1px solid ${copied?C.green:C.border}`,borderRadius:12,color:copied?C.green:C.textSub,fontSize:12,fontWeight:copied?700:400}}>
              {copied?"✅コピー済":"📋コピー"}
            </button>
            <button onClick={()=>{T("tap");setSelH(null);setTab("chat");}} style={{flex:1,padding:"12px 0",background:`linear-gradient(135deg,${C.gold},${C.goldDim})`,border:"none",borderRadius:12,color:"#fff",fontSize:12,fontWeight:700}}>← 一覧へ</button>
          </div>
        </div>
      )}
    </div>
  );
}
