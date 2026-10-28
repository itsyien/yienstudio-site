import{i as e,t}from"./react-CKK0OxVB.js";import{i as n}from"./index-p0y6d8b5.js";import{a as r,c as i,d as a,f as o,i as s,l as c,m as l,n as u,o as d,p as ee,r as f,s as te,t as p,u as m}from"./three-DgCB1hw2.js";var h=e(),g=Object.freeze({speed:.04,x:65,y:48,distance:12.7,elevation:15,azimuth:43,particles:15e3,particleSize:1.2,stars:23e3,glow:.85,dimming:31,sensitivity:4.9,innerColor:`#ffd6aa`,outerColor:`#7000e0`});function _(e,t,n,r,i){if(n<=0||r<=0)return{yaw:0,pitch:0};let a=e=>Math.max(-1,Math.min(1,e));return{yaw:a(e/n*2-1)*i,pitch:a(t/r*2-1)*i*.6}}function v(e,t,n){return e+(t-e)*(1-Math.exp(-Math.max(0,n)/.18))}function ne(e){return 1+.6/Math.sqrt(Math.max(e,1.27))}var y=1.4,b=`
  varying vec2 disk;
  void main() {
    disk = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,re=`
  uniform float phase;
  uniform vec3 hotColor;
  uniform vec3 coolColor;
  varying vec2 disk;
  float filteredWave(float angle, float footprint) {
    return sin(angle) * exp(-0.5 * footprint * footprint);
  }
  void main() {
    float radius = length(disk);
    // RingGeometry's local y becomes negative world z after its rotation.
    float bearing = atan(-disk.y, disk.x);
    float drift = bearing - phase * ${y.toFixed(2)};
    float pixelSpan = length(fwidth(disk));
    float angularSpan = pixelSpan / max(radius, 0.1);
    float radialSpan = fwidth(radius) / max(radius, 0.1);
    // Broad spiral lanes rotate without accumulating radial frequency over time.
    float spiral = filteredWave(drift * 3.0 + log(radius) * 5.0, angularSpan * 3.0 + radialSpan * 5.0);
    float wisps = filteredWave(drift * 7.0 - log(radius) * 4.0, angularSpan * 7.0 + radialSpan * 4.0);
    float textureLight = 0.48 + spiral * 0.2 + wisps * 0.08;
    float envelope = smoothstep(1.26, 1.52, radius) * (1.0 - smoothstep(3.0, 5.5, radius));
    float heat = exp(-(radius - 1.3) * 0.65);
    vec3 color = mix(coolColor, hotColor, heat);
    color = mix(color, vec3(1.0, 0.94, 0.83), heat * heat * 0.32);
    float light = textureLight * envelope * (0.55 + heat * 1.7);
    gl_FragColor = vec4(color * light, envelope * 0.95);
  }
`,ie=`
  uniform vec3 hotColor;
  uniform vec3 coolColor;
  uniform float glow;
  varying vec2 disk;
  void main() {
    float radius = length(disk);
    float rimWidth = max(0.055, fwidth(radius) * 1.5);
    float rim = exp(-pow((radius - 1.29) / rimWidth, 2.0)) * 0.055 / rimWidth;
    float haze = exp(-max(radius - 1.27, 0.0) * 4.2) * 0.14;
    float crown = smoothstep(-0.25, 1.8, disk.y);
    float strength = (rim * (0.16 + crown * 0.84) + haze * (0.6 + crown * 1.4)) * glow;
    vec3 color = mix(coolColor, hotColor, 0.78 + crown * 0.2);
    gl_FragColor = vec4(color * strength, clamp(strength, 0.0, 1.0));
  }
`,ae=`
  attribute float seed;
  attribute float mote;
  attribute float angularRate;
  uniform float phase;
  uniform float pointScale;
  uniform float pixelRatio;
  varying float brightness;
  void main() {
    float r = position.x;
    float angle = position.z + phase * angularRate;
    vec3 orbit = vec3(cos(angle) * r, position.y, sin(angle) * r);
    vec4 eye = modelViewMatrix * vec4(orbit, 1.0);
    gl_Position = projectionMatrix * eye;
    // Resolved CSS-size sprites retain their footprint throughout the orbit.
    gl_PointSize = max(1.6, (1.7 + mote * 1.3) * pointScale) * pixelRatio;
    brightness = 0.25 + seed * 0.65;
  }
`,oe=`
  uniform vec3 hotColor;
  uniform float densityOpacity;
  varying float brightness;
  void main() {
    vec2 center = (gl_PointCoord - 0.5) * 2.0;
    float coverage = exp(-dot(center, center) * 3.5);
    gl_FragColor = vec4(hotColor, coverage * brightness * densityOpacity);
  }
`,se=`
  attribute float mote;
  uniform float pixelRatio;
  varying vec3 tint;
  void main() {
    // Background stars have no spin clock; only camera parallax affects them.
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (1.8 + mote * 0.8) * pixelRatio;
    tint = color;
  }
`,ce=`
  varying vec3 tint;
  void main() {
    vec2 center = (gl_PointCoord - 0.5) * 2.0;
    float coverage = exp(-dot(center, center) * 3.5);
    gl_FragColor = vec4(tint * 2.5, coverage * 0.75);
  }
`;function x(e,t,n,h=1.5){let g=t,y=new p({alpha:!0,antialias:!0,powerPreference:`low-power`}),x=[],S=e=>(x.push(e),e),C=0,w=!1,T=!0,E,D=1,O=1,k=0,A=0,j={yaw:0,pitch:0},M=0,N=0,P=window.matchMedia(`(hover: hover) and (pointer: fine)`),F=e=>{e.pointerType!==`mouse`||!P.matches||(j=_(e.clientX,e.clientY,D,O,g.sensitivity))},I=()=>{j={yaw:0,pitch:0}},L=e=>{e.preventDefault(),n()},R,z=()=>{w||(w=!0,cancelAnimationFrame(C),E?.disconnect(),R?.disconnect(),document.removeEventListener(`visibilitychange`,B),window.removeEventListener(`pointermove`,F),window.removeEventListener(`blur`,I),document.documentElement.removeEventListener(`pointerleave`,I),y.domElement.removeEventListener(`webglcontextlost`,L),x.forEach(e=>e.dispose()),y.dispose(),y.domElement.remove())};function B(){!w&&T&&document.visibilityState===`visible`&&!C&&(k=0,C=requestAnimationFrame(H))}let V=()=>{};function H(e){if(C=0,w||!T||document.visibilityState!==`visible`)return;let t=k?Math.min((e-k)/1e3,.05):0;k=e,V(t),C=requestAnimationFrame(H)}try{y.setClearColor(`#05070d`,1),y.setPixelRatio(Math.min(window.devicePixelRatio||1,h)),y.domElement.setAttribute(`aria-hidden`,`true`),e.appendChild(y.domElement);let p=new a,_=new i(45,1,.1,700),x={value:new s(g.innerColor)},C={value:new s(g.outerColor)},w={value:A},k=S(new o({vertexShader:b,fragmentShader:re,uniforms:{phase:w,hotColor:x,coolColor:C},side:2,transparent:!0,depthWrite:!1})),P=new d(S(new m(1.27,5.5,256,48)),k);P.rotation.x=-Math.PI/2,p.add(P);let H=new d(S(new ee(1.23,64,32)),S(new te({color:`#000000`})));p.add(H);let U=S(new o({vertexShader:b,fragmentShader:ie,uniforms:{hotColor:x,coolColor:C,glow:{value:g.glow}},transparent:!0,blending:2,depthWrite:!1})),W=new d(S(new m(1.245,3.2,192,16)),U);p.add(W);let G=18427,K=()=>(G=Math.imul(G,1664525)+1013904223>>>0,G/4294967296),q=new Float32Array(15e4),J=new Float32Array(5e4),Y=new Float32Array(5e4),le=new Float32Array(5e4);for(let e=0;e<5e4;e++){let t=1.36+K()**1.7*4.5;q.set([t,(K()-.5)*.1*t,K()*Math.PI*2],e*3),J[e]=K(),Y[e]=.3+K()*.7,le[e]=ne(t)}let X=S(new f);X.setAttribute(`position`,new u(q,3)),X.setAttribute(`seed`,new u(J,1)),X.setAttribute(`mote`,new u(Y,1)),X.setAttribute(`angularRate`,new u(le,1));let Z=S(new o({vertexShader:ae,fragmentShader:oe,uniforms:{phase:w,hotColor:x,pointScale:{value:1},pixelRatio:{value:1},densityOpacity:{value:.2}},transparent:!0,depthWrite:!1,blending:2})),Q=new c(X,Z);Q.frustumCulled=!1,p.add(Q);let ue=new Float32Array(15e4),de=new Float32Array(15e4),fe=new Float32Array(5e4);for(let e=0;e<5e4;e++){let t=K()*Math.PI*2,n=Math.acos(1-2*K()),r=.15+K()*.35;ue.set([Math.sin(n)*Math.cos(t)*300,Math.cos(n)*300,Math.sin(n)*Math.sin(t)*300],e*3),de.set([r*.82,r*.88,r],e*3),fe[e]=K()}let $=S(new f);$.setAttribute(`position`,new u(ue,3)),$.setAttribute(`color`,new u(de,3)),$.setAttribute(`mote`,new u(fe,1));let pe=S(new o({vertexShader:se,fragmentShader:ce,uniforms:{pixelRatio:{value:1}},vertexColors:!0,transparent:!0,blending:2,depthWrite:!1})),me=new c($,pe);p.add(me);function he(e){g=e,x.value.set(e.innerColor),C.value.set(e.outerColor),X.setDrawRange(0,e.particles),$.setDrawRange(0,e.stars),Z.uniforms.pointScale.value=e.particleSize,Z.uniforms.densityOpacity.value=.42/(1+e.particles/12e3),U.uniforms.glow.value=e.glow,I()}he(t);let ge=new l;V=e=>{A+=e*g.speed,w.value=A,M=v(M,j.yaw,e),N=v(N,j.pitch,e);let t=r.degToRad(g.azimuth+M),n=r.degToRad(g.elevation+N);_.position.set(Math.sin(t)*Math.cos(n),Math.sin(n),Math.cos(t)*Math.cos(n)).multiplyScalar(g.distance),_.lookAt(ge),_.setViewOffset(D,O,(.5-g.x/100)*D,(.5-g.y/100)*O,D,O),W.quaternion.copy(_.quaternion),y.render(p,_)};let _e=()=>{D=Math.max(1,e.clientWidth),O=Math.max(1,e.clientHeight),_.aspect=D/O,y.setPixelRatio(Math.min(window.devicePixelRatio||1,h)),y.setSize(D,O,!1),Z.uniforms.pixelRatio.value=y.getPixelRatio(),pe.uniforms.pixelRatio.value=y.getPixelRatio(),V(0)};R=new ResizeObserver(_e),R.observe(e);let ve=document.getElementById(`top`);return ve&&(E=new IntersectionObserver(([e])=>{T=e.isIntersecting,B()}),E.observe(ve)),document.addEventListener(`visibilitychange`,B),window.addEventListener(`pointermove`,F,{passive:!0}),window.addEventListener(`blur`,I),document.documentElement.addEventListener(`pointerleave`,I),y.domElement.addEventListener(`webglcontextlost`,L),y.debug.onShaderError=()=>n(),_e(),B(),{update:he,dispose:z}}catch(e){throw z(),e}}var S=t();function C({interactive:e=!0}){let[t,r]=(0,h.useState)(()=>({...g})),[i,a]=(0,h.useState)(!1),[o,s]=(0,h.useState)(()=>window.matchMedia(`(prefers-reduced-motion: reduce)`).matches),c=(0,h.useRef)(null),l=(0,h.useRef)(null),u=(0,h.useRef)(t);return u.current=t,(0,h.useEffect)(()=>{let e=window.matchMedia(`(prefers-reduced-motion: reduce)`),t=()=>s(e.matches);return e.addEventListener(`change`,t),()=>e.removeEventListener(`change`,t)},[]),(0,h.useEffect)(()=>{if(!(!e||o||i||!c.current)){try{l.current=x(c.current,u.current,()=>a(!0))}catch{a(!0)}return()=>{l.current?.dispose(),l.current=null}}},[e,o,i]),(0,h.useEffect)(()=>{l.current?.update(t)},[t,!1]),(0,S.jsxs)(S.Fragment,{children:[e&&!i&&!o?(0,S.jsxs)(`div`,{className:`site-bg black-hole-wallpaper`,"aria-hidden":`true`,"data-mode":`live`,children:[(0,S.jsx)(`div`,{ref:c,className:`black-hole-stage`}),(0,S.jsx)(`div`,{className:`black-hole-dimmer`,style:{opacity:t.dimming/100}}),(0,S.jsx)(`div`,{className:`site-bg-vignette`})]}):(0,S.jsx)(n,{}),null]})}export{C as SiteBackground};