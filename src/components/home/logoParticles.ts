export interface LogoParticle { x: number; y: number; color: string; alpha: number; phase: number; }

/** Sample evenly across the mark, with a hard cap independent of image resolution. */
export function sampleLogoParticles(
  pixels: { data: Uint8ClampedArray; width: number; height: number },
  budget = 720,
): LogoParticle[] {
  if (budget < 1 || pixels.width < 1 || pixels.height < 1) return [];
  const candidates: LogoParticle[] = [];
  const step = Math.max(2, Math.floor(Math.sqrt(pixels.width * pixels.height / (budget * 3))));
  for (let y = 0; y < pixels.height; y += step) {
    for (let x = 0; x < pixels.width; x += step) {
      const index = (y * pixels.width + x) * 4;
      const [r, g, b, alpha] = pixels.data.subarray(index, index + 4);
      if (alpha > 40 && Math.max(r, g, b) > 32) {
        candidates.push({ x: x / pixels.width, y: y / pixels.height, color: `rgb(${r},${g},${b})`, alpha: alpha / 255, phase: ((x * 17 + y * 31) % 360) * Math.PI / 180 });
      }
    }
  }
  if (candidates.length <= budget) return candidates;
  return Array.from({ length: Math.floor(budget) }, (_, index) => candidates[Math.floor(index * candidates.length / budget)]);
}
