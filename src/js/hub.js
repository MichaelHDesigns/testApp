import * as THREE from "three";
import { TweenMax, Power1 } from "gsap";

const mousePos = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const textureLoader = new THREE.TextureLoader();
const spritePositions = [
  { x: 1.35, z: -3.0 },
  { x: 1.47, z: -2.0 },
  { x: 1.79, z: -1.0 },
  { x: 2.2,  z: 0.05 },
];


const sprites = [];

function simulateClick(url) {
  // Append .html extension if it's not already present
  const finalUrl = url.endsWith('.html') ? url : `${url}.html`;

  // Use window.location.href to navigate to the specified URL
  window.location.href = finalUrl;
}

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

if (window.innerWidth > 800) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set(0, 2, 10);

var scene = new THREE.Scene();
var city = new THREE.Object3D();
var smoke = new THREE.Object3D();
var town = new THREE.Object3D();

var createCarPos = true;
var uSpeed = 0.002; // Adjusted for smoother rotation

var setcolor = 0x34bcaa;

scene.background = new THREE.Color(setcolor);
scene.fog = new THREE.Fog(setcolor, 10, 16);

// Import hubData directly
import hubData from "../hubData.json";

function mathRandom(num = 8) {
  return -Math.random() * num + Math.random() * num;
}

function init() {
  var segments = 2;

  // Hub Group
  const hubGroup = new THREE.Group();
  scene.add(hubGroup);

  // People Images
  let peopleGroup = new THREE.Group();
  hubGroup.add(peopleGroup);

  // Define fixed positions for the buildings
const buildingPositions = [
  { x: -1.7, z: 0 },
  { x: -0.5, z: 0 },
  { x: 0.7, z: 0 },
  { x: 1.9, z: 0 },
];

  for (var i = 0; i < 4; i++) {
    var geometry = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments);
    var material = new THREE.MeshStandardMaterial({
        color: 0x000000,
        flatShading: THREE.SmoothShading, // Ensure flatShading is defined
        side: THREE.DoubleSide
    });

    var wmaterial = new THREE.MeshLambertMaterial({
      color: 0xFFFFFF,
      wireframe: true,
      transparent: true,
      opacity: 0.03,
      side: THREE.DoubleSide
    });

    var cube = new THREE.Mesh(geometry, material);
    var wire = new THREE.Mesh(geometry, wmaterial);
    var floor = new THREE.Mesh(geometry, material);
    var wfloor = new THREE.Mesh(geometry, wmaterial);

    floor.isClickable = false; // Set a custom property to identify the floor
    floor.name = "floor"; // Set the name property for identification in raycasting

    wfloor.isClickable = false; // Set a custom property for the wireframe
    wfloor.name = "floor_wireframe"; // Set the name property for identification in raycasting

    cube.add(wfloor);
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.rotationValue = 0.1 + Math.abs(mathRandom(5));

    floor.scale.y = 0.05;
    cube.scale.y = 2.5;

    var cubeWidth = 0.9;
    cube.scale.x = cube.scale.z = cubeWidth + mathRandom(1 - cubeWidth);
      cube.position.set(buildingPositions[i].x, 0, buildingPositions[i].z);
  console.log(`Building ${i + 1} position: ${cube.position.x}, ${cube.position.y}, ${cube.position.z}`);

  floor.position.set(cube.position.x, 0, cube.position.z);

  cube.userData = { index: i + 1 };
  cube.addEventListener('click', onCubeClick);

  town.add(floor);
  town.add(cube);

  // Add sprites to the buildings with fixed positions
    let currentHub = hubData[i];
    let peopleMaterial = new THREE.SpriteMaterial({
        map: textureLoader.load(`/images/${currentHub.img}`),
        side: THREE.DoubleSide,
    });
    let peopleMesh = new THREE.Sprite(peopleMaterial);

    // Set initial positions for the sprites directly above the corresponding buildings
    const initialSpritePosition = spritePositions[i];
    peopleMesh.position.set(initialSpritePosition.x, cube.position.y + cube.scale.y / 2 + 0.1, initialSpritePosition.z);

    // Adjust the sprite scale for better visibility
    peopleMesh.scale.set(0.5, 0.5, 0.5);

    peopleGroup.add(peopleMesh);

    // Store each sprite in the array
    sprites.push(peopleMesh);

    console.log(`Sprite ${i + 1} position: ${peopleMesh.position.x}, ${peopleMesh.position.y}, ${peopleMesh.position.z}`);
}

  var gmaterial = new THREE.MeshToonMaterial({ color: 0xFFFF00, side: THREE.DoubleSide });
  var gparticular = new THREE.CircleGeometry(0.01, 3);

  for (var h = 1; h < 300; h++) {
    var particular = new THREE.Mesh(gparticular, gmaterial);
    particular.position.set(mathRandom(), mathRandom(), mathRandom());
    particular.rotation.set(mathRandom(), mathRandom(), mathRandom());
    smoke.add(particular);
  }

var pmaterial = new THREE.MeshPhongMaterial({
  color: 0x000000,
  side: THREE.DoubleSide,
  shininess: 10,          // Use shininess instead of roughness
  metal: 0.6,             // Use metal instead of metalness
  opacity: 0.9,
  transparent: true
});

  var pgeometry = new THREE.PlaneGeometry(60, 60);
  var pelement = new THREE.Mesh(pgeometry, pmaterial);
  pelement.rotation.x = -90 * Math.PI / 180;
  pelement.position.y = -0.001;
  pelement.receiveShadow = true;

  city.add(pelement);

  // Add the Hub Group to the scene
  hubGroup.rotation.y = 4;
  city.add(hubGroup);
  hubGroup.add(peopleGroup);

  // Use the unified click event listener
  renderer.domElement.addEventListener("click", handleMouseClick);
}

function onCubeClick(event) {
  var cubeIndex = event.target.userData.index;
  var personData = hubData.find(person => person.index === cubeIndex);

  if (personData) {
    console.log(`Clicked on person ${cubeIndex}`);

    // Use the simulateClick function with personData.url
    simulateClick(personData.url);
  } else {
    console.log('Person data not found');
  }
}

function handleMouseClick(event) {
  mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mousePos, camera);
  const intersects = raycaster.intersectObjects([...town.children, ...smoke.children]);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;

    // Check if the clicked object is a building (cube)
    if (clickedObject.type === "Mesh" && clickedObject.userData && clickedObject.userData.index !== undefined) {
      const cubeIndex = clickedObject.userData.index;
      const personData = hubData.find(person => person.index === cubeIndex);

      if (personData) {
        console.log(`Clicked on person ${cubeIndex}`);
        simulateClick(personData.url);
      } else {
        console.log('Person data not found');
      }
    }
  }
}

var ambientLight = new THREE.AmbientLight(0xFFFFFF, 4);
var lightFront = new THREE.SpotLight(0xFFFFFF, 20, 10);
var lightBack = new THREE.PointLight(0xFFFFFF, 0.5);

var spotLightHelper = new THREE.SpotLightHelper(lightFront);

lightFront.rotation.x = 45 * Math.PI / 180;
lightFront.rotation.z = -45 * Math.PI / 180;
lightFront.position.set(5, 5, 5);
lightFront.castShadow = true;
lightFront.shadow.mapSize.width = 6000;
lightFront.shadow.mapSize.height = lightFront.shadow.mapSize.width;
lightFront.penumbra = 0.1;
lightBack.position.set(0, 6, 0);

smoke.position.y = 2;

scene.add(ambientLight);
city.add(lightFront);
scene.add(lightBack);
scene.add(city);
city.add(smoke);
city.add(town);

var gridHelper = new THREE.GridHelper(60, 120, 0x34bcaa, 0x000000);
city.add(gridHelper);

function createCars(cScale = 2, cPos = 20, cColor = 0x34bcaa) {
  var cMat = new THREE.MeshToonMaterial({ color: cColor, side: THREE.DoubleSide });
  var cGeo = new THREE.BoxGeometry(1, cScale / 40, cScale / 40);
  var cElem = new THREE.Mesh(cGeo, cMat);
  var cAmp = 3;

  if (createCarPos) {
    createCarPos = false;
    cElem.position.x = -cPos;
    cElem.position.z = mathRandom(cAmp);

    TweenMax.to(cElem.position, 3, { x: cPos, repeat: -1, yoyo: true, delay: mathRandom(3) });
  } else {
    createCarPos = true;
    cElem.position.x = mathRandom(cAmp);
    cElem.position.z = -cPos;
    cElem.rotation.y = 90 * Math.PI / 180;

    TweenMax.to(cElem.position, 5, { z: cPos, repeat: -1, yoyo: true, delay: mathRandom(3), ease: Power1.easeInOut });
  }

  cElem.receiveShadow = true;
  cElem.castShadow = true;
  cElem.position.y = Math.abs(mathRandom(2));
  city.add(cElem);
}

function generateLines() {
  for (var i = 0; i < 60; i++) {
    createCars(0.1, 20);
  }
}

function animateSprites() {
    sprites.forEach((sprite, index) => {
        TweenMax.to(sprite.position, 3, { x: sprite.position.x + 1, repeat: -1, yoyo: true, delay: index });
    });
}

function animate() {
  requestAnimationFrame(animate);

  smoke.rotation.y += 0.01;
  smoke.rotation.x += 0.01;

  camera.lookAt(city.position);
  renderer.render(scene, camera);
}

generateLines();
init();
animate();
