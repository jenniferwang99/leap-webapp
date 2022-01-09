export class Hand {
    constructor(mesh) {
        this.mesh = mesh;
        this.isGrabbing = false;
        this.rightPinch = false;
        this.leftPinch = false;
    }
    
    setPosition(right_cursor) {
        this.mesh.position.set(right_cursor.position.x, right_cursor.position.y, right_cursor.position.z);
    }
}