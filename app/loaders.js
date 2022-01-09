import { GLTFLoader } from 'https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader.js';
import { FontLoader } from 'https://cdn.skypack.dev/three/examples/jsm/loaders/FontLoader.js'
import { Object } from './object.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/DRACOLoader.js';



export function load3DModel (filepath, scene, scaleFactor) {
    var mesh;
    var model;
    const modelLoader = new GLTFLoader();
    modelLoader.setDRACOLoader( new DRACOLoader() );
    modelLoader.load(filepath, function ( gltf ) {
        model = gltf.scene;
        console.log(model, "model");
        mesh = model.children[0];
        model.scale.set(.1, .1, .1);
        mesh.scale.set(.1, .1, .1);
        model.position.set(0,0,-1);
        scene.add(model);

        var modelObj= new Object(model);
        modelObj.isModel=true;
        modelObj.scaleFactor = scaleFactor;
        modelObj.name=filepath;

        console.log(modelObj, "model ");
        scene.objects.push(modelObj);
        console.log(scene.objects);

    }, undefined, function ( error ) {
        console.error( error );
    } );

    console.log("Scene", scene);
}

export function loadSpriteImage(filepath, dimX, dimY, scene) {
    const imageMap = new THREE.TextureLoader().load( filepath );
    const material = new THREE.SpriteMaterial( { map: imageMap } );
    
    const sprite = new THREE.Sprite( material );
    sprite.scale.set( dimX, dimY, 1 );
        
    sprite.position.set(0, 0, -1);
    
    scene.add( sprite );
    var spriteObj = new Object(sprite);
    spriteObj.name=filepath;
    scene.objects.push(spriteObj);
}


export function loadImageScreen(filepath, scene, dimX, dimY, scaleFactor) {
    var textureLoader = new THREE.TextureLoader();
    var materials = [
        new THREE.MeshBasicMaterial({
            color: 'pink' //left
        }),
        new THREE.MeshBasicMaterial({
            color: 'orange' //right
        }),
        new THREE.MeshBasicMaterial({
            color: 'green' // top
        }),
        new THREE.MeshBasicMaterial({
            color: 'blue' // bottom
        }),
        new THREE.MeshBasicMaterial({
            map: textureLoader.load( filepath ) // front
        }),
        new THREE.MeshBasicMaterial({
            color: 'yellow' //back
        })
    ];

    var faceMaterial = new THREE.MeshFaceMaterial( materials );

    var geometry = new THREE.BoxGeometry( dimX, dimY, 0.5 );
    var boxMesh = new THREE.Mesh( geometry, faceMaterial );
    boxMesh.position.set(0, 0, -1);
    scene.add( boxMesh);

    var box = new Object(boxMesh);
    box.scaleFactor=scaleFactor;
    box.isModel = true;
    box.name = filepath;
    console.log("mesh", boxMesh);
    scene.objects.push(box);

}