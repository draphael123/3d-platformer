import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import type { LevelData, PlatformData } from './types';

export interface PlatformCollider {
  position: THREE.Vector3;
  size: THREE.Vector3;
}

export interface WorldResult {
  scene: THREE.Group;
  colliders: PlatformCollider[];
  /** Highlighted goal mesh (ring + pillar); rotate in main for pulse */
  goalMesh: THREE.Group;
}

function createGoalMesh(goal: LevelData['goal']): THREE.Group {
  const group = new THREE.Group();
  const [gx, gy, gz] = goal.position;
  const [sx, sy] = goal.size;
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(sx * 0.4, sx * 0.5, sy, 8),
    new THREE.MeshStandardMaterial({
      color: 0x22aa44,
      emissive: 0x00ff44,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.5,
    })
  );
  pillar.position.set(gx, gy, gz);
  pillar.castShadow = true;
  group.add(pillar);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(sx * 0.7, 0.15, 8, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffdd00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.8,
      metalness: 0.6,
      roughness: 0.3,
    })
  );
  ring.position.set(gx, gy + sy * 0.5, gz);
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  group.add(ring);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(sx * 0.6, sx * 0.65, 0.2, 8),
    new THREE.MeshStandardMaterial({
      color: 0x228844,
      emissive: 0x00cc33,
      emissiveIntensity: 0.3,
    })
  );
  base.position.set(gx, gy - sy * 0.5 - 0.1, gz);
  base.receiveShadow = true;
  group.add(base);
  return group;
}

const OBJ_BASE = `${import.meta.env.BASE_URL}Assets/Retro Medieval Kit/Models/OBJ format/`;

function setShadowRecursive(obj: THREE.Object3D, cast: boolean, receive: boolean): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

function loadOBJWithMTL(
  objPath: string,
  mtlPath: string,
  baseUrl: string
): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(baseUrl);
    mtlLoader.load(mtlPath, (materials) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath(baseUrl);
      objLoader.load(objPath, resolve, undefined, reject);
    }, undefined, reject);
  });
}

export function createWorld(levelData: LevelData): Promise<WorldResult> {
  const group = new THREE.Group();
  const colliders: PlatformCollider[] = [];
  const [gw, gd] = levelData.groundSize;
  colliders.push({
    position: new THREE.Vector3(0, 0, 0),
    size: new THREE.Vector3(gw, 1, gd),
  });
  for (const [px, py, pz, sx, sy, sz] of levelData.platforms) {
    colliders.push({
      position: new THREE.Vector3(px, py, pz),
      size: new THREE.Vector3(sx, sy, sz),
    });
  }

  const baseUrl = OBJ_BASE;
  const platformData = levelData.platforms as PlatformData[];

  return Promise.all([
    loadOBJWithMTL('wood-floor.obj', 'wood-floor.mtl', baseUrl),
    loadOBJWithMTL('floor-flat.obj', 'floor-flat.mtl', baseUrl),
  ])
    .then(([woodFloor, floorFlat]) => {
      const groundMesh = woodFloor.clone();
      groundMesh.scale.set(gw, 1, gd);
      groundMesh.position.set(0, -0.5, 0);
      setShadowRecursive(groundMesh, false, true);
      group.add(groundMesh);

      platformData.forEach(([px, py, pz, sx, sy, sz], i) => {
        const mesh = (i === 0 ? floorFlat : woodFloor).clone();
        mesh.scale.set(sx, sy, sz);
        mesh.position.set(px, py, pz);
        setShadowRecursive(mesh, true, true);
        group.add(mesh);
      });

      const goalMesh = createGoalMesh(levelData.goal);
      group.add(goalMesh);

      return { scene: group, colliders, goalMesh };
    })
    .catch((err) => {
      console.error('Failed to load Retro Medieval Kit assets:', err);
      const groundGeom = new THREE.BoxGeometry(gw, 1, gd);
      const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a7c59 });
      const ground = new THREE.Mesh(groundGeom, groundMat);
      ground.position.y = -0.5;
      ground.receiveShadow = true;
      group.add(ground);
      const platformMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
      for (const [px, py, pz, sx, sy, sz] of platformData) {
        const geom = new THREE.BoxGeometry(sx, sy, sz);
        const mesh = new THREE.Mesh(geom, platformMat);
        mesh.position.set(px, py, pz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      }
      const goalMesh = createGoalMesh(levelData.goal);
      group.add(goalMesh);
      return { scene: group, colliders, goalMesh };
    });
}
