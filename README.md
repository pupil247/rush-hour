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

## Contrôles

- **Souris / tactile** : cliquez une voiture pour la sélectionner, faites-la glisser le long de sa
  file pour la déplacer ; cliquez une case vide pour désélectionner.
- **Clavier** : en mode navigation (rien de sélectionné), les flèches changent la voiture mise en
  surbrillance ; `Espace` la sélectionne. Une fois sélectionnée, les flèches la déplacent d'une case
  le long de son axe, et `Espace` la désélectionne.
- **Raccourcis** : `Ctrl/Cmd+Z` annuler, `Ctrl/Cmd+Shift+Z` ou `Ctrl/Cmd+Y` rétablir, `R`
  recommencer, `H` voir la solution.

## Carte des niveaux (3D)

La route des niveaux est un **serpentin 3D** : un nœud par défi, régions de difficulté colorées,
et une petite **voiture rouge** (celle du joueur) qui roule de nœud en nœud — elle fait demi-tour
quand on recule et s'arrête toujours sur un nœud. Survol : `▲` niveau suivant, `▼` niveau précédent
(touches, ou boutons à l'écran sur mobile) ; `Entrée`/`Espace` (ou bouton « Jouer », ou clic sur le
nœud où la voiture est garée) lance le niveau. La voiture rouge du jeu elle-même est toujours
orientée vers la sortie.

## Véhicules 3D

Les voitures (2 cases) et les camions (3 cases) utilisent des modèles 3D préfabriqués, fournis avec
le jeu dans `assets/models/` et chargés à l'exécution (glTF binaire). Chaque véhicule reçoit une
couleur de carrosserie distincte, la voiture rouge restant unique. Si un modèle est indisponible, le
jeu bascule sur un simple bloc jouable (aucune perte de fonctionnalité). Sources et licences des
modèles : [`assets/models/ATTRIBUTION.md`](./assets/models/ATTRIBUTION.md).

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
