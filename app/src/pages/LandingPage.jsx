import React from "react";

/* ── tiny helpers ── */
const P = ({children,bg="#fff",c="#555",b="1px solid #ddd",fw=400,fs=11})=>(<span style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:20,fontSize:fs,fontWeight:fw,whiteSpace:"nowrap",background:bg,color:c,border:b,lineHeight:1.3}}>{children}</span>);
const Sk = ({w="100%",h=10})=><div style={{width:w,height:h,background:"#e5e5e5",borderRadius:999}}/>;

const iP=["M3 12l9-9 9 9M4.5 10.5V19.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5h3v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75V10.5","M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0","M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z","M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894zM15 12a3 3 0 11-6 0 3 3 0 016 0z","M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"];
const SB=({h})=>(<div style={{width:36,background:"rgba(248,249,250,0.6)",borderRight:"1px solid rgba(230,232,236,0.5)",display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0",gap:14,borderRadius:"14px 0 0 14px",flexShrink:0,height:h||"auto"}}>{iP.map((d,i)=><svg key={i} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#bbb" width="15" height="15"><path strokeLinecap="round" strokeLinejoin="round" d={d}/></svg>)}</div>);

const Donut=()=>{const r=38,cx=46,cy=46,C=2*Math.PI*r,d=C*0.87;return<svg width="92" height="92" viewBox="0 0 92 92" style={{display:"block",margin:"4px auto 8px"}}><defs><linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FF6B35"/><stop offset="100%" stopColor="#E84545"/></linearGradient></defs><circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0F0F0" strokeWidth="7"/><circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#dg)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${d} ${C-d}`} strokeDashoffset={C*0.25} transform={`rotate(-90 ${cx} ${cy})`}/><text x={cx} y={cy-3} textAnchor="middle" fontSize="18" fontWeight="800" fill="#111">87%</text><text x={cx} y={cy+11} textAnchor="middle" fontSize="9" fill="#999">match</text></svg>};

/* ── glass card base style ── */
const glass={background:"rgba(255,255,255,0.72)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.5)",boxShadow:"0 8px 32px rgba(0,0,0,0.08)"};

export default function LandingPage(){
  return(
    <div style={{width:"100%",position:"relative",overflow:"hidden",fontFamily:"'Inter',sans-serif",background:"linear-gradient(160deg,#fdf6ef 0%,#eef1fb 40%,#e8ecf8 70%,#f0ecf9 100%)"}}>
      {/* ambient blobs */}
      <div style={{position:"absolute",top:"-10%",left:"-8%",width:"40%",height:"40%",background:"rgba(255,237,213,0.6)",borderRadius:"50%",filter:"blur(90px)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"12%",right:"-8%",width:"40%",height:"40%",background:"rgba(214,221,255,0.6)",borderRadius:"50%",filter:"blur(90px)",pointerEvents:"none"}}/>

      {/* ════════ HERO ════════ */}
      <section style={{maxWidth:1200,margin:"0 auto",padding:"60px 40px 0",display:"flex",alignItems:"flex-start",gap:40,minHeight:"calc(100vh - 72px)",position:"relative",zIndex:10}}>
        {/* left copy */}
        <div style={{width:"38%",flexShrink:0,paddingTop:60}}>
          <p style={{fontSize:11,fontWeight:600,letterSpacing:"0.18em",color:"#C0613A",marginBottom:12,textTransform:"uppercase"}}>Intelligent Recruitment</p>
          <h1 style={{fontSize:48,fontWeight:800,color:"#111",lineHeight:1.08,letterSpacing:"-0.03em",margin:"0 0 18px"}}>Hiring, without<br/>the guesswork.</h1>
          <p style={{fontSize:14,color:"#666",lineHeight:1.7,maxWidth:360,marginBottom:32}}>Transform your recruitment process with intelligent models that understand skills, experience, and candidate potential.</p>
          <div style={{display:"flex",gap:12}}>
            <a href="/register" style={{display:"inline-flex",alignItems:"center",gap:8,background:"#111",color:"#fff",borderRadius:8,padding:"12px 24px",fontSize:13,fontWeight:600,textDecoration:"none",boxShadow:"0 4px 14px rgba(0,0,0,0.1)"}}>Get Started <span>→</span></a>
            <a href="/login" style={{...glass,color:"#333",borderRadius:8,padding:"11px 24px",fontSize:13,fontWeight:500,textDecoration:"none"}}>Sign In</a>
          </div>
        </div>

        {/* right cards — overlap zone */}
        <div style={{flex:1,position:"relative",height:480,marginTop:10}}>
          {/* Match Score — center-left */}
          <div className="animate-float-slow" style={{...glass,position:"absolute",left:0,top:30,width:280,display:"flex",borderRadius:16,overflow:"hidden",zIndex:10}}>
            <SB/>
            <div style={{flex:1,padding:"12px 14px",display:"flex",flexDirection:"column"}}>
              <p style={{fontSize:14,fontWeight:600,color:"#111",margin:"0 0 2px"}}>Match Score</p>
              <Donut/>
              <p style={{fontSize:12,fontWeight:600,color:"#111",margin:"0 0 6px"}}>Skills tags</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                <P bg="#111" c="#fff" b="none" fw={600}>Python</P>
                <P>Machine Learning</P>
                <P>Strategic Planning</P>
                <P>Strategic Planning</P>
              </div>
              <span style={{fontSize:10,color:"#999",marginTop:5}}>More…</span>
            </div>
          </div>

          {/* Resume Parsing — right, overlapping */}
          <div className="animate-float-delayed" style={{...glass,position:"absolute",right:"-3%",top:-10,width:340,borderRadius:16,overflow:"hidden",zIndex:5}}>
            <div style={{padding:"10px 14px 6px",borderBottom:"1px solid rgba(255,255,255,0.35)"}}>
              <p style={{fontSize:13,fontWeight:600,color:"#111",margin:0}}>Resume Parsing Visualization</p>
            </div>
            <div style={{padding:"8px 14px",display:"flex",flexWrap:"wrap",gap:"4px 6px",alignItems:"center"}}>
              <span style={{fontSize:9,color:"#999"}}>Keyword</span>
              <P bg="#F4A261" c="#fff" b="none" fw={700} fs={10}>Machine Learning</P>
              <span style={{fontSize:9,color:"#999"}}>Personalization</span>
              <span style={{fontSize:9,color:"#999"}}>Correlations &amp; development</span>
              <span style={{fontSize:9,color:"#999"}}>Company experience</span>
              <P bg="#B0BEC5" c="#fff" b="none" fw={600} fs={10}>Python</P>
              <span style={{fontSize:9,color:"#999"}}>Machine Keywords</span>
              <P bg="#F4A261" c="#fff" b="none" fw={600} fs={10}>Strategic Planning</P>
              <span style={{fontSize:9,color:"#999"}}>Statement operators &amp; learning</span>
              <P bg="#1A1A2E" c="#fff" b="none" fw={600} fs={10}>Strategic Planning</P>
              <span style={{fontSize:9,color:"#999"}}>Concurrent growth</span>
              <span style={{fontSize:9,color:"#999"}}>Model-driven computing</span>
            </div>
            <div style={{padding:"6px 14px 12px",borderTop:"1px solid rgba(255,255,255,0.35)"}}>
              <p style={{fontSize:12,fontWeight:600,color:"#111",margin:"0 0 5px"}}>Skills</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                {["Python","Machine Learning","PyTorch","Deep Learning","NLP","Strategic Forecasting","Data Science","Encoding"].map((t,i)=>(<span key={i} style={{padding:"2px 6px",borderRadius:6,fontSize:9,border:"1px solid rgba(0,0,0,0.06)",background:"rgba(255,255,255,0.55)",color:"#555"}}>{t}</span>))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ SHOWCASE 3-COL ════════ */}
      <section style={{maxWidth:1200,margin:"0 auto",padding:"0 40px 40px",position:"relative",zIndex:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,alignItems:"center"}}>

          {/* Col 1 — Resume */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",position:"relative",height:420}}>
            <div className="animate-float-slow" style={{width:220,background:"#fff",boxShadow:"-3px 0 0 #d4d4d4,-6px 0 0 #e5e5e5,0 14px 44px rgba(0,0,0,0.14)",borderRadius:6,transform:"perspective(700px) rotateY(10deg) rotateX(4deg)",padding:"18px 16px",position:"relative",zIndex:5}}>
              <p style={{fontSize:16,fontWeight:700,color:"#333",margin:"0 0 6px"}}>Resume</p>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}>
                <div style={{width:22,height:22,background:"#ddd",borderRadius:"50%",flexShrink:0}}/>
                <div><div style={{fontWeight:600,fontSize:8,color:"#333"}}>Sarah Martinez</div><div style={{fontSize:7,color:"#999"}}>+1 (555) 234-5678</div><div style={{fontSize:7,color:"#999"}}>sarah.m@example.com</div></div>
              </div>
              {[{h:"Experience",t:"Senior ML Engineer at TechCorp"},{h:"Skills",t:"Machine Learning · Strategic Planning · Data Analysis"},{h:"Education",t:"M.S. Computer Science, Stanford"}].map((s,i)=>(<div key={i} style={{marginBottom:6}}><p style={{fontWeight:700,fontSize:8,color:"#444",margin:"0 0 1px",textTransform:"uppercase",letterSpacing:"0.04em"}}>{s.h}</p><p style={{fontSize:7,color:"#999",margin:0,lineHeight:1.4}}>{s.t}</p></div>))}
            </div>
            <div className="animate-float-fast" style={{...glass,position:"absolute",top:"12%",right:"6%",padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:700,color:"#111",zIndex:15}}>5+ Yrs Exp.</div>
            <div className="animate-float-delayed" style={{...glass,position:"absolute",bottom:"18%",right:"2%",padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:700,color:"#111",zIndex:15}}>5+ Yrs Exp.</div>
          </div>

          {/* Col 2 — Tag Cloud */}
          <div style={{position:"relative",height:420}}>
            {[
              {l:"Python",x:"20%",y:"2%",bg:"#B0BEC5",c:"#fff"},
              {l:"Machine Learning",x:"8%",y:"17%",bg:"rgba(255,255,255,0.7)",c:"#555"},
              {l:"Strategic Planning",x:"22%",y:"32%",bg:"rgba(255,255,255,0.7)",c:"#555"},
              {l:"Strategic Planning",x:"4%",y:"46%",bg:"rgba(255,255,255,0.7)",c:"#555"},
              {l:"Coverage Tracking",x:"24%",y:"58%",bg:"rgba(255,255,255,0.7)",c:"#555"},
              {l:"Highlighted",x:"10%",y:"70%",bg:"#F4A261",c:"#fff"},
              {l:"Keywords",x:"26%",y:"82%",bg:"rgba(255,255,255,0.7)",c:"#555"},
              {l:"5+ Yrs Exp.",x:"50%",y:"52%",bg:"#111",c:"#fff"},
            ].map((t,i)=>(
              <span key={i} className={["animate-float-slow","animate-float-fast","animate-float-delayed"][i%3]} style={{position:"absolute",left:t.x,top:t.y,padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:500,whiteSpace:"nowrap",color:t.c,background:t.bg,backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.45)",boxShadow:"0 4px 16px rgba(0,0,0,0.06)"}}>{t.l}</span>
            ))}
          </div>

          {/* Col 3 — Dashboard */}
          <div style={{position:"relative",height:420}}>
            <div className="animate-float-slow" style={{...glass,position:"absolute",left:0,top:0,width:230,height:360,display:"flex",borderRadius:16,overflow:"hidden"}}>
              <SB h={360}/>
              <div style={{flex:1,padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
                <Sk/><Sk w="80%"/><Sk/><Sk w="70%"/><Sk/><Sk w="60%"/><Sk/><Sk w="75%"/>
                <div style={{marginTop:"auto"}}><button style={{width:"100%",color:"#fff",fontSize:11,fontWeight:600,padding:"6px 0",borderRadius:18,background:"#111",border:"none",cursor:"pointer"}}>Job Overview</button></div>
              </div>
            </div>
            <div className="animate-float-delayed" style={{...glass,position:"absolute",left:110,top:150,width:220,borderRadius:14,padding:"10px 12px",background:"rgba(255,255,255,0.9)",zIndex:20}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><div style={{display:"flex",flexDirection:"column",gap:2}}><Sk w="70px" h={5}/><Sk w="50px" h={5}/></div><span style={{color:"#aaa",fontSize:14}}>⋮</span></div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:3}}>
                {["Experience","Education","Recommendations"].map((t,i)=>(<span key={i} style={{padding:"1px 6px",borderRadius:6,fontSize:8,border:"1px solid rgba(0,0,0,0.05)",background:"rgba(255,255,255,0.5)",color:"#555"}}>{t}</span>))}
              </div>
              <div style={{borderTop:"1px solid rgba(0,0,0,0.05)",margin:"4px 0"}}/>
              <p style={{fontSize:12,fontWeight:600,color:"#111",margin:"0 0 3px"}}>AI Feedback Panel</p>
              <p style={{fontSize:10,color:"#777",margin:"0 0 1px"}}>- Add more project experience</p>
              <p style={{fontSize:10,color:"#777",margin:0}}>- Improve skill keywords</p>
            </div>
            <div className="animate-float-fast animate-pulse-glow" style={{position:"absolute",right:-5,top:6,width:56,height:110,background:"linear-gradient(135deg,#6C63FF,#4F46E5)",borderRadius:12,boxShadow:"0 8px 28px rgba(108,99,255,0.3)",padding:"8px 6px",zIndex:15}}>
              <p style={{color:"#fff",fontSize:6,fontWeight:600,margin:0}}>AI Pulse</p>
              <p style={{color:"rgba(255,255,255,0.7)",fontSize:6,margin:"2px 0 0"}}>App Portal</p>
            </div>
          </div>
        </div>
      </section>

      {/* scroll hint */}
      <div style={{display:"flex",justifyContent:"center",padding:"20px 0 48px"}}>
        <div className="animate-bounce" style={{...glass,width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#555",cursor:"pointer"}}>↓</div>
      </div>

      {/* ════════ FEATURES ════════ */}
      <section style={{maxWidth:1200,margin:"0 auto",padding:"60px 40px 80px",position:"relative",zIndex:10}}>
        <span style={{fontSize:11,fontWeight:600,letterSpacing:"0.18em",color:"#C0613A",textTransform:"uppercase"}}>FEATURES</span>
        <h2 style={{fontSize:40,fontWeight:800,color:"#111",lineHeight:1.1,margin:"8px 0 40px",letterSpacing:"-0.03em"}}>Built for precision.</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
          {[
            {n:"01",t:"Resume Skill Extraction",d:"AI-powered analysis that automatically extracts and categorizes skills from resumes with high accuracy."},
            {n:"02",t:"AI Candidate Ranking",d:"Intelligent ranking system using BERT, TF-IDF, and XGBoost models to find the best candidates."},
            {n:"03",t:"Model Comparison",d:"Compare different AI models side-by-side to understand their predictions and confidence scores."},
            {n:"04",t:"Skill Gap Analysis",d:"Identify missing skills and get personalized learning recommendations for career growth."},
            {n:"05",t:"Fast Processing",d:"Process hundreds of resumes in seconds with our optimized NLP pipeline."},
            {n:"06",t:"Team Collaboration",d:"Share job postings and candidate shortlists with your hiring team seamlessly."},
          ].map((f,i)=>(
            <div key={i} style={{...glass,padding:"24px 20px",borderRadius:14,transition:"transform .3s,box-shadow .3s",cursor:"default"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(0,0,0,0.1)"}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.08)"}}>
              <span style={{fontSize:24,fontWeight:800,color:"rgba(0,0,0,0.07)",display:"block",marginBottom:10}}>{f.n}</span>
              <h3 style={{fontSize:15,fontWeight:700,color:"#111",margin:"0 0 6px"}}>{f.t}</h3>
              <p style={{fontSize:12,color:"#666",lineHeight:1.6,margin:0}}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section style={{maxWidth:1200,margin:"0 auto",padding:"0 40px 80px",position:"relative",zIndex:10}}>
        <h2 style={{fontSize:40,fontWeight:800,color:"#111",lineHeight:1.1,margin:"0 0 40px",letterSpacing:"-0.03em"}}>How it works</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
          {[
            {n:"01",t:"Upload Resume",d:"Candidates upload their resumes in PDF format."},
            {n:"02",t:"AI Analysis",d:"Our NLP pipeline extracts skills and analyzes experience."},
            {n:"03",t:"Get Matched",d:"Find the perfect job or ideal candidates instantly."},
          ].map((s,i)=>(
            <div key={i} style={{...glass,padding:"28px 20px",borderRadius:14,textAlign:"center"}}>
              <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:44,height:44,borderRadius:10,background:"#111",color:"#fff",fontSize:15,fontWeight:700,marginBottom:14}}>{s.n}</span>
              <h3 style={{fontSize:15,fontWeight:700,color:"#111",margin:"0 0 6px"}}>{s.t}</h3>
              <p style={{fontSize:12,color:"#666",lineHeight:1.6,margin:0}}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ CTA ════════ */}
      <section style={{maxWidth:1200,margin:"0 auto",padding:"0 40px 80px",position:"relative",zIndex:10}}>
        <div style={{padding:"56px 40px",borderRadius:20,textAlign:"center",background:"rgba(17,17,17,0.95)",border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
          <h2 style={{fontSize:32,fontWeight:800,color:"#fff",margin:"0 0 10px"}}>Ready to transform your hiring?</h2>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.55)",maxWidth:440,margin:"0 auto 24px"}}>Join thousands of companies using IntelliHire to find the perfect candidates faster.</p>
          <a href="/register" style={{display:"inline-flex",alignItems:"center",gap:8,background:"#fff",color:"#111",borderRadius:8,padding:"12px 24px",fontSize:13,fontWeight:600,textDecoration:"none"}}>Get Started Free →</a>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer style={{maxWidth:1200,margin:"0 auto",padding:"32px 40px 24px",position:"relative",zIndex:10,borderTop:"1px solid rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:24,marginBottom:24}}>
          <div><span style={{fontSize:15,fontWeight:700,color:"#111"}}>IntelliHire</span><p style={{fontSize:11,color:"#999",maxWidth:220,margin:"6px 0 0"}}>AI-powered recruitment platform for modern hiring teams.</p></div>
          <div style={{display:"flex",gap:40}}>
            {[{h:"Product",l:["Features","Pricing"]},{h:"Company",l:["About","Contact"]}].map((c,i)=>(<div key={i}><h4 style={{fontSize:11,fontWeight:600,color:"#111",margin:"0 0 6px"}}>{c.h}</h4>{c.l.map((x,j)=><a key={j} href="/" style={{display:"block",fontSize:11,color:"#999",textDecoration:"none",marginBottom:3}}>{x}</a>)}</div>))}
          </div>
        </div>
        <p style={{fontSize:10,color:"#ccc",textAlign:"center",margin:0}}>© 2026 IntelliHire. All rights reserved.</p>
      </footer>
    </div>
  );
}
