let mainScene;
const infoDiv = document.getElementById("infoDiv");
const backButton = document.getElementById("backButton");

function angleDifference(angle1, angle2) {
    const diff = ((angle2 - angle1 + Math.PI) % (Math.PI * 2)) - Math.PI;
    return (diff < -Math.PI) ? diff + (Math.PI * 2) : diff;
}

const easeInOut = x => x < .5 ? 2 * x * x : -1 + (4 - 2 * x) * x;
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
        this.third.load.preload("apple", "./assets/apple.jpeg");
        const woodTexture = await this.third.load.texture("assets/wood.jpeg");
        const stoneTexture = await this.third.load.texture("assets/stone.jpeg");
        const darkwoodTexture = await this.third.load.texture("assets/darkwood.jpeg");
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
                } else if (tileType === "'" || tileType === "X") {
                    const mesh = this.third.physics.add.box({ x: relativeCoords.y, z: relativeCoords.x }, { phong: { map: woodTexture } });
                    mesh.body.setCollisionFlags(2);
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
                            newModel.children[1].material = new THREE.MeshPhongMaterial({ map: await this.third.load.texture(attrs.source) });
                            newModel.position.z -= 120;
                        }
                        mesh.add(newModel);
                        mesh.scale.set(...modelAttrs.scale);
                        mesh.position.x = relativeCoords.y;
                        mesh.position.z = relativeCoords.x;
                        mesh.position.y = modelAttrs.elevation;
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
                        this.third.physics.add.existing(mesh, { shape: 'hull' });
                        mesh.body.setCollisionFlags(2);
                        mesh.traverse(child => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
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