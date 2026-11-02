import{i as e,t}from"./react-CKK0OxVB.js";import{C as n,H as r,M as i,N as a,P as o,S as s,V as c,_ as l,a as u,b as d,c as f,d as ee,f as p,h as te,i as ne,l as re,m,o as h,p as ie,s as g,u as ae,v as oe,w as _,x as se,y as ce}from"./index-B_35inKR.js";import{S as le,_ as v,a as ue,b as y,c as b,d as x,f as de,g as fe,h as pe,i as me,l as S,m as he,n as C,o as w,p as ge,r as T,s as E,t as D,u as _e,v as O,x as ve,y as k}from"./three-QAxdFDnW.js";var A=e(),j=Object.freeze({speed:.04,x:65,y:48,distance:12.7,elevation:15,azimuth:43,particles:15e3,particleSize:1.2,stars:23e3,glow:.85,dimming:31,sensitivity:4.9,innerColor:`#ffd6aa`,outerColor:`#7000e0`});function M(e,t,n,r,i){if(n<=0||r<=0)return{yaw:0,pitch:0};let a=e=>Math.max(-1,Math.min(1,e));return{yaw:a(e/n*2-1)*i,pitch:a(t/r*2-1)*i*.6}}function N(e,t,n){return e+(t-e)*(1-Math.exp(-Math.max(0,n)/.18))}function P(e,t,n,r,i,a){if(n<=0||r<=0)return{x:.5,y:.5,proximity:0};let o=Math.max(0,Math.min(1,e/n)),s=Math.max(0,Math.min(1,t/r)),c=Math.hypot((o-i)*n/r,s-a),l=Math.max(0,Math.min(1,1-c/.32));return{x:o,y:s,proximity:l*l*(3-2*l)}}function ye(e,t){let n=Math.sqrt(27)/2;return!Number.isFinite(e)||!Number.isFinite(t)||e<=n||t<=0||t>=180?0:n/Math.sqrt(e*e-n*n)/Math.tan(t*Math.PI/360)}var be=`
precision highp float;

#define MAX_STEPS 150
#define HAS_FIXED_STEPS 0
#define HAS_STARS 0

varying vec2 vUv;

uniform vec2  uRes;
uniform vec3  uCamPos;
uniform vec3  uRight;
uniform vec3  uUp;
uniform vec3  uFwd;
uniform float uTanHalf;
uniform vec2  uFocus;
#if HAS_FIXED_STEPS == 0
uniform float uSteps;
#endif
uniform float uSkyR;
uniform float uDiskIn;
uniform float uDiskOut;
uniform float uThick;
uniform float uDensity;
uniform float uSpin;
// x/y/z/w = first wind phase/second wind phase/blend/spin time offset.
uniform vec4  uWind;
uniform float uGrain;
uniform float uBright;
uniform float uDoppler;
uniform vec3  uHot;
uniform vec3  uMid;
uniform vec3  uCool;
#if HAS_STARS
uniform float uStars;
#endif
uniform float uEncode;
uniform vec2  uJitter;
uniform float uSeed;

float hash13(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbm(vec3 p, float lod) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 4; i++) {
    if (i != 3 || lod > 0.0) {
      s += (i == 3 ? a * lod : a) * vnoise(p);
    }
    p = p * 2.03 + vec3(11.3, 7.1, 3.7);
    a *= 0.5;
  }
  return s;
}

void gasAt(
  vec3 p,
  float rd,
  float dt,
  float diskSpanInverse,
  out float dens,
  out vec3 tint,
  out float heat
) {
  float rn = clamp((rd - uDiskIn) * diskSpanInverse, 0.0, 1.0);
  float tk = uThick * (0.35 + 1.25 * rn);
  float v = p.y / tk;
  float sheet = exp(-v * v);
  float q = uDiskIn / rd;
  float inner = smoothstep(0.0, 0.07, rn);
  float outer = 1.0 - smoothstep(0.45, 1.0, rn);
  float prof = inner * outer * q * q;
  if (sheet * prof * uDensity * 10.0 <= 0.001) {
    dens = 0.0;
    tint = vec3(0.0);
    heat = 0.0;
    return;
  }

  float lod = clamp(1.0 - dt * uGrain * 14.0, 0.0, 1.0);
  float phi = atan(p.z, p.x);
  float omega = uSpin * pow(q, 1.5);
  float lr = log(rd) * 1.1 + uWind.w;

  float cloudsA = fbm(vec3(vec2(cos(phi + omega * uWind.x),
                                sin(phi + omega * uWind.x)) * (rd * uGrain), lr), lod);
  float cloudsB = fbm(vec3(vec2(cos(phi + omega * uWind.y),
                                sin(phi + omega * uWind.y)) * (rd * uGrain), lr + 40.0), lod);
  float clouds = mix(cloudsA, cloudsB, uWind.z);
  float filaments = clouds * clouds * 1.75;
  dens = max(0.0, filaments * 1.5 - 0.30) * sheet * prof * uDensity * 4.6;

  if (dens <= 0.001) {
    tint = vec3(0.0);
    heat = 0.0;
    return;
  }

  heat = pow(q, 0.8) * (0.72 + 0.55 * clouds);
  tint = mix(uCool, uMid, smoothstep(0.10, 0.52, heat));
  tint = mix(tint, uHot, smoothstep(0.52, 1.05, heat));
}

#if HAS_STARS
vec3 starField(vec3 d) {
  vec3 a = abs(d);
  vec2 uv;
  float face;
  if (a.x >= a.y && a.x >= a.z)      { uv = d.yz / a.x; face = d.x > 0.0 ? 0.0 : 1.0; }
  else if (a.y >= a.z)               { uv = d.xz / a.y; face = d.y > 0.0 ? 2.0 : 3.0; }
  else                               { uv = d.xy / a.z; face = d.z > 0.0 ? 4.0 : 5.0; }

  vec3 col = vec3(0.0);
  float octaveScale = 1.0;
  for (int k = 0; k < 3; k++) {
    float sc = 90.0 * octaveScale;
    vec2 p = uv * sc;
    vec2 id = floor(p);
    vec2 f = fract(p) - 0.5;
    float h = hash13(vec3(id, face * 19.0));
    if (h > 0.965) {
      vec2 off = vec2(hash13(vec3(id, face + 11.0)), hash13(vec3(id, face + 23.0)));
      float dd = length(f - (off - 0.5) * 0.7);
      float s = smoothstep(0.055, 0.0, dd);
      float warm = hash13(vec3(id, face + 51.0));
      col += s * (0.6 + 4.5 * fract(h * 97.0))
           * mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.88, 0.72), warm)
           / octaveScale;
    }
    octaveScale *= 2.2;
  }
  col += vec3(0.013, 0.017, 0.030) * fbm(d * 2.6, 1.0);
  return col;
}
#endif

#if HAS_STARS == 0
bool missesVisibleDisc(vec3 origin, vec3 direction) {
  // Test a deliberately expanded cylinder around the emitting gas. Rays that
  // miss both this volume and the central strong-lensing zone cannot
  // contribute visible light, so they can skip the expensive integration.
  float cullOuter = uDiskOut * 1.16 + 0.65;
  float cullHalfThickness = uThick * 6.5 + 0.35;
  if (length(origin.xz) <= cullOuter + 0.5) return false;

  vec2 radialOrigin = origin.xz;
  vec2 radialDirection = direction.xz;
  float a = dot(radialDirection, radialDirection);
  float b = dot(radialOrigin, radialDirection);
  float c = dot(radialOrigin, radialOrigin) - cullOuter * cullOuter;
  float discriminant = b * b - a * c;
  bool intersectsExpandedDisc = false;

  if (a > 0.00001 && discriminant >= 0.0) {
    float root = sqrt(discriminant);
    float nearTime = (-b - root) / a;
    float farTime = (-b + root) / a;
    if (farTime > 0.0) {
      nearTime = max(0.0, nearTime);
      float nearY = origin.y + direction.y * nearTime;
      float farY = origin.y + direction.y * farTime;
      intersectsExpandedDisc = min(nearY, farY) <= cullHalfThickness
                            && max(nearY, farY) >= -cullHalfThickness;
    }
  }

  float impactParameter = length(cross(origin, direction));
  float lensingRadius = min(cullOuter, max(8.0, uDiskIn * 1.8 + 1.0));
  return !intersectsExpandedDisc && impactParameter > lensingRadius;
}
#endif

void main() {
  vec2 uv = (gl_FragCoord.xy + uJitter - uFocus * uRes) / uRes.y;
  vec3 dir = normalize(uFwd + (uv.x * uRight + uv.y * uUp) * 2.0 * uTanHalf);
#if HAS_STARS == 0
  if (missesVisibleDisc(uCamPos, dir)) {
    gl_FragColor = vec4(0.0);
    return;
  }
#endif
  vec3 pos = uCamPos;
  vec3 vel = dir;
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);
  float h = sqrt(h2);
  float swept = 0.0;
  vec3 col = vec3(0.0);
  float transmit = 1.0;
  bool captured = false;
  float jitter = fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453);
  float diskSpanInverse = 1.0 / max(0.001, uDiskOut - uDiskIn);
  float diskStepRadius = uDiskOut * 1.25;
  float diskSampleHalfThickness = uThick * 5.0;

  for (int i = 0; i < MAX_STEPS; i++) {
#if HAS_FIXED_STEPS == 0
    if (float(i) >= uSteps) break;
#endif
    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    if (r < 1.0) {
      captured = true;
      break;
    }
    if (r > uSkyR && dot(pos, vel) > 0.0) break;
    if (transmit < 0.004) break;

    float dt = clamp(0.14 * (r - 1.0), 0.025, 1.1);
    if (r < diskStepRadius) {
      float rn = clamp((r - uDiskIn) * diskSpanInverse, 0.0, 1.0);
      float tk = uThick * (0.35 + 1.25 * rn);
      dt = min(dt, max(tk * 0.38, abs(pos.y) * 0.5));
    }

    swept += h * dt / r2;
    jitter = fract(jitter + 0.6180339887);
    float sampleStep = dt * jitter;
    float midY = pos.y + vel.y * sampleStep;
    if (abs(midY) < diskSampleHalfThickness) {
      vec2 midXZ = pos.xz + vel.xz * sampleStep;
      float rd = length(midXZ);
      if (rd > uDiskIn && rd < uDiskOut) {
        vec3 mid = vec3(midXZ.x, midY, midXZ.y);
        float dens;
        float heat;
        vec3 tint;
        gasAt(mid, rd, dt, diskSpanInverse, dens, tint, heat);
        if (dens > 0.001) {
          float deep = exp(-1.3 * max(0.0, swept - 4.6));
          vec3 tang = vec3(mid.z, 0.0, -mid.x) / rd;
          float beta = min(0.85, sqrt(0.5 / max(rd, 1.5)));
          float gam = inversesqrt(max(1e-4, 1.0 - beta * beta));
          vec3 toObs = -normalize(vel);
          float g = 1.0 / (gam * (1.0 - beta * dot(tang, toObs)));
          g *= sqrt(max(0.05, 1.0 - 1.0 / rd));
          float boost = pow(max(g, 0.02), 3.0 * uDoppler);
          vec3 shift = mix(
            vec3(1.0),
            g > 1.0 ? vec3(0.86, 0.94, 1.14) : vec3(1.15, 0.82, 0.62),
            clamp(abs(g - 1.0) * 1.6, 0.0, 1.0) * uDoppler
          );
          float emit = uBright * (0.26 + 2.0 * heat * heat);
          col += tint * shift * (emit * boost * dens * transmit * dt * deep);
          transmit *= exp(-dens * 0.30 * dt);
        }
      }
    }

    vec3 acc = -1.5 * h2 * pos / (r2 * r2 * r);
    vel += acc * dt;
    pos += vel * dt;
  }

#if HAS_STARS
  if (!captured && uStars > 0.001) {
    vec3 toHole = normalize(-uCamPos);
    float sI = length(cross(normalize(dir), toHole));
    float sS = length(cross(normalize(vel), toHole));
    float stretch = clamp(sI / max(1e-3, sS), 1.0, 40.0);
    col += starField(normalize(vel)) * uStars * transmit / stretch;
  }
#endif

  if (uEncode > 0.5) col = col / (1.0 + col);
  float alpha = captured ? 1.0 : clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`,xe=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uCur;
uniform sampler2D uPrev;
uniform float uAlpha;
void main() {
  vec4 c = texture2D(uCur, vUv);
  vec4 p = texture2D(uPrev, vUv);
  gl_FragColor = mix(p, c, uAlpha);
}
`,Se=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uDecode;
uniform float uPack;
uniform float uThreshold;
void main() {
  vec3 s = texture2D(uTex, vUv + uTexel * vec2(-1.0, -1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2( 1.0, -1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2(-1.0,  1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2( 1.0,  1.0)).rgb;
  s *= 0.25;
  if (uDecode > 0.5) s = s / max(vec3(0.002), 1.0 - s);
  float l = max(s.r, max(s.g, s.b));
  s *= max(0.0, l - uThreshold) / max(0.0001, l);
  gl_FragColor = vec4(s * uPack, 1.0);
}
`,F=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uStep;
void main() {
  vec3 s = texture2D(uTex, vUv).rgb * 0.2270270;
  s += (texture2D(uTex, vUv + uStep * 1.3846154).rgb
      + texture2D(uTex, vUv - uStep * 1.3846154).rgb) * 0.3162162;
  s += (texture2D(uTex, vUv + uStep * 3.2307692).rgb
      + texture2D(uTex, vUv - uStep * 3.2307692).rgb) * 0.0702702;
  gl_FragColor = vec4(s, 1.0);
}
`,Ce=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uGlow;
uniform float uOpacity;
uniform vec2 uDiveFocus;
uniform float uDiveZoom;
uniform float uDiveTurn;
uniform float uDiveCenter;
uniform float uDiveAspect;
uniform vec2 uEntrance;
vec3 aces(vec3 x) { return clamp((x * (2.51*x + 0.03)) / (x * (2.43*x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec2 scale = vec2(uDiveAspect, 1.0);
  vec2 center = mix(uDiveFocus, vec2(.5), uDiveCenter) + vec2(0.0, uEntrance.x);
  vec2 local = (vUv - center) * scale / (uDiveZoom * uEntrance.y);
  float s = sin(uDiveTurn), c = cos(uDiveTurn);
  vec2 source = uDiveFocus + vec2(c * local.x + s * local.y, -s * local.x + c * local.y) / scale;
  // Hide the enlarged cached texture at the edges while leaving the shadow visible.
  float vignette = smoothstep(6.0, 6.9, uDiveZoom) * smoothstep(.42, 1.05, length((vUv - .5) * 2.0));
  if (source.x < 0.0 || source.x > 1.0 || source.y < 0.0 || source.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, vignette * uOpacity); return; }
  vec4 sampleScene = texture2D(uScene, source);
  vec3 linearScene = sampleScene.rgb / max(vec3(0.002), 1.0 - sampleScene.rgb);
  vec3 glow = uGlow > 0.5 ? texture2D(uBloom, source).rgb : vec3(0.0);
  vec3 color = pow(max(aces((linearScene + glow * 0.26) * 0.9), 0.0), vec3(0.4545));
  color *= 1.0 - vignette;
  float alpha = max(vignette, max(sampleScene.a, max(max(color.r, color.g), color.b)));
  // The cached viewport's edges must not look like a rectangular card as it rises.
  float entering = clamp((abs(uEntrance.x) + abs(uEntrance.y - 1.0)) * 8.0, 0.0, 1.0);
  float edge = smoothstep(0.0, .025, min(min(source.x, 1.0 - source.x), min(source.y, 1.0 - source.y)));
  gl_FragColor = vec4(color / max(alpha, 0.00001), alpha * uOpacity * mix(1.0, edge, entering));
}
`;function we(e){let t=new O({uniforms:{uAspect:{value:1},uTime:{value:0},uRingRadius:{value:0},uRing:{value:0},uFlash:{value:0},uRim:{value:0}},vertexShader:`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,fragmentShader:`
      precision highp float;
      varying vec2 vUv;
      uniform float uAspect, uTime, uRingRadius, uRing, uFlash, uRim;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      void main() {
        vec3 hot = vec3(1.0, .93, .82), warm = vec3(1.0, .56, .2), violet = vec3(.62, .55, .98);
        vec2 p = (vUv - .5) * vec2(uAspect, 1.0) * 2.0;
        // 1.0 at the screen corners, so the ring always leaves the frame.
        float r = length(p) / length(vec2(uAspect, 1.0));
        float angle = atan(p.y, p.x);
        vec2 around = vec2(cos(angle), sin(angle));
        float width = .012 + .05 * uRingRadius;
        float d = (r - uRingRadius) / width;
        float grain = .65 + .35 * noise(around * 11.0 + uRingRadius * 5.0);
        // Hot leading edge, violet wake: the ring reads as light travelling outwards.
        vec3 ringTint = mix(hot, mix(warm, violet, .55), smoothstep(-.5, 1.5, -d));
        vec3 color = ringTint * exp(-d * d) * grain * uRing * .9;
        float streaks = smoothstep(.55, 1.0, noise(around * 46.0)) * smoothstep(.0, .6, r / max(uRingRadius, .001)) * step(r, uRingRadius);
        color += mix(violet, hot, .4) * streaks * uRing * .28;
        color += hot * uFlash * (exp(-r * r * 40.0) * 1.1 + exp(-r * r * 6.0) * .22);
        // Elliptical screen distance: 1.0 at edge midpoints, ~1.41 at corners.
        float e = length((vUv - .5) * 2.0);
        float edge = smoothstep(.7, 1.38, e);
        float swirl = .55 + .45 * sin(angle * 9.0 + log(max(e, .01)) * 7.0 - uTime * .12);
        float drift = noise(around * 4.0 + vec2(uTime * .04, -uTime * .03));
        float line = exp(-pow((e - 1.05) / .035, 2.0)) * (.4 + .6 * drift);
        vec3 tint = mix(warm, violet, .5 + .5 * sin(angle * 2.0 + uTime * .05));
        color += tint * uRim * (edge * swirl * drift * .22 + line * .16);
        color += (hash(gl_FragCoord.xy) - .5) / 255.0;
        gl_FragColor = vec4(max(color, 0.0), 1.0);
      }
    `,transparent:!0,blending:2,depthWrite:!1,depthTest:!1}),n=new pe(2,2),r=new v,i=new b,a=new de(n,t);a.frustumCulled=!1,r.add(a);let o=t.uniforms;return{update(e,t){o.uRingRadius.value=e.ringRadius,o.uRing.value=e.ring,o.uFlash.value=e.flash,o.uRim.value=e.rim,o.uTime.value=t},resize(e,t){o.uAspect.value=e/t},render(){if(o.uRing.value+o.uFlash.value+o.uRim.value<.001)return;let t=e.autoClear;e.autoClear=!1,e.render(r,i),e.autoClear=t},dispose(){n.dispose(),t.dispose()}}}function Te(e){let t=e(),n=e(),r=e(),i=e(),a=e(),o=0,s=1,c=1;return{target:t,bloomA:n,bloomB:r,get read(){return i},get write(){return a},get frames(){return o},get width(){return s},get height(){return c},resize(e,l){s=Math.max(1,Math.round(e)),c=Math.max(1,Math.round(l)),t.setSize(s,c),i.setSize(s,c),a.setSize(s,c),n.setSize(Math.max(1,Math.floor(s/4)),Math.max(1,Math.floor(c/4))),r.setSize(n.width,n.height),o=0},advance(){[i,a]=[a,i],o++},reset(){o=0}}}function Ee(e){let t=279401,n=()=>(t=Math.imul(t,1664525)+1013904223>>>0,t/4294967296),r=new Float32Array(e*4),i=[[.15,2.25,4.55],[1.05,3.55,5.65]],a=[.85,.63,.78];for(let t=0;t<e;t++){let e=n();if(e<.82){let e=n()*2-1,i=n(),a=i<.73,o=Math.floor(n()*3),s=a?o*Math.PI*2/3+e*1.65+.28*Math.sin(e*5+o*1.7)+(n()+n()-1)*.28:n()*Math.PI*2,c=a?.73+n()*.27:Math.cbrt(n())*(i<.84?.45:1),l=Math.sqrt(Math.max(0,1-e*e))*c;r[t*4]=Math.cos(s)*l,r[t*4+1]=Math.sin(s)*l,r[t*4+2]=e*c}else{let o=i[e<.91?0:1],s=Math.floor(n()*o.length),c=o[s]+(n()*2-1)*a[s];r[t*4]=Math.cos(c),r[t*4+1]=Math.sin(c),r[t*4+2]=(n()+n()-1)*.22,r[t*4+3]=e<.91?1:2}}return r}function De(e){let t=694783,n=()=>(t=Math.imul(t,1664525)+1013904223>>>0,t/4294967296),r=new Float32Array(e);for(let t=0;t<e;t++){let e=n()<.02,i=n();r[t]=e?2+i*1.5:1}return r}var I=`
attribute vec3 aGalaxy;
attribute vec3 aField;
attribute vec4 aDetail;
uniform float uProgress, uTime, uAspect, uHeight, uCompact, uNebulaScale;
uniform vec2 uPointer, uFocus;
uniform float uFocusStrength;
varying vec3 vColor;
varying float vAlpha, vHalo;
mat2 rotate(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
void main() {
  float enter = smoothstep(.26, .39, uProgress);
  float transit = smoothstep(.54, .72, uProgress);
  float settle = smoothstep(.75, .96, uProgress);
  float ambient = aDetail.z;
  vec3 cloud = position;
  cloud.xz = rotate(uTime * .055 + uPointer.x * .07) * cloud.xz;
  cloud.xy = rotate(-.28) * cloud.xy;
  cloud *= mix(uNebulaScale, 1.0, ambient);
  cloud += sin(cloud.yzx * 1.8 + uTime * .28 + aDetail.x * 6.28) * .035 * (1.0 - ambient);
  vec3 field = aField;
  // A scroll-driven dolly through a deep field; no time-based wrapping or jumps.
  field.z += transit * 3.5;
  field.xy += vec2(sin(uTime * .10 + aDetail.x * 6.28), cos(uTime * .08 + aDetail.y * 6.28)) * .10;
  vec3 disk = aGalaxy;
  disk.xz = rotate(uTime * .035) * disk.xz;
  disk.xy = rotate(-.24) * disk.xy;
  float formation = smoothstep(.29, .50, uProgress);
  vec3 scattered = aField;
  scattered.xy = rotate((1.0 - formation) * 3.8) * scattered.xy;
  vec3 p = mix(mix(scattered, cloud, formation), field, transit);
  p = mix(p, disk, settle * (1.0 - ambient));
  // Near dust responds more strongly than the far field.
  p.xy -= uPointer * vec2(.24, .15) * (1.0 + max(p.z, 0.0) * .10);
  // Dolly into the gathering stars, then ease back into the later field.
  float arrival = smoothstep(.28, .50, uProgress) * (1.0 - smoothstep(.54, .72, uProgress));
  float depth = max(1.0, 9.8 - p.z - arrival * 1.05 - sin(transit * 3.14159) * .85);
  float fit = mix(1.0, min(.82, uAspect * 1.15), uCompact);
  vec2 center = mix(vec2(0.0, -.18), mix(vec2(.50, -.02), vec2(0.0, .43), uCompact), settle);
  center.y -= arrival * .035;
  vec2 projected = p.xy * 2.414 * fit / vec2(uAspect, 1.0) / depth;
  vec2 delta = (projected + center - uPointer) * vec2(uAspect, 1.0);
  projected += delta / vec2(uAspect, 1.0) * exp(-dot(delta, delta) * 12.0) * .025;
  gl_Position = vec4((projected + center) * depth, 0.0, depth);
  float rare = step(.994, aDetail.w);
  float size = mix(.014 + pow(aDetail.y, 3.0) * .040, .043, rare);
  float px = size * uHeight * 1.207 * fit / depth;
  vHalo = rare;
  gl_PointSize = clamp(px * mix(1.0, 2.4, rare), 1.0, 24.0);
  vec2 focusDelta = (projected + center - uFocus) * vec2(uAspect, 1.0);
  float focus = exp(-dot(focusDelta, focusDelta) * 10.0) * uFocusStrength;
  gl_PointSize *= 1.0 + focus * .38;
  vec3 ice = vec3(.025, .46, 1.0);
  vec3 violet = vec3(.50, .10, .95);
  float hue = smoothstep(-2.3, 2.3, p.y + p.x * .28);
  vec3 tint = mix(ice, violet, hue);
  tint = mix(tint, vec3(.70, .86, 1.0), aDetail.x * .10 + rare * .38);
  float light = mix(.24, 2.4, smoothstep(-2.5, 2.8, p.z));
  vColor = tint * light * (1.0 + rare * .8) * (1.0 + arrival * .65);
  vColor *= 1.0 + focus * .7;
  float twinkle = .88 + .12 * sin(uTime * (.45 + aDetail.x) + aDetail.y * 40.0);
  vAlpha = enter * twinkle * mix(.85, .42, ambient) * smoothstep(1.0, 2.5, depth) * min(1.0, px);
}
`,L=`
varying vec3 vColor;
varying float vAlpha, vHalo;
void main() {
  vec2 uv = gl_PointCoord - .5;
  float r = length(uv);
  if (r > .5) discard;
  float soft = 1.0 - smoothstep(.02, .5, r);
  float core = exp(-r * r * mix(28.0, 180.0, vHalo));
  float light = core + soft * soft * mix(.28, .12, vHalo);
  gl_FragColor = vec4(vColor * light * vAlpha, 1.0);
}
`,R={uniforms:{tDiffuse:{value:null},uTime:{value:0},uResolution:{value:new k(1,1)},uAmount:{value:0}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float uTime, uAmount;
    uniform vec2 uResolution;
    varying vec2 vUv;
    void main() {
      vec2 d = vUv - .5;
      vec2 split = d * dot(d,d) * .004 * uAmount;
      vec3 original = texture2D(tDiffuse,vUv).rgb;
      vec3 c = original;
      c.r = texture2D(tDiffuse,vUv+split).r;
      c.b = texture2D(tDiffuse,vUv-split).b;
      c = 1.0 - exp(-max(c,0.0) * 1.00);
      c = mix(c*12.92, 1.055*pow(c,vec3(1.0/2.4))-.055, step(vec3(.0031308),c));
      c *= 1.0 - smoothstep(.13,.55,dot(d,d)) * .28 * uAmount;
      float noise = fract(sin(dot(floor(vUv*uResolution),vec2(12.9898,78.233)) + floor(uTime*12.0)) * 43758.5453);
      c += (noise-.5) * .006 * uAmount;
      gl_FragColor = vec4(mix(original,max(c,0.0),uAmount),1.0);
    }
  `};function Oe(e,t,n){let r=te(36e3),i=new E;i.setAttribute(`position`,new w(r.cloud,3)),i.setAttribute(`aGalaxy`,new w(r.galaxy,3)),i.setAttribute(`aField`,new w(r.field,3)),i.setAttribute(`aDetail`,new w(r.detail,4));let a=new O({vertexShader:I,fragmentShader:L,uniforms:{uProgress:{value:0},uTime:{value:0},uAspect:{value:1},uHeight:{value:900},uCompact:{value:0},uNebulaScale:{value:1},uPointer:{value:new k},uFocus:{value:new k},uFocusStrength:{value:0}},transparent:!0,blending:2,depthWrite:!1,depthTest:!1}),s=new fe(i,a);s.frustumCulled=!1,s.visible=!1,t.add(s);let c=new le(1,1,{type:_e,depthBuffer:!1}),l=new T(e,c),u=new C(t,n),d=new D(new k(1,1),.42,.48,.38),f=new me(R);l.addPass(u),l.addPass(d),l.addPass(f);let ee=0,p=0,ne=e=>{let t=e.detail;ee=+!!t.active,t.active&&a.uniforms.uFocus.value.set(t.x,t.y)};return window.addEventListener(`yien:constellation-focus`,ne),{update(e,t,n,r){s.visible=e>.26,a.uniforms.uProgress.value=e,a.uniforms.uNebulaScale.value=o(e),a.uniforms.uTime.value=t,a.uniforms.uPointer.value.copy(n).multiplyScalar(r),a.uniforms.uFocusStrength.value=x.lerp(a.uniforms.uFocusStrength.value,ee,1-Math.exp(-Math.min(.1,Math.max(0,t-p))*7)),p=t,f.uniforms.uTime.value=t,f.uniforms.uAmount.value=x.smoothstep(e,.26,.4)},resize(t,n,r,o){let s=Math.min(e.getPixelRatio(),Math.sqrt(22e5/(t*n)));l.setPixelRatio(s),l.setSize(t,n),d.enabled=r!==`low`;let c=r===`high`?36e3:r===`medium`?22e3:1e4;i.setDrawRange(0,Math.floor(c*Math.min(1,Math.max(0,o/23e3)))),a.uniforms.uAspect.value=t/n,a.uniforms.uHeight.value=n*s,a.uniforms.uCompact.value=+(t/n<1.2),f.uniforms.uResolution.value.set(t*s,n*s)},render(e){l.render(e)},dispose(){window.removeEventListener(`yien:constellation-focus`,ne),t.remove(s),i.dispose(),a.dispose(),d.dispose(),f.dispose(),u.dispose(),l.dispose()}}}function ke(e){let t=ie(1800),n=new E;n.setAttribute(`position`,new w(t.positions,3)),n.setAttribute(`aDetail`,new w(t.detail,2));let r=new O({uniforms:{uTravel:{value:0},uVelocity:{value:0},uOpacity:{value:0},uAspect:{value:1},uHeight:{value:900},uDpr:{value:1},uFocus:{value:new k}},vertexShader:`
      attribute vec2 aDetail;
      uniform float uTravel, uVelocity, uOpacity, uAspect, uHeight, uDpr;
      uniform vec2 uFocus;
      varying vec2 vDirection;
      varying float vLength, vWidth, vSize, vAlpha;
      varying vec3 vColor;
      void main() {
        float depth = position.z - uTravel;
        float safeDepth = max(.7, depth);
        vec2 scale = vec2(uAspect, 1.0);
        vec2 head = position.xy * ${p} / safeDepth / scale;
        // The tail uses the previous exposure position, and changes direction
        // on reverse scroll. Pausing collapses it back to a round star.
        vec2 tail = position.xy * ${p} / max(.7, depth + uVelocity * .038) / scale;
        vec2 delta = (head - tail) * scale * uHeight * .5;
        float lengthPx = length(delta);
        vDirection = lengthPx > .001 ? delta / lengthPx : vec2(1.0, 0.0);
        vLength = min(lengthPx, 60.0 * uDpr);
        vWidth = clamp((.55 + aDetail.x * .45) * 18.0 / safeDepth, .45, 1.5) * uDpr;
        vSize = min(80.0 * uDpr, max(4.0 * vWidth, vLength + 4.0 * vWidth));
        gl_PointSize = vSize;
        gl_Position = vec4(uFocus + (head + tail) * .5, 0.0, 1.0);
        float edge = smoothstep(.20, .65, length(head * scale));
        vAlpha = uOpacity * edge * smoothstep(.8, 3.0, depth) * (.44 + aDetail.x * .65);
        vColor = mix(vec3(.28, .58, 1.0), vec3(.80, .86, 1.0), aDetail.y);
      }
    `,fragmentShader:`
      varying vec2 vDirection;
      varying float vLength, vWidth, vSize, vAlpha;
      varying vec3 vColor;
      void main() {
        vec2 p = (vec2(gl_PointCoord.x, 1.0-gl_PointCoord.y)-.5) * vSize;
        float along = dot(p, vDirection);
        float across = dot(p, vec2(-vDirection.y, vDirection.x));
        float end = max(0.0, abs(along)-vLength*.5);
        float d2 = (across*across + end*end) / (vWidth*vWidth);
        float light = exp(-d2*2.0) + exp(-d2*.35)*.14;
        float taper = mix(1.0, .35 + .65*smoothstep(-vLength*.5,vLength*.5+.01,along), min(1.0,vLength/3.0));
        gl_FragColor = vec4(vColor * light * taper * vAlpha, 1.0);
      }
    `,transparent:!0,blending:2,depthWrite:!1,depthTest:!1}),i=new v,a=new b,o=new fe(n,r);o.frustumCulled=!1,i.add(o);let s=0,c=0;return{update(e,t,n){let i=m(e),a=t>0?(i.travel-s)/t:0;c+=(a-c)*(1-Math.exp(-t*18)),s=i.travel,r.uniforms.uTravel.value=i.travel,r.uniforms.uVelocity.value=c,r.uniforms.uOpacity.value=i.opacity,r.uniforms.uFocus.value.copy(n)},resize(t,i,a){n.setDrawRange(0,a===`high`?1800:a===`medium`?1100:550),r.uniforms.uAspect.value=t/i,r.uniforms.uHeight.value=i*e.getPixelRatio(),r.uniforms.uDpr.value=e.getPixelRatio()},render(){if(r.uniforms.uOpacity.value<.001)return;let t=e.autoClear;e.autoClear=!1,e.render(i,a),e.autoClear=t},dispose(){n.dispose(),r.dispose()}}}var Ae=.75,je=.25,Me=`
  attribute float mote;
  attribute float layer;
  attribute float accentGain;
  uniform float pixelRatio;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  uniform float uAspect;
  uniform vec2 uLensCenter;
  uniform float uLensRadius;
  uniform float uCinematic;
  uniform float uProgress;
  uniform float uTime;
  uniform float uEntranceTravel;
  uniform float uCompact;
  uniform vec2 uFlyby;
  uniform vec2 uFlybyCenter;
  varying vec3 tint;
  varying float vLayer;
  varying float vArc;
  varying float vPointSize;
  varying float vGlow;
  varying float vHighlight;
  varying float vTrail;
  varying float vAccentGain;
  varying float vAccentHue;
  varying float vBloomScale;
  varying float vTwinkle;
  varying vec2 vLensOffset;
  varying vec2 vRadial;
  varying vec2 vEdgeDirection;
  varying float vEdgeStrength;
  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec2 screen = clip.xy / max(clip.w, 0.00001);
    if (uEntranceTravel > 0.0) {
      screen.y = mod(screen.y + uEntranceTravel * mix(.7, 1.2, clamp(layer, 0.0, 1.0)) + 1.3, 2.6) - 1.3;
    }
    vec2 scale = vec2(uAspect, 1.0);
    float arc = 1.0;
    float flyMask = step(.24, mote) * step(mote, .56);
    float flyDepth = fract(abs(position.x * .029 + position.y * .043 + position.z * .071));
    float flyScale = 1.0 + uFlyby.x * (.45 + .50 * flyDepth) * flyMask;
    if (clip.w > 0.0) {
      vec2 delta = (uPointer - screen) * scale;
      float depthPull = layer > 1.5 ? 1.25 : (layer > .5 ? 1.0 : .65);
      float pull = exp(-dot(delta, delta) * 8.0) * 0.085 * uPointerStrength * depthPull;
      float parallax = layer > 1.5 ? .014 : (layer > .5 ? .005 : .0015);
      screen += delta / scale * pull + uPointer * parallax * uPointerStrength;
      // The independent 3D environment owns the particle chapters; preserve
      // this original field for the opening black hole and its approach.
      screen = uFlybyCenter + (screen - uFlybyCenter) * flyScale;
      vec2 relative = (screen - uLensCenter) * scale;
      float sourceRadius = length(relative);
      if (layer < 1.5 && uLensRadius > 0.0 && sourceRadius < 4.0 * uLensRadius) {
        vec2 direction = sourceRadius > 0.00001 ? relative / sourceRadius : vec2(1.0, 0.0);
        float imageRadius = .5 * (sourceRadius + sqrt(sourceRadius * sourceRadius + 4.0 * uLensRadius * uLensRadius));
        float falloff = 1.0 - smoothstep(2.0 * uLensRadius, 4.0 * uLensRadius, sourceRadius);
        relative += direction * (imageRadius - sourceRadius) * falloff;
        arc += 7.0 * (1.0 - smoothstep(0.0, 2.0 * uLensRadius, sourceRadius));
        screen = uLensCenter + relative / scale;
      }
      clip.xy = screen * clip.w;
    }
    gl_Position = clip;
    // Let the near-field radial flight carry the approach; keep the original
    // lens arcs at rest, but soften their competing tangential stretch in motion.
    arc = mix(arc, 1.0, uFlyby.x * .85);
    float starSize = layer > 1.5 ? 4.5 + mote * 2.0 : (layer > .5 ? 1.8 + mote * .8 : 1.1 + mote * .6);
    float cinematicAmount = uCinematic * smoothstep(0.0, .15, uProgress) * mix(1.0, .65, uCompact);
    gl_PointSize = starSize * 1.12 * pixelRatio * arc * mix(1.0, 1.4, cinematicAmount) * flyScale * 1.25;
    float detail = fract(abs(position.x * .038 + position.z * .057));
    // Only the seeded accent stars get a larger sprite for their local halo.
    float brightStar = step(1.5, accentGain);
    gl_PointSize = mix(gl_PointSize, min(gl_PointSize * 3.2, 16.0 * pixelRatio), brightStar);
    // Reserve a wider sprite only for bright points; the sharp core retains its size.
    float luminous = brightStar;
    vBloomScale = mix(1.0, 2.2, luminous);
    gl_PointSize = min(gl_PointSize * vBloomScale, 28.0 * pixelRatio);
    // A few background stars stretch radially during the brief passage.
    float passage = uCinematic * smoothstep(.21, .26, uProgress) * (1.0 - smoothstep(.35, .40, uProgress));
    vTrail = max(passage * step(.56, mote) * (1.0 - step(.80, mote)), uFlyby.y * flyMask * .30) * .20;
    gl_PointSize = mix(gl_PointSize, min(gl_PointSize * 3.5, 10.0 * pixelRatio), vTrail);
    vLensOffset = (screen - uLensCenter) * scale;
    vec2 radialOffset = (screen - mix(uLensCenter, uFlybyCenter, uFlyby.y * flyMask)) * scale;
    vRadial = length(radialOffset) > 0.00001 ? normalize(radialOffset) : vec2(1.0, 0.0);
    vEdgeDirection = length(screen) > 0.00001 ? normalize(screen) : vec2(1.0, 0.0);
    vEdgeStrength = smoothstep(.48, 1.05, length(screen));
    vPointSize = gl_PointSize;
    vArc = arc;
    float twinkleDepth = .18 + .12 * detail;
    vTwinkle = 1.0 - twinkleDepth + twinkleDepth * sin(uTime * (.42 + detail * 1.15) + position.x * .11 + position.y * .08 + position.z * .13);
    tint = color * mix(1.0, 1.4, cinematicAmount) * (1.0 + vTrail * 8.0);
    vGlow = 0.0;
    vAccentGain = accentGain;
    vAccentHue = fract(accentGain * 3.79);
    vHighlight = 0.0;
    vLayer = layer;
  }
`,Ne=`
  varying vec3 tint;
  varying float vLayer;
  varying float vArc;
  varying float vPointSize;
  varying float vGlow;
  varying float vHighlight;
  varying float vTrail;
  varying float vAccentGain;
  varying float vAccentHue;
  varying float vBloomScale;
  varying float vTwinkle;
  varying vec2 vLensOffset;
  varying vec2 vRadial;
  varying vec2 vEdgeDirection;
  varying float vEdgeStrength;
  uniform float uLensRadius;
  uniform float uBufferHeight;
  uniform float uEnvironment;
  void main() {
    vec2 local = vec2(gl_PointCoord.x - .5, .5 - gl_PointCoord.y) * 2.0;
    vec2 tangent = vec2(-vRadial.y, vRadial.x);
    float along = dot(local, tangent);
    float across = dot(local, vRadial);
    // Curve the stretched point along the shadow, rather than drawing a straight streak.
    float radialPixels = length(vLensOffset) * .5 * uBufferHeight;
    across += along * along * vPointSize / max(4.0 * radialPixels, 1.0);
    float lensRadius2 = along * along + across * across * vArc * vArc;
    float trailRadius2 = across * across + along * along * 8.0;
    float radius2 = mix(lensRadius2, trailRadius2, vTrail);
    // Blend the formed stars into a softer atmospheric field.
    float clusteredCore = smoothstep(1.0, 2.2, vBloomScale) * vGlow;
    float coreRadius2 = radius2 * vBloomScale * vBloomScale * mix(1.0, 2.6, clusteredCore);
    float coverage = vLayer > 1.5
      ? exp(-coreRadius2 * 2.4) * (1.0 - smoothstep(.25, 1.0, coreRadius2)) * .55
      : exp(-coreRadius2 * 3.5);
    float halo = exp(-coreRadius2 * 3.8) * (1.0 - smoothstep(.55, 1.0, coreRadius2));
    float core = exp(-coreRadius2 * 32.0);
    coverage = mix(coverage, halo * .78 + core * (1.0 + vHighlight * 1.8), vGlow);
    // Soft light stays inside each sprite; no fullscreen bloom pass is needed.
    coverage += exp(-coreRadius2 * 2.0) * (1.0 - smoothstep(.55, 1.0, coreRadius2)) * .12;
    float brightStar = step(1.5, vAccentGain);
    float coloredHalo = exp(-coreRadius2 * 2.5) * (1.0 - smoothstep(.55, 1.0, coreRadius2));
    coverage = mix(coverage, max(coverage, coloredHalo * .7 + core), brightStar);
    float softBody = exp(-radius2 * 5.0) * .34 + exp(-radius2 * 2.5) * .12;
    coverage = mix(coverage, softBody, vGlow * .42);
    vec2 fragmentOffset = vLensOffset + local * vPointSize / max(uBufferHeight, 1.0);
    float shadow = uLensRadius > .00001 ? smoothstep(uLensRadius * .96, uLensRadius * .98, length(fragmentOffset)) : 1.0;
    // Split color gently outwards at screen edges, within the existing sprites.
    float chroma = dot(local, vEdgeDirection) * .18 * vEdgeStrength;
    vec3 starColor = tint * vec3(1.0 + chroma, 1.0, 1.0 - chroma);
    starColor = mix(starColor, vec3(1.4, 1.45, 1.6) * (1.0 + vHighlight), core * vHighlight * .85);
    vec3 hue = mix(vec3(.025, .50, 1.0), vec3(.68, .07, 1.0), vAccentHue);
    vec3 brightColor = mix(hue * .48, vec3(1.0, .97, 1.0), smoothstep(.35, .85, core));
    starColor = mix(starColor, brightColor, brightStar);
    float bloom = (vBloomScale - 1.0) * exp(-radius2 * 3.6) * (1.0 - smoothstep(.6, 1.0, radius2));
    vec3 bloomColor = mix(mix(vec3(.06, .64, 1.0), vec3(.64, .22, 1.0), vAccentHue), hue, brightStar);
    vec3 emitted = starColor * mix(3.0, 1.5, vGlow) * (1.5 * vAccentGain) * coverage * mix(.75, 2.5, vTrail);
    gl_FragColor = vec4((emitted + bloomColor * bloom * .48) * shadow * vTwinkle * mix(1.0, .08, uEnvironment), 1.0);
  }
`;function z(e,t,o,p=1.5,te){let m=t,ie=navigator,_=f(g(c(),navigator.hardwareConcurrency||4,ie.deviceMemory??8)),b=_.tier,me=_.tier!==`low`,C=ae(),T=()=>{},D=new ue({alpha:!0,antialias:!1,powerPreference:`low-power`}),_e=[],A=e=>(_e.push(e),e),j=0,I=1,L=1,R=0,z=0,B=!1,V=!0,H=!1,Pe=0,Fe=!1,Ie=!1,U=l(!1,0),Le=()=>{},Re,ze,W={yaw:0,pitch:0},G=0,Be=0,Ve=0,He=0,K={x:.5,y:.5,proximity:0},Ue=.5,We=.5,Ge=0,Ke=0,qe=0,Je=window.matchMedia(`(hover: hover) and (pointer: fine)`),q=()=>{W={yaw:0,pitch:0},Ge=0,K.proximity=0},Ye=e=>{if(e.pointerType!==`mouse`||!Je.matches||e.buttons!==0||r()){q();return}W=M(e.clientX,e.clientY,I,L,m.sensitivity),K=P(e.clientX,e.clientY,I,L,I<=768?.58:m.x/100,I<=768?.22:m.y/100),Ke<.005&&(Ue=K.x,We=K.y),Ge=1},Xe=()=>{document.visibilityState!==`visible`&&(q(),_.reset(),C.reset()),et()},Ze=e=>{e.preventDefault(),o()},Qe=e=>{let t=e.detail,r=l(t?.active,t?.progress);r.active!==U.active&&(r.active&&(Ve=G,He=Be,b=_.tier,me=_.tier!==`low`),q(),_.reset(),C.reset(),r.active||Le()),U=r,n(V,U)?et():(cancelAnimationFrame(j),j=0)},$e=()=>{B||(B=!0,cancelAnimationFrame(j),Re?.disconnect(),ze?.disconnect(),document.removeEventListener(`visibilitychange`,Xe),window.removeEventListener(`yien:cinematic-progress`,Qe),window.removeEventListener(`pointermove`,Ye),window.removeEventListener(`pointerdown`,q),window.removeEventListener(`pointerup`,Ye),window.removeEventListener(`pointercancel`,q),window.removeEventListener(`blur`,q),document.documentElement.removeEventListener(`pointerleave`,q),D.domElement.removeEventListener(`webglcontextlost`,Ze),_e.forEach(e=>e.dispose()),D.dispose(),D.domElement.remove())};function et(){!B&&n(V,U)&&document.visibilityState===`visible`&&!j&&(C.reset(),_.reset(),j=requestAnimationFrame(nt))}let tt=()=>{};function nt(e){if(j=0,B||!n(V,U)||document.visibilityState!==`visible`)return;if(r()&&!U.active){H||=(q(),_.reset(),!0),C.reset(),j=requestAnimationFrame(nt);return}H&&(H=!1,C.reset());let t=C.tick(e);if(t!==null){let e=Math.min(t/1e3,.05);t&&_.sample(t,U.active?b:`high`)&&T(),tt(e)}j=requestAnimationFrame(nt)}try{D.setPixelRatio(Math.min(window.devicePixelRatio||1,p)),D.domElement.setAttribute(`aria-hidden`,`true`),e.appendChild(D.domElement);let n=new v,r=new he(45,1,.1,700),c=18427,f=()=>(c=Math.imul(c,1664525)+1013904223>>>0,c/4294967296);for(let e=0;e<25e4;e++)f();let ie=new Float32Array(15e4),g=new Float32Array(15e4),ae=new Float32Array(5e4),ue=new Float32Array(5e4);for(let e=0;e<5e4;e++){let t=f()*Math.PI*2,n=Math.acos(1-2*f()),r=.15+f()*.35,i=e%1e3,a=i<7?2:+(i<307),o=a===2?120:a===1?240:430;ue[e]=a,ie.set([Math.sin(n)*Math.cos(t)*o,Math.cos(n)*o,Math.sin(n)*Math.sin(t)*o],e*3),g.set([r*.82,r*.88,r],e*3),ae[e]=f()}let b=De(5e4),_e=Ee(5e4),j=A(new E);j.setAttribute(`position`,new w(ie,3)),j.setAttribute(`color`,new w(g,3)),j.setAttribute(`mote`,new w(ae,1)),j.setAttribute(`layer`,new w(ue,1)),j.setAttribute(`accentGain`,new w(b,1));let M=A(new O({vertexShader:Me,fragmentShader:Ne,uniforms:{pixelRatio:{value:1},uPointer:{value:new k(0,0)},uPointerStrength:{value:0},uAspect:{value:1},uLensCenter:{value:new k},uLensRadius:{value:0},uCinematic:{value:0},uProgress:{value:0},uTime:{value:0},uEntranceTravel:{value:0},uCompact:{value:0},uFlyby:{value:new k},uFlybyCenter:{value:new k},uBufferHeight:{value:1},uEnvironment:{value:0}},vertexColors:!0,transparent:!0,blending:2,depthWrite:!1}));n.add(new fe(j,M));let P=44e3,B=6e3,H=A(new E),Je=new Float32Array(B),nt=new Float32Array(B*3);for(let e=0;e<B;e++){Je[e]=.81+ae[P+e]*.18;for(let t=0;t<3;t++)nt[e*3+t]=g[(P+e)*3+t]*.65}H.setAttribute(`position`,new w(ie.subarray(P*3),3)),H.setAttribute(`color`,new w(nt,3)),H.setAttribute(`mote`,new w(Je,1)),H.setAttribute(`layer`,new w(new Float32Array(B),1)),H.setAttribute(`accentGain`,new w(b.subarray(P),1)),n.add(new fe(H,M));let rt=new S(`#05070d`),it=new S(`#010208`),at=new S,ot=A(Oe(D,n,r)),st=A(ke(D)),ct=A(we(D)),lt=new ge(-1,1,1,-1,0,1),ut=A(new pe(2,2)),dt=new v,ft=()=>A(new le(1,1,{depthBuffer:!1,stencilBuffer:!1})),J=Te(ft),pt=Te(ft),Y=J;Le=()=>{J.reset(),pt.reset()};let mt=[[.5,.333],[.25,.667],[.75,.111],[.125,.444],[.625,.778],[.375,.222],[.875,.556],[.0625,.889]],ht=new v,gt=(e,t,n=!1)=>A(new O({vertexShader:`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,fragmentShader:e,uniforms:t,transparent:n,depthTest:!1,depthWrite:!1})),_t=gt(xe,{uCur:{value:J.target.texture},uPrev:{value:J.read.texture},uAlpha:{value:1}}),vt=gt(Se,{uTex:{value:J.read.texture},uTexel:{value:new k(1,1)},uDecode:{value:1},uPack:{value:1},uThreshold:{value:.85}}),X=gt(F,{uTex:{value:J.bloomA.texture},uStep:{value:new k}}),Z=gt(Ce,{uScene:{value:J.read.texture},uBloom:{value:J.bloomA.texture},uGlow:{value:1},uOpacity:{value:1},uDiveFocus:{value:new k(.5,.5)},uDiveZoom:{value:1},uDiveTurn:{value:0},uDiveCenter:{value:0},uDiveAspect:{value:1},uEntrance:{value:new k(0,1)}},!0),yt=new de(ut,_t);ht.add(yt);let bt=(e,t)=>{yt.material=e,D.setRenderTarget(t),D.render(ht,lt)},Q={uRes:{value:new k(1,1)},uCamPos:{value:new y},uRight:{value:new y},uUp:{value:new y},uFwd:{value:new y},uTanHalf:{value:Math.tan(21*Math.PI/180)},uFocus:{value:new k(.65,.52)},uSkyR:{value:36},uDiskIn:{value:3},uDiskOut:{value:15},uThick:{value:.26},uDensity:{value:1},uSpin:{value:.06*Math.PI*2},uWind:{value:new ve},uGrain:{value:.48},uBright:{value:1},uDoppler:{value:.35},uHot:{value:new S(`#FFF3DE`)},uMid:{value:new S(`#FF9838`)},uCool:{value:new S(`#8E3A0B`)},uEncode:{value:1},uJitter:{value:new k},uSeed:{value:0},uSteps:{value:u[_.tier].steps}},xt=A(new O({vertexShader:`void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,fragmentShader:be,uniforms:Q,depthTest:!1,depthWrite:!1}));dt.add(new de(ut,xt));let St=new v;St.add(new de(ut,Z));let Ct=new y,wt=new y,Tt=new y,$=new k(.65,.52),Et=new k(.5,.5),Dt=24,Ot=-1/0,kt=null;function At(e){m=e,j.setDrawRange(0,Math.min(e.stars,u[_.tier].stars)),H.setDrawRange(0,h(_.tier,e.stars)),$.set(I<=768?.58:e.x/100,I<=768?.78:1-e.y/100),M.uniforms.uLensCenter.value.set($.x*2-1,$.y*2-1),ot.resize(I,L,_.tier,e.stars),q()}At(t),tt=e=>{R+=e,z=a(z,U.progress,e),U.active||(z=U.progress);let t=l(U.active,z);G=N(G,W.yaw,e),Be=N(Be,W.pitch,e),Ue=N(Ue,K.x,e),We=N(We,K.y,e),Ke=N(Ke,Ge,e),qe=N(qe,K.proximity,e),M.uniforms.uPointer.value.set(Ue*2-1,1-We*2),M.uniforms.uPointerStrength.value=Ke;let o=se(t),c=oe(t),f=ne(te?.progress??1);Z.uniforms.uEntrance.value.set(f.holeY,f.scale),M.uniforms.uEntranceTravel.value=te?f.travel:0;let p=$,re=ce(t),h=me&&U.active&&t.progress<.272,g=I<=768?65:42,le=g+(h?re.fov-42:0),v=h?re.distance:24;Q.uTanHalf.value=Math.tan(le*Math.PI/360),Q.uFocus.value.lerpVectors(p,Et,h?re.center:0),!t.active||t.progress<.272?kt=null:kt??=R,ct.update(s(t,kt===null?0:R-kt),R);let ue=ye(24,g),y=Math.min(.98,p.y+ue*.32),b=d(t);M.uniforms.uFlyby.value.set(b.approach,b.trail),M.uniforms.uFlybyCenter.value.set(x.lerp(p.x*2-1,0,c.center),x.lerp(y*2-1,0,c.center)),st.update(t.active?t.progress:0,e,M.uniforms.uFlybyCenter.value),Z.uniforms.uDiveFocus.value.set(p.x,y),Z.uniforms.uDiveZoom.value=h?1:c.zoom,Z.uniforms.uDiveTurn.value=(h?0:c.turn)+.035*(1-f.rise),Z.uniforms.uDiveCenter.value=h?0:c.center,Z.uniforms.uDiveAspect.value=I/L,Z.uniforms.uOpacity.value=(h?1:o)*f.opacity,M.uniforms.uCinematic.value=t.active&&t.progress<.26?1:0,M.uniforms.uEnvironment.value=t.active?x.smoothstep(t.progress,.26,.4):0,ot.update(U.active?z:0,R,M.uniforms.uPointer.value,Ke),M.uniforms.uProgress.value=t.progress,M.uniforms.uTime.value=R,U.active&&i(R,z,I,L,_e,ie,ae),M.uniforms.uLensCenter.value.set(x.lerp(p.x*2-1,0,c.center),x.lerp(p.y*2-1,0,c.center)+f.holeY*2);let de=t.active?1-x.smoothstep(t.progress,.2,.29):1,fe=v>2.7?Math.min(1.4,ye(v,le)):1.4;M.uniforms.uLensRadius.value=(h?fe:ue*o*c.zoom)*de*f.scale*f.opacity;let pe=U.active?x.lerp(G,Ve,o):G,S=U.active?x.lerp(Be,He,o):Be,he=x.degToRad(pe),C=x.degToRad(-5.5+S);if(r.position.set(Math.sin(he)*Math.cos(C),Math.sin(C),Math.cos(he)*Math.cos(C)).multiplyScalar(m.distance),r.lookAt(Ct),r.setViewOffset(I,L,(.5-m.x/100)*I,(.5-m.y/100)*L,I,L),U.active&&!h&&(me||J.frames>0||o<=0)){D.setRenderTarget(null),D.setClearColor(at.lerpColors(rt,it,x.smoothstep(t.progress,.26,.4)),1),D.autoClear=!0,t.progress>.26?ot.render(e):D.render(n,r),!me&&o>0&&J.frames>0&&(Z.uniforms.uOpacity.value=o*f.opacity,D.autoClear=!1,D.render(St,lt)),st.render(),ct.render(),D.autoClear=!0;return}Q.uBright.value=1+qe*.18,Q.uThick.value=.26*(1+qe*.08);let w=Math.cos(C),ge=Q.uCamPos.value.set(v*w*Math.cos(he),v*Math.sin(C),v*w*Math.sin(he)),T=Q.uFwd.value.copy(ge).normalize().negate();wt.set(T.z,0,-T.x).normalize(),Tt.crossVectors(wt,T);let E=x.degToRad(-20)+(h?re.roll:0),O=Math.cos(E),ve=Math.sin(E);Q.uRight.value.copy(wt).multiplyScalar(O).addScaledVector(Tt,ve),Q.uUp.value.copy(wt).multiplyScalar(-ve).addScaledVector(Tt,O);let k=R/46%1,A=(k+.5)%1;Q.uWind.value.set(k*46,A*46,Math.abs(2*k-1),Q.uSpin.value*R*.05);let j=Math.abs(v-Dt)>v*5e-4;Dt=v,j&&(Ot=R);let P=h&&R-Ot<je?pt:J;P!==Y&&(Y=P,Y.reset()),Q.uRes.value.set(Y.width,Y.height),vt.uniforms.uTexel.value.set(1/Y.width,1/Y.height);let be=mt[Y.frames%mt.length];Q.uJitter.value.set(be[0]-.5,be[1]-.5),Q.uSeed.value=Y.frames%64*17.13,D.setRenderTarget(Y.target),D.setClearColor(0,0),D.clear(),D.render(dt,lt),_t.uniforms.uCur.value=Y.target.texture,_t.uniforms.uPrev.value=Y.read.texture;let xe=j?.65:Math.abs(G-W.yaw)+Math.abs(Be-W.pitch)>.02?.4:.14;_t.uniforms.uAlpha.value=Y.frames===0?1:ee(xe,e),bt(_t,Y.write),Y.advance();let Se=u[_.tier],{bloomA:F,bloomB:Ce}=Y;if(Se.bloom){vt.uniforms.uTex.value=Y.read.texture,bt(vt,F);let e=F.width,t=F.height;X.uniforms.uTex.value=F.texture,X.uniforms.uStep.value.set(1/e,0),bt(X,Ce),X.uniforms.uTex.value=Ce.texture,X.uniforms.uStep.value.set(0,1/t),bt(X,F),_.tier===`high`&&(X.uniforms.uTex.value=F.texture,X.uniforms.uStep.value.set(2.6/e,0),bt(X,Ce),X.uniforms.uTex.value=Ce.texture,X.uniforms.uStep.value.set(0,2.6/t),bt(X,F))}Z.uniforms.uGlow.value=+!!Se.bloom,Z.uniforms.uScene.value=Y.read.texture,Z.uniforms.uBloom.value=F.texture,D.setRenderTarget(null),D.setClearColor(`#05070d`,1),D.autoClear=!0,D.render(n,r),D.autoClear=!1,D.render(St,lt),h&&(st.render(),ct.render()),D.autoClear=!0,!Fe&&!Ie&&++Pe>=8&&(Fe=!0,te?.onReady())};let jt=()=>{I=Math.max(1,e.clientWidth),L=Math.max(1,e.clientHeight),r.aspect=I/L,r.updateProjectionMatrix();let t=u[_.tier];e.dataset.quality=_.tier,D.setPixelRatio(Math.min(window.devicePixelRatio||1,p,t.dpr)),D.setSize(I,L,!1),ot.resize(I,L,_.tier,m.stars),st.resize(I,L,_.tier),ct.resize(I,L),j.setDrawRange(0,Math.min(m.stars,t.stars)),H.setDrawRange(0,h(_.tier,m.stars)),Q.uSteps.value=t.steps,M.uniforms.pixelRatio.value=D.getPixelRatio(),M.uniforms.uAspect.value=I/L,M.uniforms.uCompact.value=+(I<=640||I/L<1.2);let{width:n,height:i}=re(I,L,_.tier,D.getPixelRatio());J.resize(n,i),pt.resize(n*Ae,i*Ae);let a=I<=768;Q.uTanHalf.value=Math.tan((a?65:42)*Math.PI/360),$.set(a?.58:m.x/100,a?.78:1-m.y/100),Q.uFocus.value.copy($),M.uniforms.uLensCenter.value.set($.x*2-1,$.y*2-1),M.uniforms.uLensRadius.value=ye(24,a?65:42),M.uniforms.uBufferHeight.value=L*D.getPixelRatio()};T=jt,ze=new ResizeObserver(jt),ze.observe(e);let Mt=document.getElementById(`top`);Mt&&(Re=new IntersectionObserver(([e])=>{V=e.isIntersecting,!V&&!U.active&&(q(),_.reset(),C.reset()),et()}),Re.observe(Mt));let Nt=document.getElementById(`cinematic`);return U=l(Nt?.dataset.active,Nt?.dataset.progress),window.addEventListener(`yien:cinematic-progress`,Qe),document.addEventListener(`visibilitychange`,Xe),window.addEventListener(`pointermove`,Ye,{passive:!0}),window.addEventListener(`pointerdown`,q,{passive:!0}),window.addEventListener(`pointerup`,Ye,{passive:!0}),window.addEventListener(`pointercancel`,q,{passive:!0}),window.addEventListener(`blur`,q),document.documentElement.addEventListener(`pointerleave`,q),D.domElement.addEventListener(`webglcontextlost`,Ze),D.debug.onShaderError=()=>{Ie=!0,o()},jt(),et(),{update:At,dispose:$e}}catch(e){throw $e(),e}}var B=t();function V({interactive:e=!0,onFailure:t,opening:n}){let[r,i]=(0,A.useState)(()=>({...j})),[a,o]=(0,A.useState)(!1),[s,c]=(0,A.useState)(()=>window.matchMedia(`(prefers-reduced-motion: reduce)`).matches),l=(0,A.useRef)(null),u=(0,A.useRef)(null),d=(0,A.useRef)(r);return d.current=r,(0,A.useEffect)(()=>{let e=window.matchMedia(`(prefers-reduced-motion: reduce)`),t=()=>c(e.matches);return e.addEventListener(`change`,t),()=>e.removeEventListener(`change`,t)},[]),(0,A.useEffect)(()=>{if(!e||s||a||!l.current)return;let r=()=>{o(!0),t?.()};try{u.current=z(l.current,d.current,r,1.5,n)}catch{r()}return()=>{u.current?.dispose(),u.current=null}},[e,s,a,t,n]),(0,A.useEffect)(()=>{u.current?.update(r)},[r,!1]),(0,B.jsxs)(B.Fragment,{children:[e&&!a&&!s?(0,B.jsxs)(`div`,{className:`site-bg black-hole-wallpaper`,"aria-hidden":`true`,"data-mode":`live`,children:[(0,B.jsx)(`div`,{ref:l,className:`black-hole-stage`}),(0,B.jsx)(`div`,{className:`black-hole-dimmer`,style:{opacity:r.dimming/100}}),(0,B.jsx)(`div`,{className:`site-bg-vignette`})]}):(0,B.jsx)(_,{}),null]})}export{V as SiteBackground};