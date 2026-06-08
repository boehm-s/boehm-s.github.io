import { useEffect, useRef } from "react";

const targetFrameMs = 1000 / 60;

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_pointerInfluence;
  uniform float u_time;
  uniform float u_pixelRatio;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = mat2(1.62, 1.18, -1.18, 1.62) * p + 3.7;
      amplitude *= 0.48;
    }

    return value;
  }

  void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 center = u_resolution * 0.5;
    vec2 mouse = (u_mouse - center) / min(u_resolution.x, u_resolution.y);
    vec2 p = (fragCoord - center) / min(u_resolution.x, u_resolution.y);
    float t = u_time * 0.064;
    vec2 mouseDelta = p - mouse;
    float mouseDistance = length(mouseDelta);
    float mouseField = smoothstep(0.34, 0.0, mouseDistance) * u_pointerInfluence;
    p += normalize(mouseDelta + 0.0001) * mouseField * 0.025;
    float radius = length(p);
    float angle = atan(p.y, p.x) + t * 0.95;
    float stableWarp = fbm(p * 2.2 + vec2(0.18, -0.24));
    float slowWarp = fbm(p * 1.35 + vec2(t * 0.08, -t * 0.055));
    float warpedRadius = radius + stableWarp * 0.044 + slowWarp * 0.025 + mouseField * 0.018;

    vec2 trunkSpace = vec2(
      angle * 3.75 + warpedRadius * 36.0 + mouseField * 0.62,
      warpedRadius * 25.5 - t * 0.24 + mouseField * 0.28
    );

    float flow = fbm(trunkSpace * 0.32 + vec2(t * 0.12, -t * 0.08));
    float fineFlow = fbm(trunkSpace * 0.74 + vec2(-t * 0.06, t * 0.09));
    float lineWave = sin(trunkSpace.x + flow * 4.2 + sin(trunkSpace.y * 0.54 + t * 0.2) * 1.2);
    float secondaryLineWave = sin(trunkSpace.x * 2.45 + fineFlow * 3.8 + trunkSpace.y * 0.32 - t * 0.11);
    float rings = abs(lineWave);
    float secondaryRings = abs(secondaryLineWave);
    float lineWidth = 0.043;
    float line = 1.0 - smoothstep(lineWidth, lineWidth + 0.038, rings);
    float secondaryLine = 1.0 - smoothstep(0.032, 0.064, secondaryRings);
    line = max(line, secondaryLine * 0.64);

    float branchNoise = fbm(p * 6.8 + vec2(-t * 0.04, t * 0.06));
    float branches = smoothstep(0.72, 0.9, branchNoise + line * 0.22);
    float glow = smoothstep(0.0, 0.9, line) * (0.78 + branches * 0.35 + mouseField * 0.12);

    float fade = smoothstep(1.25, 0.05, radius);
    float subtleGrid = smoothstep(0.985, 1.0, sin((fragCoord.x + fragCoord.y) / (9.0 * u_pixelRatio) + flow * 2.0) * 0.5 + 0.5);
    float alpha = (glow + branches * 0.45 + subtleGrid * 0.05 + mouseField * line * 0.035) * fade;

    vec3 color = mix(vec3(0.42), vec3(0.9), clamp(glow, 0.0, 1.0));
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.86));
  }
`;

const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Unable to create WebGL shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
};

const createProgram = (gl: WebGLRenderingContext) => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Unable to create WebGL program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown shader linking error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
};

export const ShaderTrunkBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousFrameTimeRef = useRef<number | null>(null);
  const previousRenderTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: "high-performance",
      premultipliedAlpha: false,
      stencil: false,
    });

    if (!gl) {
      return;
    }

    const program = createProgram(gl);
    const positionAttribute = gl.getAttribLocation(program, "a_position");
    const resolutionUniform = gl.getUniformLocation(program, "u_resolution");
    const mouseUniform = gl.getUniformLocation(program, "u_mouse");
    const pointerInfluenceUniform = gl.getUniformLocation(program, "u_pointerInfluence");
    const timeUniform = gl.getUniformLocation(program, "u_time");
    const pixelRatioUniform = gl.getUniformLocation(program, "u_pixelRatio");
    const positionBuffer = gl.createBuffer();
    const currentMouse = { x: 0, y: 0 };
    const targetMouse = { x: 0, y: 0 };
    const pointerInfluence = { current: 0, target: 0 };

    if (!positionBuffer) {
      gl.deleteProgram(program);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const nextWidth = Math.max(1, Math.floor(window.innerWidth * 2 * pixelRatio));
      const nextHeight = Math.max(1, Math.floor(window.innerHeight * 2 * pixelRatio));

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        gl.viewport(0, 0, nextWidth, nextHeight);
      }

      return pixelRatio;
    };

    const updateMouseTarget = (clientX: number, clientY: number) => {
      const bounds = canvas.getBoundingClientRect();

      targetMouse.x = ((clientX - bounds.left) / bounds.width) * canvas.width;
      targetMouse.y = ((bounds.bottom - clientY) / bounds.height) * canvas.height;
    };

    const handleMouseMove = (event: MouseEvent) => {
      updateMouseTarget(event.clientX, event.clientY);
      pointerInfluence.target = 1;
    };
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];

      if (touch) {
        updateMouseTarget(touch.clientX, touch.clientY);
        pointerInfluence.target = 1;
      }
    };
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];

      if (touch) {
        updateMouseTarget(touch.clientX, touch.clientY);
        pointerInfluence.target = 1;
      }
    };
    const handleTouchEnd = () => {
      pointerInfluence.target = 0;
    };
    const render = (timestamp: number) => {
      const previousFrameTime = previousFrameTimeRef.current ?? timestamp;
      const deltaInSeconds = (timestamp - previousFrameTime) / 1000;
      previousFrameTimeRef.current = timestamp;

      if (timestamp - previousRenderTimeRef.current >= targetFrameMs) {
        previousRenderTimeRef.current = timestamp;
        const pixelRatio = resize();
        const smoothing = 1 - Math.pow(0.002, Math.max(deltaInSeconds, 0.001));
        currentMouse.x += (targetMouse.x - currentMouse.x) * smoothing;
        currentMouse.y += (targetMouse.y - currentMouse.y) * smoothing;
        pointerInfluence.current += (pointerInfluence.target - pointerInfluence.current) * smoothing;

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
        gl.uniform2f(mouseUniform, currentMouse.x, currentMouse.y);
        gl.uniform1f(pointerInfluenceUniform, pointerInfluence.current);
        gl.uniform1f(timeUniform, timestamp / 1000);
        gl.uniform1f(pixelRatioUniform, pixelRatio);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      animationFrameRef.current = window.requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    animationFrameRef.current = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed left-0 top-0 z-0 h-[200vh] w-[200vw] pointer-events-none opacity-35"
      aria-hidden="true"
    />
  );
};
