import * as THREE from 'three';
import { createWorld } from './world';
import { Player } from './player';

const CAMERA_OFFSET = new THREE.Vector3(0, 4, 8);
const CAMERA_LERP = 0.08;

function main(): void {
  const container = document.getElementById('app');
  if (!container) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 20, 60);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.4);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(12, 20, 10);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.near = 0.5;
  dir.shadow.camera.far = 50;
  dir.shadow.camera.left = -25;
  dir.shadow.camera.right = 25;
  dir.shadow.camera.top = 25;
  dir.shadow.camera.bottom = -25;
  scene.add(dir);

  const { scene: worldGroup, colliders } = createWorld();
  scene.add(worldGroup);

  const player = new Player();
  scene.add(player.mesh);

  let prevTime = performance.now() / 1000;

  function animate(): void {
    requestAnimationFrame(animate);
    const now = performance.now() / 1000;
    const dt = Math.min(now - prevTime, 0.1);
    prevTime = now;

    player.update(dt, colliders);

    const targetCamPos = player.mesh.position.clone().add(CAMERA_OFFSET);
    camera.position.lerp(targetCamPos, CAMERA_LERP);
    const lookAt = player.mesh.position.clone();
    lookAt.y += 0.8;
    camera.lookAt(lookAt);

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}

main();
