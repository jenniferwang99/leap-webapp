import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { Object } from './object.js';
import { Slide } from './slide.js';

export function load3DModel (filepath, scene, scaleFactor) {
    var mesh;
    var model;
    const modelLoader = new GLTFLoader();
    // modelLoader.setDRACOLoader( new DRACOLoader() );
    modelLoader.load(filepath, function ( gltf ) {
        model = gltf.scene;
        console.log(model, "model");
        mesh = model.children[0];
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        model.position.set(0,0,-1);
        scene.add(model);

        var modelObj= new Object(model);
        modelObj.isModel=true;
        modelObj.scaleFactor = scaleFactor;
        modelObj.name=filepath;

        console.log(modelObj, "model ");
        scene.objects.push(modelObj);
        console.log(scene.objects);
        return modelObj;

    }, undefined, function ( error ) {
        console.error( error );
    } );
}

export function loadSpriteImage(filepath, scene) {
    var sprite;
    var height;
    var width;
    const imageMap = new THREE.TextureLoader().load( filepath, (tex) => {
        tex.needsUpdate = true;
        height = tex.image.height;
        width = tex.image.width;
        sprite.scale.set(5.0, 5*tex.image.height / tex.image.width, 1.0);
        console.log("scale based on tex", sprite.scale);
      });
    const material = new THREE.SpriteMaterial( { map: imageMap } );
    
    sprite = new THREE.Sprite( material );

    sprite.position.set(0, 0, -1);    
    scene.add( sprite );
    var spriteObj = new Slide(sprite);
    spriteObj.name=filepath;
    scene.objects.push(spriteObj);
}


export function loadImageScreen(filepath, scene, dimX, dimY, scaleFactor) {
    var textureLoader = new THREE.TextureLoader();
    var geometry;
    var height;
    var width;
    var materials = [
        new THREE.MeshBasicMaterial({
            color: 'black' //left
        }),
        new THREE.MeshBasicMaterial({
            color: 'black' //right
        }),
        new THREE.MeshBasicMaterial({
            color: 'black' // top
        }),
        new THREE.MeshBasicMaterial({
            color: 'black' // bottom
        }),
        new THREE.MeshBasicMaterial({
            map: textureLoader.load( filepath, (tex) => {
                tex.needsUpdate = true;
                height = tex.image.height;
                width = tex.image.width;
                geometry = new THREE.BoxGeometry( 1, tex.image.height / tex.image.width, 0.01 );
    
                // console.log("scale based on tex", sprite.scale);
              } ) // front
        }),
        new THREE.MeshBasicMaterial({
            color: 'black' //back
        })
    ];

    var faceMaterial = new THREE.MeshFaceMaterial( materials );
    var boxMesh = new THREE.Mesh( geometry, faceMaterial );
    boxMesh.position.set(0, 0, -1);
    scene.add( boxMesh);

    var box = new Object(boxMesh);
    box.scaleFactor=scaleFactor;
    box.isModel = true;
    box.name = filepath;
    box.type = "screenImage";
    console.log("mesh", boxMesh);
    scene.objects.push(box);
}