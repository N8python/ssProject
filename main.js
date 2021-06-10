let mainScene;
const infoDiv = document.getElementById("infoDiv");
const backButton = document.getElementById("backButton");

function angleDifference(angle1, angle2) {
    const diff = ((angle2 - angle1 + Math.PI) % (Math.PI * 2)) - Math.PI;
    return (diff < -Math.PI) ? diff + (Math.PI * 2) : diff;
}

const easeInOut = x => x < .5 ? 2 * x * x : -1 + (4 - 2 * x) * x;
const insertAt = (source, target, toInsert) => {
    return source.slice(0, source.indexOf(target) + target.length) +
        toInsert +
        source.slice(source.indexOf(target) + target.length);
}
class MainScene extends Scene3D {
    constructor() {
        super({ key: 'MainScene' })
    }

    init() {
        this.accessThirdDimension()
    }

    async create() {
        this.third.warpSpeed("-ground", "-orbitControls");
        mainScene = this;
        this.third.lights.ambientLight({ intensity: 0.2 });
        this.third.load.preload("podium", "./models/podium.fbx");
        this.third.load.preload("painting", "./models/painting.fbx");
        this.third.load.preload("walkieTalkie", "./models/walkieTalkie.fbx");
        this.third.load.preload("lantern", "./models/lantern.fbx");
        this.third.load.preload("sugarcane", "./models/sugarcane.fbx");
        this.third.load.preload("sugar", "./models/sugar.fbx");
        this.third.load.preload("millModel", "./models/mill.fbx");
        this.third.load.preload("shipModel", "./models/ship.fbx");
        this.third.load.preload("bookshelf", "./models/bookshelf.fbx");
        this.third.load.preload("apple", "./assets/apple.jpeg");
        this.third.load.preload("vd", "./assets/vd.png");
        this.third.load.preload("saintt", "./assets/saintt.jpeg");
        this.third.load.preload("skullpsu", "./assets/skullpsu.png");
        this.third.load.preload("cm", "./assets/cm.png");
        this.third.load.preload("mill", "./assets/mill.png");
        this.third.load.preload("ship", "./assets/ship.jpeg");
        this.third.load.preload("sugarplant", "./assets/sugarplant.png");
        this.third.load.preload("slavedepart", "./assets/slavedepart.png");
        this.third.load.preload("apprentice", "./assets/apprentice.jpeg");
        this.third.load.preload("tj", "./assets/tj.png");
        this.shaders = [];
        this.anims = [];
        const woodTexture = await this.third.load.texture("assets/wood.jpeg");
        const stoneTexture = await this.third.load.texture("assets/stone.jpeg");
        const darkwoodTexture = await this.third.load.texture("assets/darkwood.jpeg");
        const sugarTexture = await this.third.load.texture("assets/sugar.jpeg");
        const models = {
            "podium": {
                model: await this.third.load.fbx("podium"),
                scale: [0.004, 0.003, 0.004],
                elevation: 0.55
            },
            "painting": {
                model: await this.third.load.fbx("painting"),
                scale: [0.004, 0.003, 0.004],
                elevation: 2
            },
            "lantern": {
                model: await this.third.load.fbx("lantern"),
                scale: [0.0015, 0.0015, 0.0015],
                elevation: 2
            },
            "sugarcane": {
                model: await this.third.load.fbx("sugarcane"),
                scale: [0.002, 0.0015, 0.002],
                elevation: 0.5
            },
            "mill": {
                model: await this.third.load.fbx("millModel"),
                scale: [0.002, 0.002, 0.002],
                elevation: 0.5
            },
            "ship": {
                model: await this.third.load.fbx("shipModel"),
                scale: [0.0015, 0.0015, 0.0015],
                elevation: 0.5
            },
            "bookshelf": {
                model: await this.third.load.fbx("bookshelf"),
                scale: [0.002, 0.002, 0.002],
                elevation: 1.1
            },
            "sugar": {
                model: await this.third.load.fbx("sugar"),
                scale: [0.002, 0.002, 0.002],
                elevation: 0.5
            }
        }
        const layoutReq = await fetch("./layout.txt");
        const layout = await layoutReq.text();
        const startParamsIndex = layout.indexOf("--Params--");
        const endParamsIndex = layout.indexOf("--EndParams--");
        const paramsText = layout.slice(startParamsIndex + 10, endParamsIndex);
        const params = {};
        paramsText.split("\n").slice(1, -1).forEach(param => {
            const key = param.split("is")[0].trim();
            const value = JSON.parse(param.split("is")[1].trim());
            params[key] = value;
        });
        const startIdsIndex = layout.indexOf("--Ids--");
        const endIdsIndex = layout.indexOf("--EndIds--");
        const idsText = layout.slice(startIdsIndex + 7, endIdsIndex);
        const ids = {};
        idsText.split(";").slice(0, -1).forEach(param => {
            const key = param.split("is")[0].trim();
            const value = JSON.parse(param.split("is")[1].trim());
            ids[key] = value;
        });
        const startLayoutIndex = layout.indexOf("--Layout--");
        const endLayoutIndex = layout.indexOf("--EndLayout--");
        const layoutText = layout.slice(startLayoutIndex + 11, endLayoutIndex);
        const layoutTokens = layoutText.split(" ").flatMap(x => x.includes("\n") ? [x.split("\n")[0], "\n", x.split("\n")[1]] : x);
        const layoutMatrix = [];
        const spliceIdxs = [0];
        for (let i = 0; i < layoutTokens.length; i++) {
            if (layoutTokens[i] === "\n") {
                spliceIdxs.push(i + 1);
            }
        }
        for (let i = 0; i < spliceIdxs.length - 1; i++) {
            layoutMatrix.push(layoutTokens.slice(spliceIdxs[i], spliceIdxs[i + 1] - 1));
        }
        const originCoords = { x: 0, y: 0 };
        for (let row = 0; row < layoutMatrix.length; row++) {
            for (let col = 0; col < layoutMatrix[row].length; col++) {
                if (layoutMatrix[row][col] === "X") {
                    originCoords.x = row;
                    originCoords.y = col;
                    break;
                }
            }
        }
        this.clickableMeshes = [];
        for (let row = 0; row < layoutMatrix.length; row++) {
            for (let col = 0; col < layoutMatrix[row].length; col++) {
                const relativeCoords = { x: row - originCoords.x, y: col - originCoords.y };
                const tileType = layoutMatrix[row][col];
                if (tileType === "-") {
                    const mesh = this.third.physics.add.box({ x: relativeCoords.y, y: 1, height: 3, z: relativeCoords.x }, { phong: { map: darkwoodTexture } });
                    mesh.body.setCollisionFlags(2);
                } else if (tileType === "'" || tileType === "X" || tileType.startsWith("W")) {
                    const mesh = this.third.physics.add.box({ x: relativeCoords.y, z: relativeCoords.x }, { phong: { map: woodTexture } });
                    mesh.body.setCollisionFlags(2);
                    if (tileType.startsWith("W")) {
                        const amt = +tileType.slice(1);
                        const water = new THREE.PlaneGeometry(1, 1 + amt, 32, 32 * amt);
                        const waterMat = new THREE.MeshPhongMaterial({
                            color: new THREE.Color(0x1C8DBD),
                            transparent: true,
                            opacity: 0.5,
                            side: THREE.DoubleSide
                        });
                        waterMat.onBeforeCompile = (shader) => {
                            this.shaders.push(shader);
                            shader.uniforms.stepX = { value: Math.random() * 1000 };
                            shader.uniforms.stepY = { value: Math.random() * 1000 };
                            shader.uniforms.stepZ = { value: Math.random() * 1000 };
                            shader.vertexShader = "varying vec3 fragPosition;\nuniform float stepX;\nuniform float stepY;\nuniform float stepZ;\n" + `vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
                            vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
                            vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
                            
                            float cnoise(vec3 P){
                              vec3 Pi0 = floor(P); // Integer part for indexing
                              vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
                              Pi0 = mod(Pi0, 289.0);
                              Pi1 = mod(Pi1, 289.0);
                              vec3 Pf0 = fract(P); // Fractional part for interpolation
                              vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
                              vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
                              vec4 iy = vec4(Pi0.yy, Pi1.yy);
                              vec4 iz0 = Pi0.zzzz;
                              vec4 iz1 = Pi1.zzzz;
                            
                              vec4 ixy = permute(permute(ix) + iy);
                              vec4 ixy0 = permute(ixy + iz0);
                              vec4 ixy1 = permute(ixy + iz1);
                            
                              vec4 gx0 = ixy0 / 7.0;
                              vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
                              gx0 = fract(gx0);
                              vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
                              vec4 sz0 = step(gz0, vec4(0.0));
                              gx0 -= sz0 * (step(0.0, gx0) - 0.5);
                              gy0 -= sz0 * (step(0.0, gy0) - 0.5);
                            
                              vec4 gx1 = ixy1 / 7.0;
                              vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
                              gx1 = fract(gx1);
                              vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
                              vec4 sz1 = step(gz1, vec4(0.0));
                              gx1 -= sz1 * (step(0.0, gx1) - 0.5);
                              gy1 -= sz1 * (step(0.0, gy1) - 0.5);
                            
                              vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
                              vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
                              vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
                              vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
                              vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
                              vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
                              vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
                              vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
                            
                              vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
                              g000 *= norm0.x;
                              g010 *= norm0.y;
                              g100 *= norm0.z;
                              g110 *= norm0.w;
                              vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
                              g001 *= norm1.x;
                              g011 *= norm1.y;
                              g101 *= norm1.z;
                              g111 *= norm1.w;
                            
                              float n000 = dot(g000, Pf0);
                              float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
                              float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
                              float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
                              float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
                              float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
                              float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
                              float n111 = dot(g111, Pf1);
                            
                              vec3 fade_xyz = fade(Pf0);
                              vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
                              vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
                              float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
                              return 2.2 * n_xyz;
                            }
                            ` + shader.vertexShader;
                            shader.vertexShader = insertAt(shader.vertexShader, "#include <fog_vertex>", "\n gl_Position = projectionMatrix * modelViewMatrix * vec4(position + 0.15 * vec3(0.0, 0.0, min(-0.3 * cnoise(vec3(position.x * 10.0 + stepX, position.y * 10.0 + stepZ, 10.0 * stepY)), 0.0)), 1.0);\nfragPosition = vec3(position.x, position.y, position.z);");
                            shader.fragmentShader = "varying vec3 fragPosition;\nuniform vec3 shadeColor;\nuniform float stepX;\nuniform float stepY;\nuniform float stepZ;\n" + `
            vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

            ` + shader.fragmentShader;
                            shader.fragmentShader = shader.fragmentShader.replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", `
            float noise5 = cnoise(fragPosition * 5.0 + vec3(stepX, stepY, stepZ));
            float seed =  noise5 + cnoise(fragPosition * 10.0 + vec3(stepX, stepY, stepZ)) * 0.5 + cnoise(fragPosition * 20.0 + vec3(stepX, stepY, stepZ)) * 0.2 + 0.2;
            vec3 lColor = vec3(0.0);
                lColor = vec3(0.33, 0.33, 0.33) * vec3(max(cnoise(fragPosition * 2.5 + vec3(stepX, stepY, stepZ)) + noise5 * 0.5  + cnoise(fragPosition * 10.0 + vec3(stepX, stepY, stepZ)) * 0.25 + 1.0, 0.7));
            float temp = lColor.x;
            lColor.x = lColor.z;
            lColor.z = temp;
            gl_FragColor = vec4(outgoingLight * lColor, diffuseColor.a );`);
                        }
                        const waterMesh = new THREE.Mesh(water, waterMat);
                        waterMesh.position.x = relativeCoords.y;
                        waterMesh.position.z = relativeCoords.x - amt / 2;
                        waterMesh.position.y = 0.51;
                        waterMesh.rotation.x = Math.PI / 2;
                        this.third.add.existing(waterMesh);
                        const modelAttrs = models["ship"];
                        const model = modelAttrs.model;
                        const mesh = new ExtendedObject3D();
                        const newModel = model.clone();
                        mesh.add(newModel);
                        mesh.scale.set(...modelAttrs.scale);
                        mesh.position.x = relativeCoords.y;
                        mesh.position.z = relativeCoords.x;
                        mesh.position.y = modelAttrs.elevation;
                        mesh.rotation.y = 90 * (Math.PI / 180);
                        this.third.add.existing(mesh);
                        mesh.traverse(child => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                child.material.side = THREE.DoubleSide;
                            }
                        });
                        mesh.turningPoints = [relativeCoords.x - amt, relativeCoords.x];
                        this.anims.push({
                            mesh: mesh,
                            transform: {
                                position: new THREE.Vector3(0, 0, -0.05),
                                rotation: new THREE.Vector3()
                            }
                        });
                    }
                } else if (tileType.startsWith("#")) {
                    const id = tileType.slice(1);
                    const attrs = ids[id];
                    if (attrs.floor) {
                        const mesh = this.third.physics.add.box({ x: relativeCoords.y, z: relativeCoords.x }, { phong: { map: woodTexture } });
                        mesh.body.setCollisionFlags(2);
                    }
                    if (attrs.model) {
                        const modelAttrs = models[attrs.model];
                        const model = modelAttrs.model;
                        const mesh = new ExtendedObject3D();
                        const newModel = model.clone();
                        if (attrs.model === "painting") {
                            const tex = await this.third.load.texture(attrs.source);
                            newModel.children[1].material = new THREE.MeshPhongMaterial({ map: tex });
                            newModel.position.z -= 120;
                            newModel.scale.y = (tex.image.height / tex.image.width) * 2.75;
                            newModel.scale.x = Math.min(tex.image.width / tex.image.height, 1);
                        }
                        mesh.add(newModel);
                        mesh.scale.set(...modelAttrs.scale);
                        mesh.position.x = relativeCoords.y;
                        mesh.position.z = relativeCoords.x;
                        mesh.position.y = modelAttrs.elevation;
                        if (attrs.model === "mill") {
                            this.anims.push({
                                mesh: mesh.children[0].children[2],
                                transform: {
                                    position: new THREE.Vector3(),
                                    rotation: new THREE.Vector3(0, 0, 0.05)
                                }
                            });
                        }
                        if (attrs.model === "lantern" && params["Fancy Lights"]) {
                            const theLight = this.third.lights.pointLight({ x: relativeCoords.x, z: relativeCoords.x, y: modelAttrs.elevation, intensity: 1, color: 'orange' });
                            // this.third.lights.helper.pointLightHelper(theLight);
                            theLight.position.set(relativeCoords.y, modelAttrs.elevation, relativeCoords.x);
                            theLight.castShadow = true;
                            /*const d = 4;
                            theLight.shadow.camera.top = d;
                            theLight.shadow.camera.bottom = -d;
                            theLight.shadow.camera.left = -d;
                            theLight.shadow.camera.right = d;
                            this.third.lights.helper.directionalLightHelper(theLight);*/
                        }
                        mesh.rotation.y = attrs.rotation * (Math.PI / 180);
                        this.third.add.existing(mesh);
                        if (!attrs.nobody) {
                            this.third.physics.add.existing(mesh, { shape: 'hull' });
                            mesh.body.setCollisionFlags(2);
                        }
                        mesh.traverse(child => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                if (attrs.model === "sugar") {
                                    child.material.side = THREE.DoubleSide;
                                }
                            }
                        });
                        if (attrs.clickable) {
                            if (attrs.description) {
                                const textReq = await fetch(`./templates/${attrs.description}.html`);
                                const htmlDescription = await textReq.text();
                                mesh.description = htmlDescription;
                            }
                            this.clickableMeshes.push(mesh);
                        }
                    }
                }
                if (tileType !== ".") {
                    if (params["Make Ceiling"]) {
                        const ceiling = this.third.physics.add.box({ x: relativeCoords.y, z: relativeCoords.x, y: 3 }, { phong: { map: woodTexture } });
                        ceiling.body.setCollisionFlags(2);
                    }
                }
            }
        }
        this.player = new THREE.Group();
        const body = this.third.add.box({ height: 0.8, y: 1, width: 0.4, depth: 0.4 });
        const head = this.third.add.sphere({ radius: 0.25, y: 1.7, z: 0.05 });
        const noShow = new THREE.MeshPhongMaterial({ opacity: 0, transparent: true });
        body.material = noShow;
        head.material = noShow;
        this.player.add(body);
        this.player.add(head);
        this.third.add.existing(this.player)
        this.third.physics.add.existing(this.player);
        const walkieTalkieModel = await this.third.load.fbx("walkieTalkie");
        walkieTalkieModel.rotation.y = -1.5;
        this.walkieTalkie = new ExtendedObject3D();
        this.walkieTalkie.add(walkieTalkieModel);
        this.walkieTalkie.scale.set(0.0025, 0.002, 0.0025);
        this.third.add.existing(this.walkieTalkie);
        // this.player = this.third.physics.add.sphere({ y: 0.5, radius: 0.5 });
        this.firstPersonControls = new FirstPersonControls(this.third.camera, this.player, {});
        this.firstPersonControls.theta = 180;
        this.input.on("pointerdown", () => {
            this.input.mouse.requestPointerLock();
            if (this.input.mouse.locked) {
                if (this.input.mousePointer.rightButtonDown() && this.targetWeaponPositions.length === 0 && this.targetWeaponRotations.length === 0) {
                    this.targetWeaponRotations.push({ x: -0.85, y: 0, z: 0.2, time: 200, progress: 0 });
                    this.targetWeaponPositions.push({ x: -0.3, y: 0.25, z: 0.5, time: 200, progress: 0 });
                    this.targetWeaponRotations.push({ x: 0, y: 0, z: 0, time: 200, progress: 0 });
                    this.targetWeaponPositions.push({ x: 0, y: 0, z: 0, time: 200, progress: 0 });
                    const raycaster = new THREE.Raycaster();
                    raycaster.setFromCamera({ x: 0, y: 0 }, this.third.camera);
                    let minDist = Infinity;
                    let chosenMesh = undefined;
                    this.clickableMeshes.forEach(mesh => {
                        const meshBox = new THREE.Box3().setFromObject(mesh);
                        if (raycaster.ray.intersectsBox(meshBox)) {
                            const distanceFromSource = this.third.camera.position.distanceTo(mesh.position);
                            if (distanceFromSource < minDist) {
                                minDist = distanceFromSource;
                                chosenMesh = mesh;
                            }
                        }
                    });
                    if (minDist < 3) {
                        infoDiv.style.display = "block";
                        if (chosenMesh.description) {
                            document.getElementById("mainText").innerHTML = chosenMesh.description;
                        } else {
                            document.getElementById("mainText").innerHTML = "";
                        }
                        this.input.mouse.releasePointerLock();
                    }
                }
            }
        });
        this.input.on("pointermove", pointer => {
            if (this.input.mouse.locked && infoDiv.style.display === "none") {
                this.firstPersonControls.update(pointer.movementX * 0.5, pointer.movementY * 0.5);
            }
        });
        this.events.on("update", () => {
            this.firstPersonControls.update(0, 0);
        });
        this.third.renderer.setPixelRatio(1);
        this.keys = {
            w: this.input.keyboard.addKey('w'),
            a: this.input.keyboard.addKey('a'),
            s: this.input.keyboard.addKey('s'),
            d: this.input.keyboard.addKey('d'),
            space: this.input.keyboard.addKey('Space'),
            shift: this.input.keyboard.addKey('Shift')
        }
        this.targetWeaponRotations = [
            // { x: 0.3, y: 0, z: -0.2, time: 2, progress: 0 }
        ];
        this.currWeaponRotation = { x: 0, y: 0, z: 0 };
        this.targetWeaponPositions = [

        ];
        this.currWeaponPosition = { x: 0, y: 0, z: 0 };
        this.initiated = true;
    }
    update(time, delta) {
        if (!this.initiated) {
            return;
        }
        stats.begin();
        //console.log(this.player.children[1].position, this.player.position);
        this.delta = delta;
        this.timeScale = delta / 16.66;
        this.shaders.forEach(shader => {
            shader.uniforms.stepX.value += 0.0025 * this.timeScale;
            shader.uniforms.stepY.value += 0.0025 * this.timeScale;
            shader.uniforms.stepZ.value += 0.0025 * this.timeScale;
        });
        this.anims.forEach(anim => {
            anim.mesh.position.x += anim.transform.position.x * this.timeScale;
            anim.mesh.position.y += anim.transform.position.y * this.timeScale;
            anim.mesh.position.z += anim.transform.position.z * this.timeScale;
            anim.mesh.rotation.x += anim.transform.rotation.x * this.timeScale;
            anim.mesh.rotation.y += anim.transform.rotation.y * this.timeScale;
            anim.mesh.rotation.z += anim.transform.rotation.z * this.timeScale;
            if (anim.mesh.turningPoints && (anim.mesh.position.z < anim.mesh.turningPoints[0] || anim.mesh.position.z > anim.mesh.turningPoints[1])) {
                anim.transform.position.z *= -1;
                anim.mesh.position.x += anim.transform.position.x * this.timeScale * 2;
                anim.mesh.position.y += anim.transform.position.y * this.timeScale * 2;
                anim.mesh.position.z += anim.transform.position.z * this.timeScale * 2;
                let count = 0;
                const rotInterval = setInterval(() => {
                    if (count === 10) {
                        clearInterval(rotInterval);
                        return;
                    }
                    anim.mesh.rotation.y += Math.PI / 10;
                    count++;
                }, 5);
            }
        })
        const deltaRot = new THREE.Vector3();
        if (this.targetWeaponRotations.length > 0) {
            const target = this.targetWeaponRotations[0];
            target.progress += this.delta;
            const percent = easeInOut(target.progress / target.time);
            const rp = target.progress / target.time;
            deltaRot.x = angleDifference(this.currWeaponRotation.x, target.x) * percent;
            deltaRot.y = angleDifference(this.currWeaponRotation.y, target.y) * percent;
            deltaRot.z = angleDifference(this.currWeaponRotation.z, target.z) * percent;
            if (rp >= 1) {
                deltaRot.multiplyScalar(0);
                this.currWeaponRotation = this.targetWeaponRotations.shift();
            }
        }
        const weaponChange = new THREE.Vector3();
        if (this.targetWeaponPositions.length > 0) {
            const target = this.targetWeaponPositions[0];
            target.progress += this.delta;
            const percent = easeInOut(target.progress / target.time);
            const rp = target.progress / target.time;
            //this.sword.rotateX((target.x - this.currWeaponPosition.x) * percent);
            //this.sword.rotateY((target.y - this.currWeaponPosition.y) * percent);
            // this.sword.rotateZ((target.z - this.currWeaponPosition.z) * percent);
            weaponChange.x = (target.x - this.currWeaponPosition.x) * percent;
            weaponChange.y = (target.y - this.currWeaponPosition.y) * percent;
            weaponChange.z = (target.z - this.currWeaponPosition.z) * percent;
            if (rp >= 1) {
                weaponChange.multiplyScalar(0);
                this.currWeaponPosition = this.targetWeaponPositions.shift();
            }
        }
        const cameraRot = new THREE.Vector3();
        this.third.camera.getWorldDirection(cameraRot);
        const theta = Math.atan2(cameraRot.x, cameraRot.z);
        this.third.camera.position.y += 1.7 + Math.sin(time * 0.003 * 1) * 0.01;
        this.third.camera.position.z += 0.05;
        const raycaster = new THREE.Raycaster()
            // x and y are normalized device coordinates from -1 to +1
        raycaster.setFromCamera({ x: 0.6 + this.currWeaponPosition.x + weaponChange.x, y: -0.5 + this.currWeaponPosition.y + weaponChange.y }, this.third.camera);
        const pos = new THREE.Vector3();
        pos.copy(raycaster.ray.direction);
        pos.multiplyScalar(1 + this.currWeaponPosition.z + weaponChange.z);
        pos.add(this.player.position);
        pos.y += 1.7;
        pos.z += 0.05;
        this.walkieTalkie.position.copy(pos);
        this.walkieTalkie.rotation.copy(this.third.camera.rotation);
        this.walkieTalkie.rotateX(this.currWeaponRotation.x + deltaRot.x);
        this.walkieTalkie.rotateY(this.currWeaponRotation.y + deltaRot.y);
        this.walkieTalkie.rotateZ(this.currWeaponRotation.z + deltaRot.z);
        const deltaPos = new THREE.Vector3();
        const speed = 0.125 * this.timeScale * (infoDiv.style.display === "block" ? 0 : 1);
        let bobMult = 1;
        if (this.keys.w.isDown) {
            deltaPos.x += Math.sin(theta) * speed;
            deltaPos.z += Math.cos(theta) * speed;
            bobMult = 2;
        }
        if (this.keys.s.isDown) {
            deltaPos.x -= Math.sin(theta) * speed;
            deltaPos.z -= Math.cos(theta) * speed;
            bobMult = 2;
        }
        if (this.keys.a.isDown) {
            deltaPos.x -= Math.sin(theta - Math.PI / 2) * speed;
            deltaPos.z -= Math.cos(theta - Math.PI / 2) * speed;
            bobMult = 2;
        }
        if (this.keys.d.isDown) {
            deltaPos.x -= Math.sin(theta + Math.PI / 2) * speed;
            deltaPos.z -= Math.cos(theta + Math.PI / 2) * speed;
            bobMult = 2;
        }
        const newVelocity = new THREE.Vector3(this.player.body.velocity.x, this.player.body.velocity.y, this.player.body.velocity.z);
        newVelocity.add(deltaPos);
        newVelocity.x *= 0.97;
        newVelocity.z *= 0.97;
        this.player.body.setVelocity(newVelocity.x, newVelocity.y, newVelocity.z);
        this.player.body.setAngularVelocityX(-this.player.body.rotation.x);
        this.player.body.setAngularVelocityZ(-this.player.body.rotation.z);
        stats.end();
    }
}

const config = {
    type: Phaser.WEBGL,
    transparent: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth * Math.max(1, window.devicePixelRatio / 2),
        height: window.innerHeight * Math.max(1, window.devicePixelRatio / 2)
    },
    scene: [MainScene],
    ...Canvas()
}
backButton.onclick = () => {
    infoDiv.style.display = "none";
    mainScene.input.mouse.requestPointerLock();
}
window.addEventListener('load', () => {
    enable3d(() => new Phaser.Game(config)).withPhysics('./lib');
});
var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);