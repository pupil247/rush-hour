# Rush Hour (web, sans build)

Jeu de puzzle façon Rush Hour, en 3D, sans étape de build. La logique de jeu est pure et testée ;
le rendu utilise Three.js chargé par un import map depuis un CDN.

## Règles

Les règles font autorité et sont en lecture seule : voir [`RULES.md`](./RULES.md). Les constantes du
jeu (`src/core/rules.js`) en sont dérivées et un test de garde vérifie qu'elles restent cohérentes.

## Lancer le jeu

Aucun build. Servez simplement le dossier avec un serveur de fichiers statique :

```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

## Tests

```bash
# Tests unitaires du cœur pur (aucune installation)
node --test

# Tests navigateur (nécessite Playwright : npm install && npx playwright install)
npm run test:e2e
```

## Contenu des défis

Les 10 défis (`challenges.json`) sont vérifiés par le solveur. Pour recalculer les solutions
optimales (outil hors ligne, jamais chargé par le jeu) :

```bash
node tools/bake-solutions.mjs
```

## Structure

- `src/core/` — logique pure (plateau, déplacements, état de partie, solveur, validation). Aucun import DOM/Three.js.
- `src/render/` — rendu Three.js (scène, plateau, véhicules, caméra, animations).
- `src/input/` — glisser-déposer à la souris/tactile et clavier.
- `src/ui/` — écran route (progression), HUD, boîtes de dialogue, textes français.
- `src/data/` — chargement et validation du catalogue de défis.
- `tools/` — outillage hors ligne.
- `tests/` — tests unitaires (`node --test`) et bout en bout (Playwright).
