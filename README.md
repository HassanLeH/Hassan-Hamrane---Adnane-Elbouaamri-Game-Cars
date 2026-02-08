***
---

# 🏎️ Race Challenge - Simulation de Course 2D

**Développé dans le cadre du projet académique de simulation interactive.**
*Technologies : JavaScript (ES6+), p5.js, Physique Vectorielle.*

---

## 📄 Présentation du Projet

**Race Challenge** est un jeu de course en 2D vu de dessus, développé pour démontrer l'application de concepts mathématiques et physiques dans un environnement interactif.

Le projet ne se limite pas à un simple jeu d'arcade ; il intègre une **Intelligence Artificielle (IA)** basée sur des comportements de pilotage autonomes (Steering Behaviors) et un moteur physique gérant l'accélération, la friction et les collisions. L'objectif est de traverser 10 niveaux de difficulté croissante en gérant stratégiquement les ressources (Nitro) et l'évitement d'obstacles.

---

## 🛠 Architecture Technique

Le projet repose sur une architecture **Orientée Objet (POO)** stricte pour garantir la modularité et l'extensibilité du code.

### 1. Modélisation Physique & Vecteurs

Le mouvement des véhicules est régi par les lois de Newton, implémentées via la classe `p5.Vector`.

* **Position, Vitesse, Accélération :** Chaque véhicule met à jour sa position à chaque frame en fonction de sa vitesse et des forces appliquées (moteur, friction, collisions).
* **Forces dynamiques :**
* *Friction :* Ralentissement naturel sur la piste ou accru sur les surfaces rugueuses (cônes).
* *Impulsion :* Accélération brutale via le système de Nitro.



### 2. Intelligence Artificielle (Steering Behaviors)

Les adversaires (et le mode Autopilote du joueur) utilisent les algorithmes de **Craig Reynolds** pour une navigation fluide :

* **Seek (Poursuite) :** Le véhicule calcule la trajectoire idéale vers le prochain *waypoint*.
* **Separation (Séparation) :** Force répulsive pour éviter que les IA ne se chevauchent.
* **Obstacle Avoidance (Évitement) :** Utilisation de **Raycasting** (lancers de rayons) pour détecter les murs et corriger la trajectoire avant l'impact.

---

## 📂 Structure du Projet

```bash
GameProject/
├── index.html          # Point d'entrée (Canvas & UI)
├── sketch.js           # Contrôleur principal (Boucle de jeu, États)
├── assets/             # Images et ressources graphiques
│
├── src/
│   ├── Vehicule.js     # Classe Mère (Physique de base)
│   ├── PlayerCar.js    # Hérite de Vehicule (Input Clavier + Nitro)
│   ├── FollowerCar.js  # Hérite de Vehicule (Logique IA)
│   ├── Track.js        # Génération procédurale des circuits & Obstacles
│   └── LevelSelect.js  # Gestionnaire de progression

```

---

## 🎮 Instructions & Contrôles

### Commandes

| Touche | Action |
| --- | --- |
| **Haut / W** | Accélérer (Force moteur) |
| **Bas / S** | Freiner / Reculer |
| **Gauche / A** | Rotation Anti-horaire |
| **Droite / D** | Rotation Horaire |
| **SHIFT / N** | **Nitro** (Boost temporaire) 🔥 |
| **A** | Activer/Désactiver l'**Autopilote** 🤖 |
| **D** | Mode **Debug** (Visualisation des vecteurs) 🛠️ |
| **M** | Retour au Menu |

### Mécaniques de Jeu

1. **Système Nitro :** Une jauge se recharge lentement. L'activation offre une accélération massive mais consomme la jauge rapidement.
2. **Obstacles :**
* *Cônes :* Ralentissement modéré.
* *Barrières :* Collision élastique (rebond).
* *Huile :* Perte de contrôle (vecteur de direction découplé du vecteur vitesse).


3. **Conditions de Victoire :** Terminer 1er après 2 tours pour débloquer le niveau suivant.

---

## 🧠 Analyse : Défis & Apprentissages

Ce projet a constitué un défi technique important, nécessitant plusieurs itérations pour atteindre un résultat stable.

### ⚠️ Difficultés Rencontrées

1. **Réglage de l'IA (Tuning) :** Trouver l'équilibre entre une IA qui suit parfaitement la ligne (trop robotique) et une IA qui fait des erreurs "humaines" a été complexe. Il a fallu ajuster les forces de *steering* pour éviter des mouvements saccadés.
2. **Détection de Collisions :** La gestion des collisions avec les murs (barrières) posait initialement problème, les véhicules passant parfois "à travers" à haute vitesse. L'implémentation de cercles de collision et de rayons prédictifs a résolu ce souci.
3. **Gestion des États :** Gérer les transitions entre le menu, le jeu, la victoire et le game over sans fuite de mémoire ou superposition d'écrans a nécessité une machine à états rigoureuse dans `sketch.js`.

### 🎓 Compétences Acquises

* **Mathématiques Appliquées :** Maîtrise des vecteurs (normalisation, magnitude, produits scalaires) pour simuler une physique réaliste.
* **Algorithmique Avancée :** Compréhension profonde des comportements émergents (comment des règles simples de *separation* et *cohesion* créent une course réaliste).
* **Clean Code & POO :** Utilisation de l'héritage pour éviter la duplication de code entre la voiture du joueur et les IA.
* **Debugging Visuel :** Création d'outils de debug (affichage des rayons de détection) pour comprendre le "raisonnement" de l'ordinateur en temps réel.

---

## 🚀 Installation

1. Cloner ou télécharger le dossier du projet.
2. Ouvrir `index.html` dans un navigateur moderne (Chrome, Firefox, Edge).
3. *(Recommandé)* Pour éviter les blocages de sécurité liés aux images locales, utiliser un serveur local (ex: extension "Live Server" sur VS Code).

---
**Année :** 2026
