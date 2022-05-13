export class Object {
    constructor(mesh) {
        this.mesh = mesh;
        this.name;
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
        this.width;
        this.locked = false;
    
        // only for images
        this.originalScaleX = this.mesh.scale.x;
        this.originalScaleY = this.mesh.scale.y;
        this.originalScaleZ = this.mesh.scale.z;
        this.scaleFactor = 1;

        // for rotating
        this.MAX_ROTATION_ANGLES = {
            x: {
              // Vertical from bottom to top.
              enabled: false,
              from: Math.PI / 8,
              to: Math.PI / 8,
            },
            y: {
              // Horizontal from left to right.
              enabled: false,
              from: Math.PI / 4,
              to: Math.PI / 4,
            },
          };
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

    setScale(right_cursor, left_cursor) {
        // update the scale
        this.originalScaleX = this.mesh.scale.x;
        this.originalScaleY = this.mesh.scale.y;
        this.originalScaleZ = this.mesh.scale.z;

        var dist0 = right_cursor.userData.prevX - left_cursor.userData.prevX;
        var dist1 = right_cursor.position.x - left_cursor.position.x;
        console.log(dist0, dist1, this.width);
        var proportion = dist0/dist1;
        var new_width;
        if (proportion>1){
            new_width = Math.max(proportion*this.width, dist1)
        } else {
            new_width = Math.min(proportion*this.width, dist1)    
        }
        
        right_cursor.userData.prevX = right_cursor.position.x;
        left_cursor.userData.prevX = left_cursor.position.x;
        // console.log(proportion, "proportion", new_width, "new width", dist1, "dist1")

        this.mesh.scale.set(this.originalScaleX/proportion, this.originalScaleY/proportion, this.originalScaleZ/proportion)
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
        this.width = maxX-minX;

        var minVector = new THREE.Vector2(minX, minY);
        var maxVector = new THREE.Vector2(maxX, maxY);

        var boundingScreenspaceBox = new THREE.Box2(minVector, maxVector);
        return boundingScreenspaceBox;
    }

    // for rotating

    
    /**
         * isWithinMaxAngle
         * @description Checks if the rotation in a specific axe is within the maximum
         * values allowed.
         * @param delta is the difference of the current rotation angle and the
         *     expected rotation angle
         * @param axe is the axe of rotation: x(vertical rotation), y (horizontal
         *     rotation)
         * @return true if the rotation with the new delta is included into the
         *     allowed angle range, false otherwise
         */
    isWithinMaxAngle(delta, axe, mesh) {
        if (this.MAX_ROTATION_ANGLES[axe].enabled) {
            if (mesh.length > 1) {
                let condition = true;
                for (let i = 0; i < mesh.length; i++) {
                if (!condition) return false;
                if (this.MAX_ROTATION_ANGLES[axe].enabled) {
                    condition = isRotationWithinMaxAngles(mesh[i], delta, axe);
                }
                }
                return condition;
            }
            return isRotationWithinMaxAngles(mesh, delta, axe);
            }
        return true;
    }

    isRotationWithinMaxAngles(meshToRotate, delta, axe) {
        return this.MAX_ROTATION_ANGLES[axe].from * -1 <
        meshToRotate.rotation[axe] + delta &&
        meshToRotate.rotation[axe] + delta < this.MAX_ROTATION_ANGLES[axe].to
        ? true
        : false;
    }

    rotateVertical(deltaMove, mesh) {
        
        console.log(deltaMove.y, "delta vert")
        if (mesh.length > 1) {
            for (let i = 0; i < mesh.length; i++) {
                rotateVertical(deltaMove, mesh[i]);
            }
            return;
        }
        mesh.rotation.x += deltaMove.y * -0.5;
    }

    rotateHorizontal(deltaMove, mesh) {
        
        console.log(deltaMove.x, "delta horiz")
        if (mesh.length > 1) {
            for (let i = 0; i < mesh.length; i++) {
            rotateHorizontal(deltaMove, this.mesh[i]);
            }
            return;
        }
        mesh.rotation.y += deltaMove.x * 0.5;
    }
}

