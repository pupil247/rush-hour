import { STRINGS } from './strings.fr.js';

// Roadmap screen: five difficulty regions, one stop per challenge, a car token at the player's
// current position, and locked/unlocked/solved states.
export function renderRoadmap(container, roadmap, challenges, onSelect) {
  container.replaceChildren();
  const byId = new Map(challenges.map((c) => [c.id, c]));

  const wrap = document.createElement('div');
  wrap.className = 'roadmap-wrap';

  const title = document.createElement('h1');
  title.textContent = STRINGS.appTitle;
  const subtitle = document.createElement('h2');
  subtitle.textContent = STRINGS.roadmapTitle;
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = STRINGS.roadmapHint;
  wrap.append(title, subtitle, hint);

  const stopsById = new Map(roadmap.stops.map((s) => [s.id, s]));

  for (const region of roadmap.regions) {
    const section = document.createElement('section');
    section.className = 'region';
    const heading = document.createElement('h3');
    heading.textContent = region.difficulty;
    section.append(heading);

    const list = document.createElement('ol');
    list.className = 'roadmap';
    for (const id of region.challengeIds) {
      const stop = stopsById.get(id);
      const challenge = byId.get(id);
      const li = document.createElement('li');
      li.className = 'stop';
      if (stop.unlocked) li.classList.add('unlocked');
      else li.classList.add('locked');
      if (stop.solved) li.classList.add('solved');
      if (stop.current) li.classList.add('current');

      const token = document.createElement('span');
      token.className = 'token';
      token.textContent = stop.current ? '🚗' : stop.solved ? '✅' : stop.unlocked ? '📍' : '🔒';

      const name = document.createElement('span');
      name.className = 'stop-name';
      name.textContent = challenge.name;

      const meta = document.createElement('span');
      meta.className = 'stop-meta';
      meta.textContent =
        stop.solved && stop.bestMoveCount != null
          ? `${STRINGS.best} : ${stop.bestMoveCount} ${STRINGS.movesShort}`
          : stop.unlocked
            ? STRINGS.play
            : STRINGS.locked;

      li.append(token, name, meta);
      if (stop.unlocked) {
        li.tabIndex = 0;
        li.addEventListener('click', () => onSelect(id));
        li.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(id);
          }
        });
      }
      list.append(li);
    }
    section.append(list);
    wrap.append(section);
  }

  container.append(wrap);
}
