// GLSL for the Maritime.Studio scene: Gerstner ocean, sky dome, liquid glass
// drop and drifting plankton. Palette: night-sea blues, sky accent, warm sand.

export const NOISE = /* glsl */ `
// Simplex 3D noise — Ashima Arts / Stefan Gustavson (MIT)
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

// Sky colours shared by the dome, the water reflection and the glass drop.
export const SKY = /* glsl */ `
uniform vec3 uSunDir;
uniform float uUnder;
vec3 skyColor(vec3 dir){
  float h = clamp(dir.y, -1.0, 1.0);
  vec3 zenith  = vec3(0.016, 0.060, 0.105);
  vec3 mid     = vec3(0.039, 0.160, 0.300);
  vec3 horizon = vec3(0.290, 0.400, 0.520);
  vec3 col = mix(horizon, mid, smoothstep(0.0, 0.18, h));
  col = mix(col, zenith, smoothstep(0.18, 0.75, h));
  // warm sand glow where the low sun/moon sits
  float s = max(dot(normalize(dir), uSunDir), 0.0);
  col += vec3(0.85, 0.58, 0.40) * pow(s, 10.0) * 0.5 * (1.0 - smoothstep(0.0, 0.5, h));
  col += vec3(1.0, 0.9, 0.78) * smoothstep(0.99955, 0.99992, s) * 1.25;
  col += vec3(0.95, 0.8, 0.62) * pow(s, 380.0) * 0.45;
  col = mix(col, vec3(0.02, 0.09, 0.15), smoothstep(-0.02, -0.25, h));
  // seen from below the surface: deep water, brighter toward the light above
  vec3 deepWater = mix(vec3(0.006, 0.04, 0.08), vec3(0.09, 0.33, 0.46), smoothstep(-0.4, 0.95, h));
  return mix(col, deepWater, uUnder);
}`;

export const skyVert = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww; // always at the far plane
}`;

export const skyFrag = /* glsl */ `
varying vec3 vDir;
uniform float uTime;
${SKY}
${NOISE}
void main(){
  vec3 d = normalize(vDir);
  vec3 col = skyColor(d);
  // underwater god rays fanning down from the surface
  float rays = snoise(vec3(d.x * 7.0, d.z * 7.0, uTime * 0.12)) * 0.5 + 0.5;
  rays = pow(rays, 3.0) * smoothstep(-0.2, 0.7, d.y);
  col += vec3(0.45, 0.75, 0.9) * rays * 0.35 * uUnder;
  gl_FragColor = vec4(col, 1.0);
}`;

// --- Ocean: sum of Gerstner waves, analytic normals ---------------------
export const waterVert = /* glsl */ `
uniform float uTime;
uniform float uSplash;
uniform vec2 uPointer;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vCrest;

vec3 gerstner(vec4 w, vec3 p, inout vec3 tangent, inout vec3 binormal){
  float steep = w.z; float len = w.w;
  float k = 6.28318 / len;
  float c = sqrt(9.8 / k);
  vec2 d = normalize(w.xy);
  float f = k * (dot(d, p.xz) - c * uTime);
  float a = steep / k;
  tangent += vec3(-d.x*d.x*(steep*sin(f)), d.x*(steep*cos(f)), -d.x*d.y*(steep*sin(f)));
  binormal += vec3(-d.x*d.y*(steep*sin(f)), d.y*(steep*cos(f)), -d.y*d.y*(steep*sin(f)));
  return vec3(d.x*(a*cos(f)), a*sin(f), d.y*(a*cos(f)));
}

void main(){
  vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
  vec3 grid = p;
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);
  float amp = 1.0 + uSplash * 0.8;
  p += gerstner(vec4(1.0, 0.35, 0.16 * amp, 14.0), grid, tangent, binormal);
  p += gerstner(vec4(0.8, 1.0, 0.13 * amp, 8.0), grid, tangent, binormal);
  p += gerstner(vec4(-0.6, 0.9, 0.10, 4.6), grid, tangent, binormal);
  p += gerstner(vec4(0.2, -1.0, 0.07, 2.4), grid, tangent, binormal);
  // a slow swell lifts toward the pointer
  float pd = length(grid.xz - vec2(uPointer.x * 7.0, -2.0 + uPointer.y * 3.0));
  p.y += 0.18 * exp(-pd * 0.35) * sin(uTime * 1.6 - pd * 1.4);
  vNormal = normalize(cross(binormal, tangent));
  vCrest = p.y;
  vWorld = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

export const waterFrag = /* glsl */ `
uniform float uTime;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vCrest;
${SKY}
${NOISE}
void main(){
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 N = normalize(vNormal);
  // ripple detail
  N = normalize(N + 0.08 * vec3(snoise(vec3(vWorld.xz * 0.9, uTime * 0.4)), 0.0, snoise(vec3(vWorld.zx * 0.9, uTime * 0.4 + 7.0))));
  bool below = !gl_FrontFacing;
  if (below) N = -N;
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 R = reflect(-V, N);
  vec3 deep = vec3(0.010, 0.060, 0.110);
  vec3 body = mix(deep, vec3(0.040, 0.250, 0.330), clamp(vCrest * 0.9 + 0.25, 0.0, 1.0) * 0.45);
  vec3 col = mix(body, skyColor(R), fres);
  // moon path glitter
  float spec = pow(max(dot(R, uSunDir), 0.0), 220.0);
  float glint = smoothstep(0.55, 1.0, snoise(vec3(vWorld.xz * 6.0, uTime * 1.5)));
  col += vec3(1.0, 0.82, 0.62) * (spec * 2.6 + spec * glint * 6.0);
  // crest foam
  col += vec3(0.75, 0.86, 0.95) * smoothstep(0.38, 0.62, vCrest) * 0.18;
  if (below) {
    // underside: Snell's window of light, bright caustic scatter
    float window = pow(max(dot(-V, vec3(0.0, 1.0, 0.0)), 0.0), 2.0);
    float caustic = pow(abs(snoise(vec3(vWorld.xz * 0.7, uTime * 0.5))), 0.4);
    caustic = 1.0 - caustic;
    col = mix(vec3(0.03, 0.16, 0.25), vec3(0.55, 0.82, 0.92), window * 0.75);
    col += vec3(0.6, 0.9, 1.0) * pow(caustic, 3.0) * 0.55 * window;
  }
  float dist = length(cameraPosition - vWorld);
  float fog = 1.0 - exp(-dist * (below ? 0.05 : 0.022));
  vec3 fogCol = below ? vec3(0.03, 0.15, 0.24) : skyColor(normalize(vec3(-V.x, 0.02, -V.z)));
  gl_FragColor = vec4(mix(col, fogCol, fog), 1.0);
}`;

// --- Liquid glass drop --------------------------------------------------
export const dropVert = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform vec3 uPointer; // pointer in drop-local space
varying vec3 vWorldNormal;
varying vec3 vWorld;
varying float vDisp;
${NOISE}
float field(vec3 p){
  float n = snoise(p * 0.85 + vec3(0.0, uTime * 0.22, 0.0)) * 0.7;
  n += snoise(p * 1.7 - vec3(uTime * 0.18)) * 0.18;
  return n;
}
void main(){
  vec3 p = position;
  float d = field(normal * 1.2) * uMorph;
  // pointer pulls the surface like surface tension
  float pull = exp(-distance(normalize(p), normalize(uPointer)) * 3.0) * 0.28 * length(uPointer) ;
  d += pull;
  vec3 displaced = p + normal * d;
  // approximate the new normal by finite differences
  vec3 t = normalize(cross(normal, vec3(0.0, 1.0, 0.01)));
  vec3 b = normalize(cross(normal, t));
  float e = 0.045;
  vec3 pt = p + t * e; vec3 pb = p + b * e;
  vec3 dt = pt + normalize(pt) * (field(normalize(pt) * 1.2) * uMorph + exp(-distance(normalize(pt), normalize(uPointer)) * 3.0) * 0.28 * length(uPointer));
  vec3 db = pb + normalize(pb) * (field(normalize(pb) * 1.2) * uMorph + exp(-distance(normalize(pb), normalize(uPointer)) * 3.0) * 0.28 * length(uPointer));
  vec3 n = normalize(cross(dt - displaced, db - displaced));
  if (dot(n, normal) < 0.0) n = -n;
  vDisp = d;
  vWorldNormal = normalize(mat3(modelMatrix) * n);
  vec4 w = modelMatrix * vec4(displaced, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const dropFrag = /* glsl */ `
uniform float uTime;
varying vec3 vWorldNormal;
varying vec3 vWorld;
varying float vDisp;
${SKY}
void main(){
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 N = normalize(vWorldNormal);
  float ndv = max(dot(N, V), 0.0);
  float fres = pow(1.0 - ndv, 3.0);
  vec3 R = reflect(-V, N);
  vec3 T = refract(-V, N, 0.75);
  vec3 refl = skyColor(R);
  vec3 refr = skyColor(T) * vec3(0.55, 0.85, 1.0);
  // thin-film iridescence: sky → lagoon → sand across the viewing angle
  vec3 film = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.18, 0.42) + fres * 1.3 + vDisp * 1.6 + uTime * 0.05));
  film = mix(vec3(0.48, 0.74, 0.91), mix(vec3(0.31, 0.56, 0.64), vec3(0.85, 0.71, 0.54), film.x), film.y);
  vec3 col = mix(refr, refl, 0.35 + 0.65 * fres);
  col = mix(col, film, 0.35 * fres + 0.12);
  col += vec3(1.0, 0.9, 0.78) * pow(max(dot(R, uSunDir), 0.0), 120.0) * 2.5;
  col += vec3(0.6, 0.85, 1.0) * pow(max(dot(R, normalize(vec3(0.4, 0.8, 0.5))), 0.0), 40.0) * 0.8;
  col += vec3(0.48, 0.74, 0.91) * fres * 0.6;
  gl_FragColor = vec4(col, 0.92);
}`;

// --- Plankton / bubbles -------------------------------------------------
export const particleVert = /* glsl */ `
uniform float uTime;
uniform float uPixel;
uniform vec3 uPointerWorld;
attribute float aSeed;
varying float vAlpha;
void main(){
  vec3 p = position;
  float t = uTime * (0.05 + aSeed * 0.08);
  p.y = mod(p.y + t * 3.0 + 8.0, 12.0) - 8.0;       // drift upward and wrap
  p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.4;
  p.z += cos(uTime * 0.25 + aSeed * 30.0) * 0.4;
  vec3 away = p - uPointerWorld;                       // pointer parts the swarm
  float d = length(away);
  p += normalize(away) * exp(-d * 0.9) * 1.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = (0.6 + aSeed * 1.6) * uPixel;
  gl_PointSize = size * (12.0 / -mv.z);
  vAlpha = (0.35 + 0.65 * fract(aSeed * 13.7)) * (0.6 + 0.4 * sin(uTime * 1.5 + aSeed * 50.0));
  vAlpha *= smoothstep(30.0, 6.0, -mv.z);
}`;

export const particleFrag = /* glsl */ `
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  vec3 col = mix(vec3(0.48, 0.74, 0.91), vec3(0.85, 0.95, 1.0), smoothstep(0.25, 0.0, d));
  gl_FragColor = vec4(col, a * vAlpha);
}`;
