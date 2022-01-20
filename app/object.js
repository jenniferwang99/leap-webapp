import { NumberKeyframeTrack, AnimationClip, AnimationMixer } from 'https://cdn.skypack.dev/three';

const times = [0, 1, 2];
const values = [1, .5, 0];

const opacityKF = new NumberKeyframeTrack('.material.opacity', times, values);

export class Object {
    constructor(mesh) {
        this.mesh = mesh;
        this.name;
        // this.mixer = new AnimationMixer(mesh);
        this.isGrabbed = false;
        this.grabOffsetX= 0;
        this.grabOffsetY = 0;
        this.rightOverlapped = false;
        this.leftOverlapped = false;
        this.bounding_box = this.computeScreenSpaceBoundingBox(mesh);
        this.rightPinch = false;
        this.leftPinch = false;
        this.isModel = false;
        this.type = false;
        this.flattenedCount = 0;
        this.width = 9999;

        // this.mesh.tick = this.mixer.update(0.25);
        // const fadeOutClip = new AnimationClip('fade-out', -1, [opacityKF]);
        // this.fadeOutAction = this.mixer.clipAction(fadeOutClip);

        // only for images
        this.originalScaleX = this.mesh.scale.x;
        this.originalScaleY = this.mesh.scale.y;
        this.originalScaleZ = this.mesh.scale.z;
        this.scaleFactor = 1;
    }

    dispose() {
        console.log(this.mesh, "mesh");
        this.mesh.material.dispose();
        this.mesh.geometry.dispose();
        if (this.mesh.material.map) { this.mesh.material.map.dispose(); };
    }
    
    setPosition(right_cursor) {
        this.mesh.position.set(right_cursor.position.x+this.grabOffsetX, right_cursor.position.y+this.grabOffsetY, right_cursor.position.z-1);
    }

    setScale(target_width, right_cursor, left_cursor) {
        this.mesh.position.set((right_cursor.position.x+left_cursor.position.x)/2, (right_cursor.position.y+left_cursor.position.y)/2, -1);
        console.log(target_width, "target width");
        var proportion = target_width/this.originalScaleX;
        console.log(this.mesh.scale, this.scaleFactor);
        this.mesh.scale.set(target_width*this.scaleFactor, this.originalScaleY*proportion*this.scaleFactor, this.originalScaleZ*proportion*this.scaleFactor);
        // newheight = new width/old width * old height
    }

    contains(cursor) {
        if (this.bounding_box.min.x < cursor.position.x && this.bounding_box.max.x > cursor.position.x) {
            if (this.bounding_box.min.y < cursor.position.y && this.bounding_box.max.y > cursor.position.y) {
                return true;
            }
        }
        return false;
    }

    computeScreenSpaceBoundingBox(mesh) {
        var bounding_box;
        if (mesh.geometry?.boundingBox && mesh.type=="Object3D") {
            console.log("mesh geometry bounding box", mesh);
            bounding_box = mesh.geometry.boundingBox;
        } else {
            bounding_box = new THREE.Box3().setFromObject(mesh);
        }
        // console.log(new THREE.Box3().setFromObject(mesh), "bounding box")
        var minX = bounding_box.min.x;
        var maxX = bounding_box.max.x;
        var minY = bounding_box.min.y;
        var maxY = bounding_box.max.y;

        var minVector = new THREE.Vector2(minX, minY);
        var maxVector = new THREE.Vector2(maxX, maxY);

        var boundingScreenspaceBox = new THREE.Box2(minVector, maxVector);
        return boundingScreenspaceBox;
    }
}