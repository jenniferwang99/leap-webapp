import { Object } from "./object.js";

export class Slide extends Object {
    constructor(mesh) {
        super(mesh);
        this.order = 0;
      }
}