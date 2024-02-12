import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { convertLatLonToVec3 } from "./utils";
import peopleData from "./peopleData.json";
import moonData from "./moonData.json";
import "../style.css";

function init() {
  const app = document.getElementById("app");
  const sphereRadius = 2.5;
  const mousePos = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  // create scene,
  const scene = new THREE.Scene();

  // create camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 10);

  // Renderer
  let sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.useLegacyLights = true;
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const canvasEl = renderer.domElement;

  // add the output of the render function to the HTML
  app.appendChild(renderer.domElement);

  /* Orbit Control */
  const orbitControl = new OrbitControls(camera, renderer.domElement);
  orbitControl.minDistance = 7.5;
  orbitControl.maxDistance = 35;
  orbitControl.enablePan = false;
  orbitControl.enableZoom = false;
  orbitControl.enableDamping = true; // Enable smooth camera movement
  orbitControl.dampingFactor = 0.05;
  orbitControl.rotateSpeed = 0.8;

  /* Texture Loader */
  const textureLoader = new THREE.TextureLoader();

  /* Textures */
  const earthTexture = textureLoader.load("/images/2k_earth_nightmap.jpeg");
  const earthBumpMap = textureLoader.load("/images/8081-earthbump2k.jpeg");
  const earthCloudsMap = textureLoader.load("/images/2k_earth_clouds.png");

  /* Light */
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(-1, 1, 1);
  scene.add(directionalLight);

  /* Globe */
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  const earthGeoMetry = new THREE.SphereGeometry(sphereRadius, 64, 64),
    earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: earthBumpMap,
      bumpScale: 0.2,
    });

  const earthMesh = new THREE.Mesh(earthGeoMetry, earthMaterial);
  earthGroup.add(earthMesh);

  const earthCloudMesh = new THREE.Mesh(
    new THREE.SphereGeometry(sphereRadius + 0.003, 64, 64),
    new THREE.MeshPhongMaterial({
      map: earthCloudsMap,
      transparent: true,
      opacity: 0.2,
    })
  );

  earthGroup.add(earthCloudMesh);

  // Earth Glow Shader
  const earthGlowGeometry = new THREE.SphereGeometry(sphereRadius + 0.325),
    earthGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: [
        "varying vec3 vNormal;",
        "void main() {",
        "vNormal = normalize( normalMatrix * normal );",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}",
      ].join("\n"),
      fragmentShader: [
        "varying vec3 vNormal;",
        "void main() {",
        "float intensity = pow( 0.99 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 6.0 );",
        "gl_FragColor = vec4( .28, .48, 1.0, 0.4 ) * intensity;",
        "}",
      ].join("\n"),
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

  const glowingEarth = new THREE.Mesh(earthGlowGeometry, earthGlowMaterial);
  glowingEarth.renderOrder = -1;

  earthGroup.add(glowingEarth);

  const moonRotationSpeed = 0.0005;

  /* Moon */
  const moonTexture = textureLoader.load("/images/moon.png");
  const moonGeometry = new THREE.SphereGeometry(2, 64, 64); // Adjust the moon size
  const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.set(10, 0, 0); // Adjust the position as needed
  scene.add(moon);

  /* People Images */
  const peopleGroup = new THREE.Group();
  earthGroup.add(peopleGroup);

  for (let i = 0; i < peopleData.length; i++) {
    let current = peopleData[i];
    let peopleMaterial = new THREE.SpriteMaterial({
      map: textureLoader.load(`/images/${current.img}`),
      side: THREE.DoubleSide,
    });
    let peopleMesh = new THREE.Sprite(peopleMaterial);
    peopleMesh.position.copy(
      convertLatLonToVec3(current.lat, current.lon).multiplyScalar(
        sphereRadius + 0.65
      )
    );

    peopleMesh.userData.id = current.id;
    peopleGroup.add(peopleMesh);
  }
  earthGroup.rotation.y = 4;

  // Function to update moon's position and rotation
  function updateMoonPosition() {
    // Update moon's rotation around the Earth
    moon.rotation.y -= moonRotationSpeed;

    // Calculate the position of the moon in orbit
    const orbitRadius = 13; // Adjust the orbit radius as needed
    const moonOrbitPosition = new THREE.Vector3(
      Math.cos(moon.rotation.y) * orbitRadius,
      0,
      Math.sin(moon.rotation.y) * orbitRadius
    );

    // Set the moon's position in the scene
    moon.position.copy(moonOrbitPosition);
  }

  // Combine both raycasters into a single function
  function handleMouseClick(event) {
    mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Reset scale for people
    for (let i = 0; i < peopleGroup.children.length; i++) {
      const current = peopleGroup.children[i];
      if (current.scale.x !== 1) {
        current.scale.set(1, 1, 1);
      }
    }

    // Check intersections with people and moon
    raycaster.setFromCamera(mousePos, camera);
    const intersects = raycaster.intersectObjects([...peopleGroup.children, moon]);

    if (intersects.length) {
      const clickedObject = intersects[0].object;

      if (clickedObject.type === "Sprite") {
        clickedObject.scale.set(1.2, 1.2, 1.2);
        clickedObject.lookAt(-1, 0, 0);

        const clickedPerson = peopleData.find(
          (person) => person.id === clickedObject.userData.id
        );

        console.log("Clicked Person:", clickedPerson);

        if (clickedPerson && clickedPerson.url) {
          console.log("Navigating to:", clickedPerson.url);
          simulateClick(clickedPerson.url); // Use the simulateClick function
        }
      } else if (clickedObject === moon) {
        console.log("Clicked Moon");

        // Navigate to /about-hth
        simulateClick("/src/components/web3"); // Use the simulateClick function
      }
    }
  }

  function simulateClick(url) {
  // Append .html extension if it's not already present
  const finalUrl = url.endsWith('.html') ? url : `${url}.html`;

  // Use window.location.href to navigate to the specified URL
  window.location.href = finalUrl;
}

  // Use the unified click event listener
  canvasEl.addEventListener("click", handleMouseClick);

  // Resize
  window.addEventListener("resize", function () {
    sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.render(scene, camera);
  });

  // function for re-rendering/animating the scene
  function tick() {
    earthGroup.rotation.y += 0.0007;
    updateMoonPosition();
    orbitControl.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

init();
