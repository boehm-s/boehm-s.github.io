import { useEffect, useRef } from "react";
import p5 from "p5";
import TRUNK from "vanta/dist/vanta.trunk.min";

interface VantaEffect {
  setOptions: (options: { chaos?: number }) => void;
  destroy: () => void;
}

const baseChaos = 0;
const maxChaos = 50;
const scrollChaosIncrement = 1.5;
const skillBadgeChaosIncrement = 8;
const mouseMoveChaosIncrement = 0.5;
const minChaosDecreasePerSecond = 0.75;
const chaosDecreaseCurveStrength = 2;
const resetChaosDecreasePerSecond = 25;

export const VantaTrunkBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<VantaEffect | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chaosRef = useRef(baseChaos);
  const isResettingChaosRef = useRef(false);
  const previousFrameTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    effectRef.current = TRUNK({
      el: containerRef.current,
      p5,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 1,
      backgroundAlpha: 0,
      backgroundColor: 0x000000,
      color: 0xcdcdcd,
      chaos: baseChaos,
      spacing: 10,
    });

    const clearVantaCanvasBackground = () => {
      containerRef.current
        ?.querySelector<HTMLCanvasElement>("canvas")
        ?.style.setProperty("background", "transparent", "important");
    };

    clearVantaCanvasBackground();
    const setupCanvasFrame = window.requestAnimationFrame(() => {
      clearVantaCanvasBackground();
    });

    const setChaos = (chaos: number) => {
      const nextChaos = Math.max(baseChaos, Math.min(maxChaos, chaos));

      chaosRef.current = nextChaos;
      effectRef.current?.setOptions({ chaos: nextChaos });
    };

    const increaseChaos = (amount: number) => {
      if (isResettingChaosRef.current) {
        return;
      }

      isResettingChaosRef.current = false;
      setChaos(chaosRef.current + amount);
    };

    const resetChaos = () => {
      isResettingChaosRef.current = true;
    };

    const handleScroll = () => {
      increaseChaos(scrollChaosIncrement);
    };

    const handleAppScroll = () => {
      increaseChaos(scrollChaosIncrement);
    };

    const handleSkillBadgeClick = () => {
      increaseChaos(skillBadgeChaosIncrement);
    };

    const handleMouseMove = () => {
      increaseChaos(mouseMoveChaosIncrement);
    };

    const handleProfilePictureInteraction = () => {
      resetChaos();
    };

    const updateChaos = (timestamp: number) => {
      const previousFrameTime = previousFrameTimeRef.current ?? timestamp;
      const deltaInSeconds = (timestamp - previousFrameTime) / 1000;
      previousFrameTimeRef.current = timestamp;
      const decreaseSpeed = isResettingChaosRef.current
        ? resetChaosDecreasePerSecond
        : minChaosDecreasePerSecond + Math.log1p(chaosRef.current) * chaosDecreaseCurveStrength;
      const nextChaos = chaosRef.current - decreaseSpeed * deltaInSeconds;

      if (nextChaos < chaosRef.current) {
        setChaos(nextChaos);

        if (nextChaos <= baseChaos) {
          isResettingChaosRef.current = false;
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(updateChaos);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("vanta:app-scroll", handleAppScroll);
    window.addEventListener("vanta:skill-badge-click", handleSkillBadgeClick);
    window.addEventListener("vanta:profile-picture-interaction", handleProfilePictureInteraction);
    animationFrameRef.current = window.requestAnimationFrame(updateChaos);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("vanta:app-scroll", handleAppScroll);
      window.removeEventListener("vanta:skill-badge-click", handleSkillBadgeClick);
      window.removeEventListener("vanta:profile-picture-interaction", handleProfilePictureInteraction);
      window.cancelAnimationFrame(setupCanvasFrame);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      effectRef.current?.destroy();
      effectRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed left-0 top-0 z-0 h-[200vh] w-[200vw] pointer-events-none opacity-35 [&_canvas]:!bg-transparent"
      aria-hidden="true"
    />
  );
};
