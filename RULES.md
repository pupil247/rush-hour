# Règles du jeu — Rush Hour

> **Document de référence en lecture seule.** Ce fichier est la source de vérité des règles.
> Il ne doit pas être reformulé, réinterprété ni modifié par le code, les tests ou l'outillage.
> Toute modification passe par une amendement explicite (voir la constitution du projet).

## Règles d'origine (verbatim)

Objectif : rejoindre la sortie avec la voiture rouge pour retrouver le tapis rouge.

Plateau : carré de 6 × 6 cases, avec une sortie à droite de la 3ᵉ rangée.

Véhicules : voitures de 2 cases (dont une rouge) et camions de 3 cases.

Mise en place : choisir un défi ; la carte indique les véhicules et leurs positions initiales.
La voiture rouge est alignée vers la sortie, mais bloquée.

Déplacement : un véhicule ne peut qu'avancer ou reculer ; il ne se déplace jamais sur le côté.

Règle d'or : ne jamais soulever un véhicule du plateau ; il reste dans sa file.

Fin de partie : la voiture rouge parvient à la sortie. Moins il y a de déplacements, meilleure est
la solution.

Si vous êtes bloqués : replacer les véhicules dans leur position initiale et recommencer.
La solution est au dos de chaque défi.

Niveaux des défis : Débutant, Intermédiaire, Avancé, Expert, Génie.

## Constantes du jeu

Les lignes suivantes sont analysées par le test de garde des règles
(`rulesMatchReference` dans `src/core/rules.js`).

- Plateau : 6 × 6 cases
- Sortie : 3e rangée, à droite
- Voiture : 2 cases
- Camion : 3 cases
- Voiture rouge : exactement 1
- Déplacement : 1 par glissement continu

## Précisions retenues

Ces précisions lèvent les ambiguïtés du texte d'origine et sont elles aussi figées.

- **Victoire** : la voiture rouge doit sortir **entièrement** du plateau (toutes ses cases au-delà
  du bord droit) pour gagner.
- **Comptage des déplacements** : un glissement continu d'un véhicule compte pour **1 déplacement**,
  peu importe le nombre de cases parcourues.
- **Sortie** : seule la voiture rouge peut franchir la sortie, et uniquement sur la 3ᵉ rangée.
- **Déplacement** : chaque véhicule reste dans sa file ; on ne le soulève jamais et on ne le déplace
  jamais latéralement.
