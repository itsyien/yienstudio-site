import{i as e,t}from"./react-CKK0OxVB.js";import{A as n,C as r,D as i,E as a,M as o,N as s,O as c,S as l,T as u,_ as d,a as f,b as p,c as m,g as h,h as ee,i as g,k as _,l as te,m as v,n as ne,o as y,r as re,s as b,u as x,v as S,w as ie,y as C}from"./index-jGsZTCIz.js";import{_ as w,a as T,c as ae,d as oe,f as se,g as E,h as D,i as O,l as ce,m as k,n as A,o as j,p as le,r as ue,s as M,t as N,u as de,v as fe,y as pe}from"./three-Dflnf3T9.js";var P=e(),F=Object.freeze({speed:.04,x:65,y:48,distance:12.7,elevation:15,azimuth:43,particles:15e3,particleSize:1.2,stars:23e3,glow:.85,dimming:31,sensitivity:4.9,innerColor:`#ffd6aa`,outerColor:`#7000e0`});function I(e,t,n,r,i){if(n<=0||r<=0)return{yaw:0,pitch:0};let a=e=>Math.max(-1,Math.min(1,e));return{yaw:a(e/n*2-1)*i,pitch:a(t/r*2-1)*i*.6}}function L(e,t,n){return e+(t-e)*(1-Math.exp(-Math.max(0,n)/.18))}function R(e,t,n,r,i,a){if(n<=0||r<=0)return{x:.5,y:.5,proximity:0};let o=Math.max(0,Math.min(1,e/n)),s=Math.max(0,Math.min(1,t/r)),c=Math.hypot((o-i)*n/r,s-a),l=Math.max(0,Math.min(1,1-c/.32));return{x:o,y:s,proximity:l*l*(3-2*l)}}function me(e,t){let n=Math.sqrt(27)/2;return!Number.isFinite(e)||!Number.isFinite(t)||e<=n||t<=0||t>=180?0:n/Math.sqrt(e*e-n*n)/Math.tan(t*Math.PI/360)}var he=`
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
`,ge=`
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
`,_e=`
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
`,ve=`
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
`,ye=`
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
`;function z(e){let t=new D({uniforms:{uAspect:{value:1},uTime:{value:0},uRingRadius:{value:0},uRing:{value:0},uFlash:{value:0},uRim:{value:0}},vertexShader:`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,fragmentShader:`
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
    `,transparent:!0,blending:2,depthWrite:!1,depthTest:!1}),n=new se(2,2),r=new k,i=new O,a=new ce(n,t);a.frustumCulled=!1,r.add(a);let o=t.uniforms;return{update(e,t){o.uRingRadius.value=e.ringRadius,o.uRing.value=e.ring,o.uFlash.value=e.flash,o.uRim.value=e.rim,o.uTime.value=t},resize(e,t){o.uAspect.value=e/t},render(){if(o.uRing.value+o.uFlash.value+o.uRim.value<.001)return;let t=e.autoClear;e.autoClear=!1,e.render(r,i),e.autoClear=t},dispose(){n.dispose(),t.dispose()}}}function be(e){let t=e(),n=e(),r=e(),i=e(),a=e(),o=0,s=1,c=1;return{target:t,bloomA:n,bloomB:r,get read(){return i},get write(){return a},get frames(){return o},get width(){return s},get height(){return c},resize(e,l){s=Math.max(1,Math.round(e)),c=Math.max(1,Math.round(l)),t.setSize(s,c),i.setSize(s,c),a.setSize(s,c),n.setSize(Math.max(1,Math.floor(s/4)),Math.max(1,Math.floor(c/4))),r.setSize(n.width,n.height),o=0},advance(){[i,a]=[a,i],o++},reset(){o=0}}}function xe(e){let t=694783,n=()=>(t=Math.imul(t,1664525)+1013904223>>>0,t/4294967296),r=new Float32Array(e);for(let t=0;t<e;t++){let e=n()<.02,i=n();r[t]=e?2+i*1.5:1}return r}function B(e,t,n){if(n===`low`||!Number.isFinite(e)||!Number.isFinite(t)||e<=0||t<=0)return null;let r=n===`high`?480:320,i=n===`high`?270:180,a=Math.min(.25,r/e,i/t);return{width:Math.max(1,Math.round(e*a)),height:Math.max(1,Math.round(t*a))}}function Se(e){let t=d(ee),n=new ue;n.setAttribute(`position`,new A(t.positions,3)),n.setAttribute(`aDetail`,new A(t.detail,2));let r=new D({uniforms:{uEye:{value:new w},uView:{value:new ae},uFocus:{value:new E},uOpacity:{value:0},uAspect:{value:1},uHeight:{value:900},uDpr:{value:1},uTime:{value:0},uGlowSource:{value:0},uAnalyticBoost:{value:0},uFocalDepth:{value:32},uAperture:{value:0}},vertexShader:`
      attribute vec2 aDetail;
      uniform float uOpacity, uAspect, uHeight, uDpr, uTime, uGlowSource, uAnalyticBoost;
      uniform float uFocalDepth, uAperture;
      uniform vec2 uFocus;
      uniform vec3 uEye;
      uniform mat3 uView;
      varying float vAlpha;
      varying vec3 vColor;
      varying float vDefocus, vGlint;
      void main() {
        vec3 drift = .03 * vec3(sin(uTime*.31+position.y*.8+aDetail.x*6.28), sin(uTime*.27+position.z*.7+aDetail.y*6.28), sin(uTime*.23+position.x*.6));
        vec3 view = uView * (position + drift - uEye);
        float depth = view.z;
        float safeDepth = max(.7, depth);
        float bright = step(.93, aDetail.x);
        float size = mix(.075, .12, bright);
        float projected = size * uHeight * ${v} / (2.0 * safeDepth);
        float focusError = abs(1.0 - uFocalDepth / safeDepth);
        vDefocus = smoothstep(.16, .88, focusError) * uAperture;
        float pulse = pow(max(0.0, sin(uTime*(1.2+aDetail.y*2.0)+aDetail.x*6.28)), 14.0);
        vGlint = pulse * step(.985, aDetail.x) * (1.0 - vDefocus);
        gl_PointSize = clamp(projected * (1.0 + vDefocus*.65) + vDefocus*1.4 + vGlint*2.8, 1.0, 32.0);
        gl_PointSize = mix(gl_PointSize, max(2.0, gl_PointSize), uGlowSource);
        gl_Position = vec4(uFocus + view.xy * ${v} / safeDepth / vec2(uAspect, 1.0), 0.0, 1.0);
        float twinkle = 1.0 + pulse * (.16 + .92*bright);
        vAlpha = uOpacity * smoothstep(.8, 3.5, depth) * clamp(projected, 0.0, 1.0) * twinkle * mix(1.0, .56, vDefocus);
        vColor = mix(vec3(.347,.716,1.0), vec3(.323,.147,1.0), aDetail.y*.7);
        vColor *= mix(.2+aDetail.x*.22, .85, bright) * mix(1.0, 1.2, uAnalyticBoost);
      }
    `,fragmentShader:`
      varying float vAlpha;
      varying vec3 vColor;
      varying float vDefocus, vGlint;
      void main() {
        vec2 offset = abs(gl_PointCoord - .5);
        float d = length(offset);
        if (d > .5) discard;
        float soft = 1.0-smoothstep(0.0,.5,d);
        float core = 1.0-smoothstep(0.0,.14,d);
        float light = mix(soft*soft, soft, vDefocus)*.85 + core*.55*(1.0 - vDefocus);
        if (vGlint > .01) {
          float rays = exp(-offset.x*36.0-offset.y*6.0) + exp(-offset.y*36.0-offset.x*6.0);
          light += vGlint * rays * .7 * soft;
        }
        gl_FragColor = vec4(vColor * light * vAlpha, 1.0);
        #include <colorspace_fragment>
      }
    `,transparent:!0,blending:2,depthWrite:!1,depthTest:!1}),i=new k,a=new O,o=new le(n,r);o.frustumCulled=!1,i.add(o);let s={depthBuffer:!1,stencilBuffer:!1,minFilter:j,magFilter:j},c,l,u=0,f=0,p=new se(2,2),m=`varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`,g=new D({uniforms:{uTexture:{value:null},uStep:{value:new E}},vertexShader:m,fragmentShader:`
      uniform sampler2D uTexture; uniform vec2 uStep; varying vec2 vUv;
      void main(){
        vec3 c=texture2D(uTexture,vUv).rgb*.227027;
        c+=(texture2D(uTexture,vUv+uStep*1.384615).rgb+texture2D(uTexture,vUv-uStep*1.384615).rgb)*.316216;
        c+=(texture2D(uTexture,vUv+uStep*3.230769).rgb+texture2D(uTexture,vUv-uStep*3.230769).rgb)*.070270;
        gl_FragColor=vec4(c,1.0);
      }
    `,depthTest:!1,depthWrite:!1}),_=new D({uniforms:{uTexture:{value:null},uAmount:{value:0}},vertexShader:m,fragmentShader:`uniform sampler2D uTexture; uniform float uAmount; varying vec2 vUv; void main(){ gl_FragColor=vec4(texture2D(uTexture,vUv).rgb*uAmount,1.0); }`,transparent:!0,blending:2,depthTest:!1,depthWrite:!1}),te=new k,ne=new ce(p,g);ne.frustumCulled=!1,te.add(ne);let y=new T,re=0,b=0,x=0;return{update(e,t,n,i=0,a=0){let o=C(e);x+=Math.max(0,Math.min(.05,t));let s=t>0?(o.travel-re)/t:0;b+=(s-b)*(1-Math.exp(-t*18)),re=o.travel;let c=h(o.travel,i,a);return r.uniforms.uEye.value.fromArray(c.eye),r.uniforms.uView.value.set(...c.right,...c.up,...c.forward),r.uniforms.uOpacity.value=o.opacity,r.uniforms.uTime.value=x,r.uniforms.uFocus.value.copy(n),r.uniforms.uFocalDepth.value=32,r.uniforms.uAperture.value=0,f=M.smoothstep(e,.27,.36),{travel:o.travel,velocity:b}},resize(t,i,a){n.setDrawRange(0,S(a)),r.uniforms.uAnalyticBoost.value=+(a===`low`),r.uniforms.uAspect.value=t/i,r.uniforms.uHeight.value=i*e.getPixelRatio(),r.uniforms.uDpr.value=e.getPixelRatio();let o=t*e.getPixelRatio(),d=i*e.getPixelRatio(),f=B(o,d,a);if(!f){u=0;return}c??=new pe(f.width,f.height,s),l??=new pe(f.width,f.height,s),c.setSize(f.width,f.height),l.setSize(f.width,f.height),u=f.height/d},render(){if(r.uniforms.uOpacity.value<.001)return;let t=e.autoClear;e.autoClear=!1;try{if(c&&l&&u>0&&f>.001){let t=e.getRenderTarget();e.getClearColor(y);let n=e.getClearAlpha(),o=r.uniforms.uHeight.value,s=r.uniforms.uDpr.value;try{r.uniforms.uHeight.value=o*u,r.uniforms.uDpr.value=s*Math.sqrt(u),r.uniforms.uGlowSource.value=1,e.setRenderTarget(c),e.setClearColor(0,0),e.clear(!0,!1,!1),e.render(i,a),r.uniforms.uHeight.value=o,r.uniforms.uDpr.value=s,r.uniforms.uGlowSource.value=0,ne.material=g,g.uniforms.uTexture.value=c.texture,g.uniforms.uStep.value.set(1/c.width,0),e.setRenderTarget(l),e.render(te,a),g.uniforms.uTexture.value=l.texture,g.uniforms.uStep.value.set(0,1/c.height),e.setRenderTarget(c),e.render(te,a),ne.material=_,_.uniforms.uTexture.value=c.texture,_.uniforms.uAmount.value=.55*f,e.setRenderTarget(t),e.setClearColor(y,n),e.render(te,a)}finally{r.uniforms.uHeight.value=o,r.uniforms.uDpr.value=s,r.uniforms.uGlowSource.value=0,e.setRenderTarget(t),e.setClearColor(y,n)}}e.render(i,a)}finally{e.autoClear=t}},dispose(){n.dispose(),r.dispose(),c?.dispose(),l?.dispose(),p.dispose(),g.dispose(),_.dispose()}}}var Ce=.75,we=.25,Te=`
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
      // The original sky follows the approach before the tunnel takes over.
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
`,Ee=`
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
    gl_FragColor = vec4((emitted + bloomColor * bloom * .48) * shadow * vTwinkle * mix(1.0, 0.0, uEnvironment), 1.0);
  }
`;function V(e,t,d,h=1.5,ee){let v=t,x=navigator,S=y(f(o(),navigator.hardwareConcurrency||4,x.deviceMemory??8)),C=S.tier,ae=S.tier!==`low`,O=m(),j=()=>{},P=new N({alpha:!0,antialias:!1,powerPreference:`low-power`}),F=[],B=e=>(F.push(e),e),V=0,H=1,U=1,W=0,De=0,Oe=!1,ke=!0,Ae=!1,je=p(`desktop`),Me=0,Ne=!1,Pe=!1,G=r(!1,0),Fe=()=>{},Ie,Le,Re={yaw:0,pitch:0},ze=0,Be=0,Ve=0,He=0,K={x:.5,y:.5,proximity:0},Ue=.5,We=.5,Ge=0,Ke=0,qe=0,Je=window.matchMedia(`(hover: hover) and (pointer: fine)`),q=()=>{Re={yaw:0,pitch:0},Ge=0,K.proximity=0},Ye=e=>{if(e.pointerType!==`mouse`||!Je.matches||e.buttons!==0||s()){q();return}Re=I(e.clientX,e.clientY,H,U,v.sensitivity),K=R(e.clientX,e.clientY,H,U,H<=768?.58:v.x/100,H<=768?.22:v.y/100),Ke<.005&&(Ue=K.x,We=K.y),Ge=1},Xe=()=>{document.visibilityState!==`visible`&&(je.clear(),q(),S.reset(),O.reset()),et()},Ze=e=>{e.preventDefault(),d()},Qe=e=>{let t=e.detail,n=r(t?.active,t?.progress);n.active!==G.active&&(n.active&&(Ve=ze,He=Be,C=S.tier,ae=S.tier!==`low`),q(),S.reset(),O.reset(),n.active||Fe()),G=n,_(ke,G)?et():(cancelAnimationFrame(V),V=0)},$e=()=>{Oe||(Oe=!0,je.clear(),cancelAnimationFrame(V),Ie?.disconnect(),Le?.disconnect(),document.removeEventListener(`visibilitychange`,Xe),window.removeEventListener(`yien:cinematic-progress`,Qe),window.removeEventListener(`pointermove`,Ye),window.removeEventListener(`pointerdown`,q),window.removeEventListener(`pointerup`,Ye),window.removeEventListener(`pointercancel`,q),window.removeEventListener(`blur`,q),document.documentElement.removeEventListener(`pointerleave`,q),P.domElement.removeEventListener(`webglcontextlost`,Ze),F.forEach(e=>e.dispose()),P.dispose(),P.domElement.remove())};function et(){!Oe&&_(ke,G)&&document.visibilityState===`visible`&&!V&&(O.reset(),S.reset(),V=requestAnimationFrame(nt))}let tt=()=>{};function nt(e){if(V=0,Oe||!_(ke,G)||document.visibilityState!==`visible`){je.clear();return}if(s()&&!G.active){Ae||=(q(),S.reset(),!0),O.reset(),V=requestAnimationFrame(nt);return}Ae&&(Ae=!1,O.reset());let t=O.tick(e);if(t!==null){let e=Math.min(t/1e3,.05);t&&S.sample(t,G.active?C:`high`)&&j(),tt(e)}V=requestAnimationFrame(nt)}try{P.setPixelRatio(Math.min(window.devicePixelRatio||1,h)),P.domElement.setAttribute(`aria-hidden`,`true`),e.appendChild(P.domElement);let o=new k,s=new oe(45,1,.1,700),f=18427,p=()=>(f=Math.imul(f,1664525)+1013904223>>>0,f/4294967296);for(let e=0;e<25e4;e++)p();let m=new Float32Array(15e4),_=new Float32Array(15e4),y=new Float32Array(5e4),x=new Float32Array(5e4);for(let e=0;e<5e4;e++){let t=p()*Math.PI*2,n=Math.acos(1-2*p()),r=.15+p()*.35,i=e%1e3,a=i<7?2:+(i<307),o=a===2?120:a===1?240:430;x[e]=a,m.set([Math.sin(n)*Math.cos(t)*o,Math.cos(n)*o,Math.sin(n)*Math.sin(t)*o],e*3),_.set([r*.82,r*.88,r],e*3),y[e]=p()}let C=xe(5e4),N=B(new ue);N.setAttribute(`position`,new A(m,3)),N.setAttribute(`color`,new A(_,3)),N.setAttribute(`mote`,new A(y,1)),N.setAttribute(`layer`,new A(x,1)),N.setAttribute(`accentGain`,new A(C,1));let F=B(new D({vertexShader:Te,fragmentShader:Ee,uniforms:{pixelRatio:{value:1},uPointer:{value:new E(0,0)},uPointerStrength:{value:0},uAspect:{value:1},uLensCenter:{value:new E},uLensRadius:{value:0},uCinematic:{value:0},uProgress:{value:0},uTime:{value:0},uEntranceTravel:{value:0},uCompact:{value:0},uFlyby:{value:new E},uFlybyCenter:{value:new E},uBufferHeight:{value:1},uEnvironment:{value:0}},vertexColors:!0,transparent:!0,blending:2,depthWrite:!1}));o.add(new le(N,F));let I=44e3,R=6e3,V=B(new ue),Oe=new Float32Array(R),Ae=new Float32Array(R*3);for(let e=0;e<R;e++){Oe[e]=.81+y[I+e]*.18;for(let t=0;t<3;t++)Ae[e*3+t]=_[(I+e)*3+t]*.65}V.setAttribute(`position`,new A(m.subarray(I*3),3)),V.setAttribute(`color`,new A(Ae,3)),V.setAttribute(`mote`,new A(Oe,1)),V.setAttribute(`layer`,new A(new Float32Array(R),1)),V.setAttribute(`accentGain`,new A(C.subarray(I),1)),o.add(new le(V,F));let Je=new T(`#05070d`),nt=new T(`#010208`),rt=new T,it=B(Se(P)),at=B(z(P)),ot=new de(-1,1,1,-1,0,1),st=B(new se(2,2)),ct=new k,lt=()=>B(new pe(1,1,{depthBuffer:!1,stencilBuffer:!1})),J=be(lt),ut=be(lt),Y=J;Fe=()=>{J.reset(),ut.reset()};let dt=[[.5,.333],[.25,.667],[.75,.111],[.125,.444],[.625,.778],[.375,.222],[.875,.556],[.0625,.889]],ft=new k,pt=(e,t,n=!1)=>B(new D({vertexShader:`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,fragmentShader:e,uniforms:t,transparent:n,depthTest:!1,depthWrite:!1})),mt=pt(ge,{uCur:{value:J.target.texture},uPrev:{value:J.read.texture},uAlpha:{value:1}}),ht=pt(_e,{uTex:{value:J.read.texture},uTexel:{value:new E(1,1)},uDecode:{value:1},uPack:{value:1},uThreshold:{value:.85}}),X=pt(ve,{uTex:{value:J.bloomA.texture},uStep:{value:new E}}),Z=pt(ye,{uScene:{value:J.read.texture},uBloom:{value:J.bloomA.texture},uGlow:{value:1},uOpacity:{value:1},uDiveFocus:{value:new E(.5,.5)},uDiveZoom:{value:1},uDiveTurn:{value:0},uDiveCenter:{value:0},uDiveAspect:{value:1},uEntrance:{value:new E(0,1)}},!0),gt=new ce(st,mt);ft.add(gt);let _t=(e,t)=>{gt.material=e,P.setRenderTarget(t),P.render(ft,ot)},Q={uRes:{value:new E(1,1)},uCamPos:{value:new w},uRight:{value:new w},uUp:{value:new w},uFwd:{value:new w},uTanHalf:{value:Math.tan(21*Math.PI/180)},uFocus:{value:new E(.65,.52)},uSkyR:{value:36},uDiskIn:{value:3},uDiskOut:{value:15},uThick:{value:.26},uDensity:{value:1},uSpin:{value:.06*Math.PI*2},uWind:{value:new fe},uGrain:{value:.48},uBright:{value:1},uDoppler:{value:.35},uHot:{value:new T(`#FFF3DE`)},uMid:{value:new T(`#FF9838`)},uCool:{value:new T(`#8E3A0B`)},uEncode:{value:1},uJitter:{value:new E},uSeed:{value:0},uSteps:{value:re[S.tier].steps}},vt=B(new D({vertexShader:`void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,fragmentShader:he,uniforms:Q,depthTest:!1,depthWrite:!1}));ct.add(new ce(st,vt));let yt=new k;yt.add(new ce(st,Z));let bt=new w,xt=new w,St=new w,$=new E(.65,.52),Ct=new E(.5,.5),wt=24,Tt=-1/0,Et=!1,Dt=null,Ot=r(!0,l);function kt(e){v=e,N.setDrawRange(0,Math.min(e.stars,re[S.tier].stars)),V.setDrawRange(0,g(S.tier,e.stars)),$.set(H<=768?.58:e.x/100,H<=768?.78:1-e.y/100),F.uniforms.uLensCenter.value.set($.x*2-1,$.y*2-1),q()}kt(t),tt=e=>{W+=e,De=n(De,G.progress,e),G.active||(De=G.progress);let t=r(G.active,De);if(t.progress<.272-.035&&(Et=!0),t.active&&Et&&t.progress>=.272&&(Et=!1,Dt??=performance.now()),Dt!==null){let e=(performance.now()-Dt)/1e3;at.update(c(Ot,e),W),e>=1.2&&(Dt=null)}ze=L(ze,Re.yaw,e),Be=L(Be,Re.pitch,e),Ue=L(Ue,K.x,e),We=L(We,K.y,e),Ke=L(Ke,Ge,e),qe=L(qe,K.proximity,e),F.uniforms.uPointer.value.set(Ue*2-1,1-We*2),F.uniforms.uPointerStrength.value=Ke;let l=i(t),d=ie(t),f=ne(ee?.progress??1);Z.uniforms.uEntrance.value.set(f.holeY,f.scale),F.uniforms.uEntranceTravel.value=ee?f.travel:0;let p=$,m=u(t),h=ae&&G.active&&t.progress<.272,g=H<=768?65:42,_=g+(h?m.fov-42:0),y=h?m.distance:24;Q.uTanHalf.value=Math.tan(_*Math.PI/360),Q.uFocus.value.lerpVectors(p,Ct,h?m.center:0);let b=me(24,g),x=Math.min(.98,p.y+b*.32),C=a(t);F.uniforms.uFlyby.value.set(C.approach,C.trail),F.uniforms.uFlybyCenter.value.set(M.lerp(p.x*2-1,0,d.center),M.lerp(x*2-1,0,d.center));let w=Ke*M.smoothstep(t.progress,.32,.42)*(1-M.smoothstep(t.progress,.88,.97)),T=(Ue-.5)*.6*w,oe=(.5-We)*.4*w,se=F.uniforms.uFlybyCenter.value,E=it.update(t.active?t.progress:0,e,se,T,oe);je.publish(t.active,t.progress,E.travel,E.velocity,se.x,se.y,32,0,T,oe),Z.uniforms.uDiveFocus.value.set(p.x,x),Z.uniforms.uDiveZoom.value=h?1:d.zoom,Z.uniforms.uDiveTurn.value=(h?0:d.turn)+.035*(1-f.rise),Z.uniforms.uDiveCenter.value=h?0:d.center,Z.uniforms.uDiveAspect.value=H/U,Z.uniforms.uOpacity.value=(h?1:l)*f.opacity,F.uniforms.uCinematic.value=t.active&&t.progress<.26?1:0,F.uniforms.uEnvironment.value=t.active?M.smoothstep(t.progress,.26,.4):0,F.uniforms.uProgress.value=t.progress,F.uniforms.uTime.value=W,F.uniforms.uLensCenter.value.set(M.lerp(p.x*2-1,0,d.center),M.lerp(p.y*2-1,0,d.center)+f.holeY*2);let D=t.active?1-M.smoothstep(t.progress,.2,.29):1,O=y>2.7?Math.min(1.4,me(y,_)):1.4;F.uniforms.uLensRadius.value=(h?O:b*l*d.zoom)*D*f.scale*f.opacity;let ce=G.active?M.lerp(ze,Ve,l):ze,k=G.active?M.lerp(Be,He,l):Be,A=M.degToRad(ce),j=M.degToRad(-5.5+k);if(s.position.set(Math.sin(A)*Math.cos(j),Math.sin(j),Math.cos(A)*Math.cos(j)).multiplyScalar(v.distance),s.lookAt(bt),s.setViewOffset(H,U,(.5-v.x/100)*H,(.5-v.y/100)*U,H,U),G.active&&!h&&(ae||J.frames>0||l<=0)){P.setRenderTarget(null),P.setClearColor(rt.lerpColors(Je,nt,M.smoothstep(t.progress,.26,.4)),1),P.autoClear=!0,t.progress<.4?P.render(o,s):P.clear(),!ae&&l>0&&J.frames>0&&(Z.uniforms.uOpacity.value=l*f.opacity,P.autoClear=!1,P.render(yt,ot)),it.render(),at.render(),P.autoClear=!0;return}Q.uBright.value=1+qe*.18,Q.uThick.value=.26*(1+qe*.08);let le=Math.cos(j),ue=Q.uCamPos.value.set(y*le*Math.cos(A),y*Math.sin(j),y*le*Math.sin(A)),N=Q.uFwd.value.copy(ue).normalize().negate();xt.set(N.z,0,-N.x).normalize(),St.crossVectors(xt,N);let de=M.degToRad(-20)+(h?m.roll:0),fe=Math.cos(de),pe=Math.sin(de);Q.uRight.value.copy(xt).multiplyScalar(fe).addScaledVector(St,pe),Q.uUp.value.copy(xt).multiplyScalar(-pe).addScaledVector(St,fe);let I=W/46%1,R=(I+.5)%1;Q.uWind.value.set(I*46,R*46,Math.abs(2*I-1),Q.uSpin.value*W*.05);let he=Math.abs(y-wt)>y*5e-4;wt=y,he&&(Tt=W);let ge=h&&W-Tt<we?ut:J;ge!==Y&&(Y=ge,Y.reset()),Q.uRes.value.set(Y.width,Y.height),ht.uniforms.uTexel.value.set(1/Y.width,1/Y.height);let _e=dt[Y.frames%dt.length];Q.uJitter.value.set(_e[0]-.5,_e[1]-.5),Q.uSeed.value=Y.frames%64*17.13,P.setRenderTarget(Y.target),P.setClearColor(0,0),P.clear(),P.render(ct,ot),mt.uniforms.uCur.value=Y.target.texture,mt.uniforms.uPrev.value=Y.read.texture;let ve=he?.65:Math.abs(ze-Re.yaw)+Math.abs(Be-Re.pitch)>.02?.4:.14;mt.uniforms.uAlpha.value=Y.frames===0?1:te(ve,e),_t(mt,Y.write),Y.advance();let ye=re[S.tier],{bloomA:z,bloomB:be}=Y;if(ye.bloom){ht.uniforms.uTex.value=Y.read.texture,_t(ht,z);let e=z.width,t=z.height;X.uniforms.uTex.value=z.texture,X.uniforms.uStep.value.set(1/e,0),_t(X,be),X.uniforms.uTex.value=be.texture,X.uniforms.uStep.value.set(0,1/t),_t(X,z),S.tier===`high`&&(X.uniforms.uTex.value=z.texture,X.uniforms.uStep.value.set(2.6/e,0),_t(X,be),X.uniforms.uTex.value=be.texture,X.uniforms.uStep.value.set(0,2.6/t),_t(X,z))}Z.uniforms.uGlow.value=+!!ye.bloom,Z.uniforms.uScene.value=Y.read.texture,Z.uniforms.uBloom.value=z.texture,P.setRenderTarget(null),P.setClearColor(`#05070d`,1),P.autoClear=!0,P.render(o,s),P.autoClear=!1,P.render(yt,ot),h&&it.render(),at.render(),P.autoClear=!0,!Ne&&!Pe&&++Me>=8&&(Ne=!0,ee?.onReady())};let At=()=>{H=Math.max(1,e.clientWidth),U=Math.max(1,e.clientHeight),s.aspect=H/U,s.updateProjectionMatrix();let t=re[S.tier];e.dataset.quality=S.tier,P.setPixelRatio(Math.min(window.devicePixelRatio||1,h,t.dpr)),P.setSize(H,U,!1),it.resize(H,U,S.tier),at.resize(H,U),N.setDrawRange(0,Math.min(v.stars,t.stars)),V.setDrawRange(0,g(S.tier,v.stars)),Q.uSteps.value=t.steps,F.uniforms.pixelRatio.value=P.getPixelRatio(),F.uniforms.uAspect.value=H/U,F.uniforms.uCompact.value=+(H<=640||H/U<1.2);let{width:n,height:r}=b(H,U,S.tier,P.getPixelRatio());J.resize(n,r),ut.resize(n*Ce,r*Ce);let i=H<=768;Q.uTanHalf.value=Math.tan((i?65:42)*Math.PI/360),$.set(i?.58:v.x/100,i?.78:1-v.y/100),Q.uFocus.value.copy($),F.uniforms.uLensCenter.value.set($.x*2-1,$.y*2-1),F.uniforms.uLensRadius.value=me(24,i?65:42),F.uniforms.uBufferHeight.value=U*P.getPixelRatio()};j=At,Le=new ResizeObserver(At),Le.observe(e);let jt=document.getElementById(`top`);jt&&(Ie=new IntersectionObserver(([e])=>{ke=e.isIntersecting,!ke&&!G.active&&(q(),S.reset(),O.reset()),et()}),Ie.observe(jt));let Mt=document.getElementById(`cinematic`);return G=r(Mt?.dataset.active,Mt?.dataset.progress),window.addEventListener(`yien:cinematic-progress`,Qe),document.addEventListener(`visibilitychange`,Xe),window.addEventListener(`pointermove`,Ye,{passive:!0}),window.addEventListener(`pointerdown`,q,{passive:!0}),window.addEventListener(`pointerup`,Ye,{passive:!0}),window.addEventListener(`pointercancel`,q,{passive:!0}),window.addEventListener(`blur`,q),document.documentElement.addEventListener(`pointerleave`,q),P.domElement.addEventListener(`webglcontextlost`,Ze),P.debug.onShaderError=()=>{Pe=!0,d()},At(),et(),{update:kt,dispose:$e}}catch(e){throw $e(),e}}var H=t();function U({interactive:e=!0,onFailure:t,opening:n}){let[r,i]=(0,P.useState)(()=>({...F})),[a,o]=(0,P.useState)(!1),[s,c]=(0,P.useState)(()=>window.matchMedia(`(prefers-reduced-motion: reduce)`).matches),l=(0,P.useRef)(null),u=(0,P.useRef)(null),d=(0,P.useRef)(r);return d.current=r,(0,P.useEffect)(()=>{let e=window.matchMedia(`(prefers-reduced-motion: reduce)`),t=()=>c(e.matches);return e.addEventListener(`change`,t),()=>e.removeEventListener(`change`,t)},[]),(0,P.useEffect)(()=>{if(!e||s||a||!l.current)return;let r=()=>{o(!0),t?.()};try{u.current=V(l.current,d.current,r,1.5,n)}catch{r()}return()=>{u.current?.dispose(),u.current=null}},[e,s,a,t,n]),(0,P.useEffect)(()=>{u.current?.update(r)},[r,!1]),(0,H.jsxs)(H.Fragment,{children:[e&&!a&&!s?(0,H.jsxs)(`div`,{className:`site-bg black-hole-wallpaper`,"aria-hidden":`true`,"data-mode":`live`,children:[(0,H.jsx)(`div`,{ref:l,className:`black-hole-stage`}),(0,H.jsx)(`div`,{className:`black-hole-dimmer`,style:{opacity:r.dimming/100}}),(0,H.jsx)(`div`,{className:`site-bg-vignette`})]}):(0,H.jsx)(x,{}),null]})}export{U as SiteBackground};