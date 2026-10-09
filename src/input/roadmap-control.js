// Roadmap keyboard control (arrows navigate, Enter/Space start). Active only while the roadmap
// screen is visible; never scrolls the page. See specs/004-interactive-3d-roadmap/contracts/roadmap-input.md.

export function createRoadmapControl({ onStep, onStart }) {
  function onKeyDown(event) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      onStep(1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      onStep(-1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onStart();
    }
  }
  window.addEventListener('keydown', onKeyDown);
  return {
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}