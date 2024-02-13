import * as THREE from "three";
import { TweenMax, Power1 } from "gsap";

// Add your Three.js scene setup code here

// Example: Create a clickable element in the scene
function createClickableElement(position, onClick) {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.copy(position);

  cube.onClick = onClick; // Store the click callback

  cube.interactive = true;
  cube.cursor = "pointer";

  cube.addEventListener("click", () => {
    if (cube.onClick) {
      cube.onClick();
    }
  });

  return cube;
}

// Your Three.js scene setup function
function init() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const cube1 = createClickableElement(new THREE.Vector3(-3, 0, 0), () => {
    window.location.href = "social-service1.html";
  });

  const cube2 = createClickableElement(new THREE.Vector3(3, 0, 0), () => {
    window.location.href = "social-service2.html";
  });

  scene.add(cube1);
  scene.add(cube2);

  // Add more objects or customize as needed...

  camera.position.z = 5;

  function animate() {
    requestAnimationFrame(animate);

    // Add animation or update logic here...

    renderer.render(scene, camera);
  }

  animate();
}

init();