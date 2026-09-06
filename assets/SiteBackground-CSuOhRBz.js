import{i as e,t}from"./react-CKK0OxVB.js";import{a as n,c as r,i,n as a,o,r as s,s as c,t as l}from"./three-CULfYD0h.js";var u=e(),d=t(),f=`
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,p=`
precision highp float;

uniform float uTime, uAttenuation, uLineThickness;
uniform float uBaseRadius, uRadiusStep, uScaleRate;
uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;
uniform float uFadeIn, uFadeOut;
uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;
uniform float uCoverageAlpha;
uniform vec2 uResolution, uMouse;
uniform vec3 uColor, uColorTwo;
uniform int uRingCount;

const float HP = 1.5707963;
const float CYCLE = 3.45;

float fade(float t) {
  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
  float t = mod(uTime + t0, CYCLE);
  float r = ri + t / CYCLE * uScaleRate;
  float d = abs(length(p) - r);
  float a = atan(abs(p.y), abs(p.x)) / HP;
  float th = max(1.0 - a, 0.5) * px * uLineThickness;
  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
  d += pow(cut * a, 3.0) * r;
  return h * exp(-uAttenuation * d) * fade(t);
}

void main() {
  float px = 1.0 / min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
  float cr = cos(uRotation), sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;
  p -= uMouse * uMouseInfluence;
  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;
  p /= sc;
  vec3 c = vec3(0.0);
  float coverage = 0.0;
  float rcf = max(float(uRingCount) - 1.0, 1.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    vec2 pr = p - fi * uParallax * uMouse;
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    float ringAmount = ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px);
    c = mix(c, rc, vec3(ringAmount));
    coverage = max(coverage, ringAmount);
  }
  c *= 1.0 + uBurst * 2.0;
  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uNoiseAmount;
  float intensity = max(c.r, max(c.g, c.b));
  vec3 emissiveColor = intensity > 0.0001 ? clamp(c / intensity, 0.0, 1.0) : vec3(0.0);
  vec3 outputColor = mix(emissiveColor, clamp(c, 0.0, 1.0), uCoverageAlpha);
  float outputAlpha = mix(intensity, coverage, uCoverageAlpha);
  gl_FragColor = vec4(outputColor, clamp(outputAlpha * uOpacity, 0.0, 1.0));
}
`;function m({color:e=`#fc42ff`,colorTwo:t=`#42fcff`,speed:m=1,ringCount:h=6,attenuation:g=10,lineThickness:_=2,baseRadius:v=.35,radiusStep:y=.1,scaleRate:b=.1,opacity:x=1,blur:S=0,noiseAmount:C=.1,rotation:w=0,ringGap:T=1.5,fadeIn:E=.7,fadeOut:D=.5,followMouse:O=!1,mouseInfluence:k=.2,hoverScale:A=1.2,parallax:j=.05,clickBurst:M=!1,alphaMode:N=`luminance`,useWindowPointer:P=!1}){let F=(0,u.useRef)(null),I=(0,u.useRef)(null),L=(0,u.useRef)([0,0]),R=(0,u.useRef)([0,0]),z=(0,u.useRef)(0),B=(0,u.useRef)(!1),V=(0,u.useRef)(0);return I.current={color:e,colorTwo:t,speed:m,ringCount:h,attenuation:g,lineThickness:_,baseRadius:v,radiusStep:y,scaleRate:b,opacity:x,noiseAmount:C,rotation:w,ringGap:T,fadeIn:E,fadeOut:D,followMouse:O,mouseInfluence:k,hoverScale:A,parallax:j,clickBurst:M,alphaMode:N,useWindowPointer:P},(0,u.useEffect)(()=>{let e=F.current;if(!e)return;let t;try{t=new l({alpha:!0})}catch{return}if(!t.capabilities.isWebGL2){t.dispose();return}t.setClearColor(0,0),e.appendChild(t.domElement);let u=new o,d=new i(-.5,.5,.5,-.5,.1,10);d.position.z=1;let m={uTime:{value:0},uAttenuation:{value:0},uResolution:{value:new r},uColor:{value:new a},uColorTwo:{value:new a},uLineThickness:{value:0},uBaseRadius:{value:0},uRadiusStep:{value:0},uScaleRate:{value:0},uRingCount:{value:0},uOpacity:{value:1},uNoiseAmount:{value:0},uRotation:{value:0},uRingGap:{value:1.6},uFadeIn:{value:.5},uFadeOut:{value:.75},uMouse:{value:new r},uMouseInfluence:{value:0},uHoverAmount:{value:0},uHoverScale:{value:1},uParallax:{value:0},uBurst:{value:0},uCoverageAlpha:{value:0}},h=new c({vertexShader:f,fragmentShader:p,uniforms:m,transparent:!0}),g=new s(new n(1,1),h);u.add(g);let _=()=>{let e=window.visualViewport,n=Math.max(1,Math.round(e?.width??window.innerWidth)),r=Math.max(1,Math.round(e?.height??window.innerHeight)),i=document.documentElement.dataset.perf===`full`?1.75:1.25,a=e?.scale||1,o=Math.min((window.devicePixelRatio||1)/a,i);t.setPixelRatio(o),t.setSize(n,r,!1),m.uResolution.value.set(Math.floor(n*o),Math.floor(r*o))};_(),window.addEventListener(`resize`,_),window.visualViewport?.addEventListener(`resize`,_),window.visualViewport?.addEventListener(`scroll`,_);let v=(t,n)=>{let r=e.getBoundingClientRect();L.current[0]=(t-r.left)/r.width-.5,L.current[1]=-((n-r.top)/r.height-.5)},y=e=>{let t=e;v(t.clientX,t.clientY),P&&(B.current=!0)},b=()=>{B.current=!0},x=()=>{B.current=!1,L.current[0]=0,L.current[1]=0},S=()=>{V.current=1},C=P?window:e;C.addEventListener(`mousemove`,y),P?(document.documentElement.addEventListener(`mouseleave`,x),window.addEventListener(`click`,S)):(e.addEventListener(`mouseenter`,b),e.addEventListener(`mouseleave`,x),e.addEventListener(`click`,S));let w=0,T=!1,E=!document.hidden,D=0,O=0,k=e=>{w=requestAnimationFrame(k);let n=I.current;if(!n)return;let r=O===0?0:Math.min(e-O,100);O=e,D+=r*.001*(n.speed??1),R.current[0]+=(L.current[0]-R.current[0])*.08,R.current[1]+=(L.current[1]-R.current[1])*.08,z.current+=(+!!B.current-z.current)*.08,V.current*=.95,V.current<.001&&(V.current=0),m.uTime.value=D,m.uAttenuation.value=n.attenuation??10,m.uColor.value.set(n.color??`#fc42ff`),m.uColorTwo.value.set(n.colorTwo??`#42fcff`),m.uLineThickness.value=n.lineThickness??2,m.uBaseRadius.value=n.baseRadius??.35,m.uRadiusStep.value=n.radiusStep??.1,m.uScaleRate.value=n.scaleRate??.1,m.uRingCount.value=n.ringCount??6,m.uOpacity.value=n.opacity??1,m.uNoiseAmount.value=n.noiseAmount??.1,m.uRotation.value=(n.rotation??0)*Math.PI/180,m.uRingGap.value=n.ringGap??1.5,m.uFadeIn.value=n.fadeIn??.7,m.uFadeOut.value=n.fadeOut??.5,m.uMouse.value.set(R.current[0],R.current[1]),m.uMouseInfluence.value=n.followMouse?n.mouseInfluence??.2:0,m.uHoverAmount.value=z.current,m.uHoverScale.value=n.hoverScale??1.2,m.uParallax.value=n.parallax??.05,m.uBurst.value=n.clickBurst?V.current:0,m.uCoverageAlpha.value=+(n.alphaMode===`coverage`),t.render(u,d)},A=()=>{T&&E&&w===0&&(O=0,w=requestAnimationFrame(k))},j=()=>{w!==0&&(cancelAnimationFrame(w),w=0)},M=new IntersectionObserver(([e])=>{T=e.isIntersecting,T?A():j()},{threshold:0});M.observe(e);let N=()=>{E=!document.hidden,E?A():j()};return document.addEventListener(`visibilitychange`,N),A(),()=>{j(),M.disconnect(),document.removeEventListener(`visibilitychange`,N),window.removeEventListener(`resize`,_),window.visualViewport?.removeEventListener(`resize`,_),window.visualViewport?.removeEventListener(`scroll`,_),C.removeEventListener(`mousemove`,y),P?(document.documentElement.removeEventListener(`mouseleave`,x),window.removeEventListener(`click`,S)):(e.removeEventListener(`mouseenter`,b),e.removeEventListener(`mouseleave`,x),e.removeEventListener(`click`,S)),e.removeChild(t.domElement),t.dispose(),h.dispose()}},[P]),(0,d.jsx)(`div`,{ref:F,className:`magic-rings-container`,style:S>0?{filter:`blur(${S}px)`}:void 0})}function h({interactive:e=!0}){return(0,d.jsxs)(`div`,{className:`site-bg`,"aria-hidden":!0,"data-mode":e?`live`:`static`,children:[e?(0,d.jsx)(m,{useWindowPointer:!0,color:`#fc42ff`,colorTwo:`#42fcff`,ringCount:5,speed:1,attenuation:10,lineThickness:2,baseRadius:.35,radiusStep:.1,scaleRate:.1,opacity:.9,blur:0,noiseAmount:.1,rotation:0,ringGap:1.5,fadeIn:.7,fadeOut:.5,followMouse:!0,mouseInfluence:.18,hoverScale:1.15,parallax:.04,clickBurst:!1}):null,(0,d.jsx)(`div`,{className:`site-bg-vignette`})]})}export{h as SiteBackground};