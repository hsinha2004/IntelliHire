import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

const stagger = (sc=0.1,dc=0) => ({ hidden:{}, show:{ transition:{ staggerChildren:sc, delayChildren:dc }}});
const fadeUp = { hidden:{ opacity:0, y:24 }, show:{ opacity:1, y:0, transition:{ duration:0.6, ease:[0.16,1,0.3,1] }}};
const scalePop = { hidden:{ opacity:0, scale:0.5 }, show:{ opacity:1, scale:1, transition:{ type:"spring", stiffness:260, damping:20 }}};

const glass = { background:"rgba(255,255,255,0.85)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.9)", boxShadow:"0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)", borderRadius:20 };

const P = ({children,bg="#fff",c="#555",b="1px solid #e0e0e0",fw=500,fs=12}) => (
  <span style={{display:"inline-flex",alignItems:"center",padding:"4px 12px",borderRadius:9999,fontSize:fs,fontWeight:fw,whiteSpace:"nowrap",background:bg,color:c,border:b,lineHeight:1.3}}>{children}</span>
);

const Donut = () => {
  const r=40, cx=50, cy=50, C=2*Math.PI*r;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" style={{display:"block",margin:"4px auto 8px"}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e5e5" strokeWidth="8"/>
      <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke="#E8521A" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={C} initial={{strokeDashoffset:C}} animate={{strokeDashoffset:C-(0.87*C)}}
        transition={{duration:1.4,ease:[0.16,1,0.3,1],delay:0.5}}
        style={{transform:"rotate(-90deg)",transformOrigin:"center"}}/>
      <text x={cx} y={cy-3} textAnchor="middle" fontSize="22" fontWeight="800" fill="#1a1a1a">87%</text>
      <text x={cx} y={cy+11} textAnchor="middle" fontSize="11" fill="rgba(0,0,0,0.4)">match</text>
    </svg>
  );
};

function Section2() {
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-80px" });
  const { scrollYProgress } = useScroll({ target:ref, offset:["start end","end start"] });
  const yResume = useTransform(scrollYProgress, [0,1], [60,-60]);
  const yBubbles = useTransform(scrollYProgress, [0,1], [30,-30]);
  const yCards = useTransform(scrollYProgress, [0,1], [50,-50]);

  const bubbles = [
    {l:"Python",x:"32%",y:"18%",bg:"rgba(155,142,196,0.15)",border:"rgba(155,142,196,0.3)",c:"#555"},
    {l:"Machine Learning",x:"40%",y:"28%",bg:"white",border:"rgba(0,0,0,0.1)",c:"#555"},
    {l:"Strategic Planning",x:"30%",y:"38%",bg:"white",border:"rgba(0,0,0,0.1)",c:"#555"},
    {l:"Strategic Planning",x:"42%",y:"48%",bg:"white",border:"rgba(0,0,0,0.1)",c:"#555"},
    {l:"Coverage Tracking",x:"34%",y:"56%",bg:"white",border:"rgba(0,0,0,0.1)",c:"#555"},
    {l:"Highlighted",x:"38%",y:"65%",bg:"rgba(232,82,26,0.12)",border:"rgba(232,82,26,0.25)",c:"#E8521A"},
    {l:"Keywords",x:"44%",y:"74%",bg:"white",border:"rgba(0,0,0,0.1)",c:"#555"},
    {l:"5+ Yrs Exp.",x:"46%",y:"40%",bg:"white",border:"rgba(0,0,0,0.12)",c:"#111"},
    {l:"5+ Yrs Exp.",x:"50%",y:"58%",bg:"white",border:"rgba(0,0,0,0.12)",c:"#111"},
  ];

  /* 3D Cube helper */
  const Cube = ({label,x,y,delay=0,color="#E8521A"}) => (
    <motion.div style={{position:"absolute",left:x,top:y,width:44,height:44,willChange:"transform",zIndex:8}}
      initial={{opacity:0,scale:0}} animate={inView?{opacity:1,scale:1}:{}} transition={{delay,type:"spring",stiffness:200,damping:15}}>
      <motion.div animate={{y:[0,-10,0],rotateY:[0,15,0]}} transition={{duration:4+delay,repeat:Infinity,ease:"easeInOut"}}
        style={{width:44,height:44,position:"relative",transformStyle:"preserve-3d",transform:"perspective(400px) rotateX(-15deg) rotateY(20deg)"}}>
        {/* front */}
        <div style={{position:"absolute",width:44,height:44,background:`linear-gradient(135deg,${color},${color}dd)`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:"white",textAlign:"center",padding:4,boxShadow:`0 8px 20px ${color}40`,lineHeight:1.2}}>{label}</div>
        {/* right side */}
        <div style={{position:"absolute",width:12,height:44,background:`${color}bb`,borderRadius:"0 4px 4px 0",left:44,top:0,transform:"skewY(-30deg)",transformOrigin:"top left"}}/>
        {/* top face */}
        <div style={{position:"absolute",width:44,height:12,background:`${color}99`,borderRadius:"4px 4px 0 0",left:0,top:-10,transform:"skewX(-30deg)",transformOrigin:"bottom left"}}/>
      </motion.div>
    </motion.div>
  );

  return (
    <section ref={ref} style={{position:"relative",minHeight:"100vh",overflow:"hidden",perspective:1200}}>
      <div style={{maxWidth:1100,margin:"0 auto",position:"relative",height:"100vh"}}>

      {/* ── Detailed Resume Document ── */}
      <motion.div style={{position:"absolute",left:"2%",bottom:"10%",width:240,willChange:"transform",zIndex:5,y:yResume}}
        initial={{opacity:0,x:-60,rotateY:"30deg"}} animate={inView?{opacity:1,x:0,rotateY:"15deg"}:{}} transition={{duration:1,delay:0.2}}>
        <motion.div animate={{y:[0,-12,0],rotateZ:["-2deg","0deg","-2deg"]}} transition={{duration:6,repeat:Infinity,ease:"easeInOut"}}
          style={{position:"relative",transform:"perspective(800px) rotateY(12deg) rotateX(-8deg)"}}>
          {/* Page fold effect */}
          <div style={{position:"absolute",top:0,right:0,width:30,height:30,background:"linear-gradient(135deg,#e8e8e8 50%,#f5f5f5 50%)",zIndex:2}}/>
          {/* Main resume body */}
          <div style={{background:"white",borderRadius:"4px 0 4px 4px",padding:"22px 20px",boxShadow:"-3px 0 0 #d8d8d8,-6px 0 0 #e8e8e8,0 20px 60px rgba(0,0,0,0.18),0 6px 20px rgba(0,0,0,0.1)"}}>
            <p style={{fontSize:20,fontWeight:800,color:"#222",margin:"0 0 10px",letterSpacing:"-0.02em"}}>Resume</p>
            {/* Avatar + Contact */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:10,borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
              <div style={{width:36,height:36,background:"linear-gradient(135deg,#d0d0d0,#e8e8e8)",borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3.5-7 7-7s7 3 7 7"/></svg>
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:"#222"}}>Sarah Martinez</div>
                <div style={{fontSize:9,color:"rgba(0,0,0,0.4)"}}>+1 (555) 234-5678</div>
                <div style={{fontSize:9,color:"rgba(0,0,0,0.4)"}}>sarah.m@example.com</div>
              </div>
            </div>
            {/* Experience */}
            <p style={{fontWeight:800,fontSize:9,color:"rgba(0,0,0,0.35)",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.12em"}}>experience</p>
            <p style={{fontSize:11,color:"#333",margin:"0 0 2px",fontWeight:600}}>Senior ML Engineer at TechCorp</p>
            <p style={{fontSize:9,color:"rgba(0,0,0,0.4)",margin:"0 0 8px",lineHeight:1.5}}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.</p>
            {/* Skills with pills */}
            <p style={{fontWeight:800,fontSize:9,color:"rgba(0,0,0,0.35)",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:"0.12em"}}>skills</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
              {["Machine Learning","Python","PyTorch","Data Analysis"].map((s,i)=>(
                <span key={i} style={{padding:"2px 8px",borderRadius:4,fontSize:8,fontWeight:600,background:i<2?"rgba(232,82,26,0.1)":"rgba(0,0,0,0.04)",color:i<2?"#E8521A":"rgba(0,0,0,0.5)",border:`1px solid ${i<2?"rgba(232,82,26,0.2)":"rgba(0,0,0,0.08)"}`}}>{s}</span>
              ))}
            </div>
            {/* Skills second row */}
            <p style={{fontWeight:800,fontSize:9,color:"rgba(0,0,0,0.35)",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:"0.12em"}}>skills</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
              {["Machine Learning","Strategic Planning","Deep Learning"].map((s,i)=>(
                <span key={i} style={{padding:"2px 8px",borderRadius:4,fontSize:8,fontWeight:500,background:"rgba(0,0,0,0.03)",color:"rgba(0,0,0,0.5)",border:"1px solid rgba(0,0,0,0.06)"}}>{s}</span>
              ))}
            </div>
            {/* Education */}
            <p style={{fontWeight:800,fontSize:9,color:"rgba(0,0,0,0.35)",margin:"0 0 4px",textTransform:"uppercase",letterSpacing:"0.12em"}}>education</p>
            <p style={{fontSize:11,color:"#333",margin:"0 0 2px",fontWeight:600}}>Education Examples done at Stanford</p>
            <p style={{fontSize:9,color:"rgba(0,0,0,0.4)",margin:0,lineHeight:1.5}}>Lorem ipsum dolor sit amet, consectetur.</p>
          </div>
        </motion.div>
      </motion.div>

      {/* ── 3D Floating Cubes ── */}
      <Cube label="5+" x="24%" y="32%" delay={0.3} color="#9b8ec4"/>
      <Cube label="ML" x="32%" y="50%" delay={0.5} color="#E8521A"/>
      <Cube label="AI" x="22%" y="55%" delay={0.7} color="#333"/>

      {/* ── Skill Bubbles ── */}
      <motion.div style={{position:"absolute",inset:0,y:yBubbles}}>
        {bubbles.map((b,i) => (
          <motion.span key={i} style={{position:"absolute",left:b.x,top:b.y,padding:"8px 18px",borderRadius:9999,fontSize:13,fontWeight:500,whiteSpace:"nowrap",color:b.c,background:b.bg,border:`1px solid ${b.border}`,boxShadow:"0 4px 16px rgba(0,0,0,0.08)",willChange:"transform"}}
            variants={scalePop} initial="hidden" animate={inView?"show":"hidden"} transition={{delay:0.2+i*0.08}}>
            <motion.span style={{display:"block"}} animate={{y:[0,-(4+i*1.5),0]}} transition={{duration:3+i*0.4,repeat:Infinity,ease:"easeInOut",delay:i*0.25}}>
              {b.l}
            </motion.span>
          </motion.span>
        ))}
      </motion.div>

      {/* ── Right side: App shell + overlapping cards ── */}
      {/* Card A — App skeleton shell */}
      <motion.div style={{position:"absolute",right:"8%",top:"8%",width:260,height:360,background:"rgba(245,245,250,0.92)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.8)",borderRadius:20,boxShadow:"0 20px 60px rgba(0,0,0,0.1)",transform:"perspective(800px) rotateY(-8deg)",willChange:"transform",y:yCards,overflow:"hidden"}}
        initial={{opacity:0,x:60}} animate={inView?{opacity:1,x:0}:{}} transition={{duration:0.8,delay:0.1}}>
        <motion.div animate={{y:[0,-6,0]}} transition={{duration:5,repeat:Infinity,ease:"easeInOut"}}>
          {/* top bar */}
          <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(0,0,0,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",gap:4}}>{[6,6,6].map((_,i)=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:i===0?"#ef4444":i===1?"#eab308":"#22c55e"}}/>)}</div>
            <div style={{display:"flex",gap:3,alignItems:"center"}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              <div style={{background:"#9b8ec4",color:"white",fontSize:8,fontWeight:700,padding:"2px 8px",borderRadius:4}}>AI Pulse</div>
            </div>
          </div>
          {/* sidebar + content */}
          <div style={{display:"flex",height:340}}>
            <div style={{width:36,borderRight:"1px solid rgba(0,0,0,0.04)",padding:"10px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
              {["🏠","👤","📁","⚙️","→"].map((ic,i)=><span key={i} style={{fontSize:10,opacity:0.4}}>{ic}</span>)}
            </div>
            <div style={{flex:1,padding:"14px 16px",display:"flex",flexDirection:"column",gap:8}}>
              {["100%","75%","100%","60%","85%","100%","70%","90%","55%","100%"].map((w,i)=><div key={i} style={{width:w,height:7,borderRadius:4,background:`rgba(0,0,0,${i%3===0?0.08:0.04})`}}/>)}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Card B — AI Feedback Panel (overlapping Card A) */}
      <motion.div style={{position:"absolute",right:"5%",top:"42%",width:250,background:"white",borderRadius:16,padding:"18px 20px",boxShadow:"0 16px 48px rgba(0,0,0,0.14),0 4px 12px rgba(0,0,0,0.06)",willChange:"transform",zIndex:10,y:yCards}}
        initial={{opacity:0,y:40}} animate={inView?{opacity:1,y:0}:{}} transition={{duration:0.7,delay:0.3}}>
        <motion.div animate={{y:[0,-5,0]}} transition={{duration:4.5,repeat:Infinity,ease:"easeInOut",delay:0.8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{display:"flex",gap:3}}>{[5,5].map((_,i)=><div key={i} style={{width:28,height:4,borderRadius:2,background:"rgba(0,0,0,0.08)"}}/>)}</div>
            <span style={{color:"#bbb",fontSize:16,cursor:"pointer"}}>⋮</span>
          </div>
          <div style={{display:"flex",gap:4,marginBottom:10}}>
            {["Experience","Education","Recommendations"].map((t,i)=>(
              <span key={i} style={{padding:"3px 9px",borderRadius:6,fontSize:9,fontWeight:i===0?600:400,border:"1px solid rgba(0,0,0,0.08)",background:i===0?"rgba(232,82,26,0.08)":"transparent",color:i===0?"#E8521A":"rgba(0,0,0,0.45)"}}>{t}</span>
            ))}
          </div>
          <div style={{borderTop:"1px solid rgba(0,0,0,0.05)",paddingTop:10}}>
            <p style={{fontSize:15,fontWeight:700,color:"#111",margin:"0 0 8px"}}>AI Feedback Panel</p>
            <p style={{fontSize:12,color:"rgba(0,0,0,0.6)",lineHeight:1.8,margin:0}}>- Add more project experience<br/>- Improve skill keywords<br/>- Quantify achievements</p>
          </div>
          <Link to="/register" style={{display:"block",background:"#1a1a1a",color:"white",width:"100%",padding:"10px 0",borderRadius:8,fontSize:12,fontWeight:600,marginTop:14,textAlign:"center",textDecoration:"none",border:"none"}}>Job Overview</Link>
        </motion.div>
      </motion.div>

      </div>{/* end centered container */}

      {/* ── Scroll indicator ── */}
      <motion.div style={{position:"absolute",bottom:32,left:"50%",transform:"translateX(-50%)",width:40,height:40,borderRadius:"50%",border:"1.5px solid rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"rgba(0,0,0,0.4)"}}
        animate={{y:[0,6,0]}} transition={{duration:1.5,repeat:Infinity}}>
        ↓
      </motion.div>
    </section>
  );
}

export default function LandingPage() {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once:true });

  return (
    <div style={{width:"100%",position:"relative",overflow:"hidden",fontFamily:"'Inter',sans-serif",background:"radial-gradient(ellipse at top left,rgba(255,220,200,0.6),transparent 50%),radial-gradient(ellipse at bottom right,rgba(155,142,196,0.3),transparent 50%),#f8f8fc"}}>

      {/* ════ HERO ════ */}
      <section ref={heroRef} style={{maxWidth:1200,margin:"0 auto",padding:"60px 40px 0",display:"flex",alignItems:"flex-start",gap:40,minHeight:"calc(100vh - 72px)",position:"relative",zIndex:10}}>
        {/* Left */}
        <motion.div style={{width:"45%",flexShrink:0,paddingTop:60}} variants={stagger(0.1,0)} initial="hidden" animate={heroInView?"show":"hidden"}>
          <motion.p variants={fadeUp} style={{fontSize:13,fontWeight:700,letterSpacing:"0.12em",color:"#E8521A",marginBottom:20,textTransform:"uppercase"}}>Intelligent Recruitment</motion.p>
          <motion.h1 variants={fadeUp} style={{fontSize:"clamp(3rem,5vw,4.5rem)",fontWeight:800,color:"#1a1a1a",lineHeight:1.1,letterSpacing:"-0.03em",margin:"0 0 0"}}>Hiring, without<br/>the guesswork.</motion.h1>
          <motion.p variants={fadeUp} style={{fontSize:16,color:"rgba(0,0,0,0.55)",lineHeight:1.7,maxWidth:420,marginTop:20}}>Transform your recruitment process with intelligent models that understand skills, experience, and candidate potential.</motion.p>
          <motion.div variants={fadeUp} style={{display:"flex",gap:12,marginTop:36}}>
            <motion.div whileHover={{scale:1.02,boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}} whileTap={{scale:0.98}}>
              <Link to="/register" style={{display:"inline-flex",alignItems:"center",gap:8,background:"#1a1a1a",color:"#fff",borderRadius:8,padding:"14px 28px",fontSize:15,fontWeight:600,textDecoration:"none",border:"none"}}>Get Started →</Link>
            </motion.div>
            <motion.div whileHover={{borderColor:"rgba(0,0,0,0.5)"}}>
              <Link to="/login" style={{display:"inline-flex",alignItems:"center",background:"transparent",border:"1.5px solid rgba(0,0,0,0.2)",color:"rgba(0,0,0,0.75)",borderRadius:8,padding:"14px 28px",fontSize:15,fontWeight:500,textDecoration:"none"}}>Sign In</Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right */}
        <div style={{flex:1,position:"relative",height:520,marginTop:10}}>
          {/* Card 1 — Match Score */}
          <motion.div initial={{opacity:0,x:-40,y:20}} animate={heroInView?{opacity:1,x:0,y:0}:{}} transition={{duration:0.8,ease:[0.16,1,0.3,1]}}
            style={{...glass,position:"absolute",left:60,top:20,width:260,padding:20,willChange:"transform",transform:"perspective(1000px) rotateY(-8deg) rotateX(3deg)",zIndex:10}}>
            <motion.div animate={{y:[0,-12,0]}} transition={{duration:4,repeat:Infinity,ease:"easeInOut"}} whileHover={{rotateY:"-4deg",rotateX:"1deg",scale:1.02}}>
              <p style={{fontSize:15,fontWeight:700,color:"#1a1a1a",margin:"0 0 4px"}}>Match Score</p>
              <Donut/>
              <p style={{fontSize:11,fontWeight:700,color:"rgba(0,0,0,0.4)",textTransform:"uppercase",letterSpacing:"0.07em",margin:"16px 0 8px"}}>Skills tags</p>
              <motion.div style={{display:"flex",flexWrap:"wrap",gap:6}} variants={stagger(0.08,0.8)} initial="hidden" animate={heroInView?"show":"hidden"}>
                <motion.span variants={scalePop}><P bg="#1a1a1a" c="#fff" b="none" fw={600}>Python</P></motion.span>
                <motion.span variants={scalePop}><P>Machine Learning</P></motion.span>
                <motion.span variants={scalePop}><P>Strategic Planning</P></motion.span>
                <motion.span variants={scalePop}><P>Strategic Planning</P></motion.span>
              </motion.div>
              <span style={{fontSize:12,color:"rgba(0,0,0,0.4)",marginTop:6,display:"block"}}>More…</span>
            </motion.div>
          </motion.div>

          {/* Card 2 — Resume Parsing */}
          <motion.div initial={{opacity:0,x:40,y:20}} animate={heroInView?{opacity:1,x:0,y:0}:{}} transition={{duration:0.8,delay:0.15,ease:[0.16,1,0.3,1]}}
            style={{...glass,position:"absolute",right:0,top:40,width:300,willChange:"transform",transform:"perspective(1000px) rotateY(6deg) rotateX(2deg)",zIndex:5}}>
            <motion.div animate={{y:[0,-8,0]}} transition={{duration:5,repeat:Infinity,ease:"easeInOut",delay:0.5}}>
              <div style={{padding:"14px 16px 8px",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
                <p style={{fontSize:14,fontWeight:700,color:"#1a1a1a",margin:0}}>Resume Parsing Visualization</p>
              </div>
              <div style={{padding:"10px 16px",display:"flex",flexWrap:"wrap",gap:"4px 6px",alignItems:"center"}}>
                <span style={{fontSize:11,color:"rgba(0,0,0,0.5)"}}>Keyword</span>
                <P bg="#E8521A" c="#fff" b="none" fw={700} fs={10}>Machine Learning</P>
                <span style={{fontSize:11,color:"rgba(0,0,0,0.5)"}}>Personalization</span>
                <span style={{fontSize:11,color:"rgba(0,0,0,0.5)"}}>Correlations &amp; development</span>
                <span style={{fontSize:11,color:"rgba(0,0,0,0.5)"}}>Company experience</span>
                <P bg="#9b8ec4" c="#fff" b="none" fw={600} fs={10}>Python</P>
                <span style={{fontSize:11,color:"rgba(0,0,0,0.5)"}}>Machine Keywords</span>
                <P bg="#E8521A" c="#fff" b="none" fw={600} fs={10}>Strategic Planning</P>
                <span style={{fontSize:11,color:"rgba(0,0,0,0.5)"}}>Statement operators &amp; learning</span>
                <P bg="#1a1a1a" c="#fff" b="none" fw={600} fs={10}>Strategic Planning</P>
                <span style={{fontSize:11,color:"rgba(0,0,0,0.5)"}}>Concurrent growth</span>
                <span style={{fontSize:11,color:"rgba(0,0,0,0.5)"}}>Model-driven computing</span>
              </div>
              <div style={{padding:"8px 16px 14px",borderTop:"1px solid rgba(0,0,0,0.06)"}}>
                <p style={{fontSize:13,fontWeight:700,color:"#1a1a1a",margin:"0 0 6px"}}>Skills</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {["Python","Machine Learning","PyTorch","Deep Learning","NLP","Strategic Forecasting","Data Science","Encoding"].map((t,i)=>(
                    <span key={i} style={{padding:"3px 8px",borderRadius:6,fontSize:11,border:"1px solid rgba(0,0,0,0.12)",color:"rgba(0,0,0,0.65)"}}>{t}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════ SECTION 2 ════ */}
      <Section2/>

      {/* ════ FEATURES ════ */}
      <section style={{maxWidth:1200,margin:"0 auto",padding:"60px 40px 80px",position:"relative",zIndex:10}}>
        <span style={{fontSize:11,fontWeight:600,letterSpacing:"0.18em",color:"#E8521A",textTransform:"uppercase"}}>FEATURES</span>
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
            <motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-50px"}} transition={{duration:0.5,delay:i*0.08}}
              whileHover={{y:-4,boxShadow:"0 12px 40px rgba(0,0,0,0.1)"}}
              style={{background:"rgba(255,255,255,0.72)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.5)",boxShadow:"0 8px 32px rgba(0,0,0,0.08)",padding:"24px 20px",borderRadius:14,cursor:"default",transition:"box-shadow 0.3s"}}>
              <span style={{fontSize:24,fontWeight:800,color:"rgba(0,0,0,0.07)",display:"block",marginBottom:10}}>{f.n}</span>
              <h3 style={{fontSize:15,fontWeight:700,color:"#111",margin:"0 0 6px"}}>{f.t}</h3>
              <p style={{fontSize:12,color:"#666",lineHeight:1.6,margin:0}}>{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section style={{maxWidth:1200,margin:"0 auto",padding:"0 40px 80px",position:"relative",zIndex:10}}>
        <h2 style={{fontSize:40,fontWeight:800,color:"#111",lineHeight:1.1,margin:"0 0 40px",letterSpacing:"-0.03em"}}>How it works</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
          {[
            {n:"01",t:"Upload Resume",d:"Candidates upload their resumes in PDF format."},
            {n:"02",t:"AI Analysis",d:"Our NLP pipeline extracts skills and analyzes experience."},
            {n:"03",t:"Get Matched",d:"Find the perfect job or ideal candidates instantly."},
          ].map((s,i)=>(
            <motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.5,delay:i*0.1}}
              style={{background:"rgba(255,255,255,0.72)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.5)",boxShadow:"0 8px 32px rgba(0,0,0,0.08)",padding:"28px 20px",borderRadius:14,textAlign:"center"}}>
              <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:44,height:44,borderRadius:10,background:"#1a1a1a",color:"#fff",fontSize:15,fontWeight:700,marginBottom:14}}>{s.n}</span>
              <h3 style={{fontSize:15,fontWeight:700,color:"#111",margin:"0 0 6px"}}>{s.t}</h3>
              <p style={{fontSize:12,color:"#666",lineHeight:1.6,margin:0}}>{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section style={{maxWidth:1200,margin:"0 auto",padding:"0 40px 80px",position:"relative",zIndex:10}}>
        <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.6}}
          style={{padding:"56px 40px",borderRadius:20,textAlign:"center",background:"rgba(17,17,17,0.95)",border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
          <h2 style={{fontSize:32,fontWeight:800,color:"#fff",margin:"0 0 10px"}}>Ready to transform your hiring?</h2>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.55)",maxWidth:440,margin:"0 auto 24px"}}>Join thousands of companies using IntelliHire to find the perfect candidates faster.</p>
          <Link to="/register" style={{display:"inline-flex",alignItems:"center",gap:8,background:"#fff",color:"#111",borderRadius:8,padding:"12px 24px",fontSize:13,fontWeight:600,textDecoration:"none"}}>Get Started Free →</Link>
        </motion.div>
      </section>

      {/* ════ FOOTER ════ */}
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
