import { load3DModel, loadSpriteImage, loadImageScreen } from "../../app/loaders.js";
// CONSTANTS
const SCREEN_OFFSET_X = 40;
const SCREEN_OFFSET_Y = 350;
const X_SCALE_OFFSET = 70;
const Y_SCALE_OFFSET = 80;

var rotating_delay = Date.now();
var forScreenshare = false;
var currentlyGrabbedObject = false;
var currentlyPinchedObject = false;
var currentlyHighlightedObject = false;
var currentlyRotatingObject = false;
var activeObject = false;

var gestureRecogitionOn = false;

// FOR THREEJS SCENE BUILDING
const scene = new THREE.Scene();
// set background color
scene.background = new THREE.Color(0xffffff);
var light = new THREE.AmbientLight(0x404040);
scene.add(light);
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
scene.objects = [];
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );

document.body.appendChild( renderer.domElement );
renderer.outputEncoding = THREE.sRGBEncoding;

// Resize canvas
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
 
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

// LOADERS
// loadSpriteImage('img/baozi.jpg', 4, 3, scene);
// loadSpriteImage('img/kimchi_fried_rice.JPG' , 3, 4, scene)
load3DModel('assets/city.glb', scene, 0.1);
loadImageScreen('img/baozi.jpg', scene, 4, 3, 0.5);

//CREATE CURSORS
const right_cursor_geo = new THREE.CircleGeometry( 0.1, 32 );
const right_cursor_material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
const right_cursor = new THREE.Mesh( right_cursor_geo, right_cursor_material );
scene.add( right_cursor );
right_cursor.userData = { isGrabbing: false, isPinching: false };

const left_cursor_geo = new THREE.CircleGeometry( 0.1, 32 );
const left_cursor_material = new THREE.MeshBasicMaterial( { color: 0xff0f00 } );
const left_cursor = new THREE.Mesh( left_cursor_geo, left_cursor_material );
scene.add( left_cursor );
left_cursor.userData = { isGrabbing: false, isPinching: false };    

camera.position.z = 5;

const empty_vector = new THREE.Vector3( 0, 0, 0);

console.log(scene.objects);

export function animate(rightHand, leftHand, trainer) {
	requestAnimationFrame( animate );
    // for the cursors
    var rightPalmPosition;
    var leftPalmPosition;
    var rightCursorPosition = empty_vector;
    var leftCursorPosition = empty_vector;
    var rightSpeed = [0,0,0];
    var leftSpeed = [0,0,0];
    if (rightHand && rightHand.type) {
        rightSpeed = rightHand.palmVelocity;
        rightPalmPosition = rightHand.palmPosition;
        // console.log("right palm position:", rightPalmPosition[0], rightPalmPosition[1]);
        rightCursorPosition = new THREE.Vector3( rightPalmPosition[0]-SCREEN_OFFSET_X, rightPalmPosition[1]-SCREEN_OFFSET_Y, 0 );
        if (rightHand.grabStrength == 1) {
            right_cursor.userData.isGrabbing = true;
        } else {
            right_cursor.userData.isGrabbing = false;
        }
        if (rightHand.pinchStrength == 1) {
            right_cursor.userData.isPinching = true;
        } else {
            right_cursor.userData.isPinching = false;
        }
    } else {
        return;
    }

    if (leftHand && leftHand.type) {
        leftSpeed = leftHand.palmVelocity ? leftHand.palmVelocity : [0, 0, 0];
        // console.log("left speed: ", leftSpeed);
        left_cursor.userData.velocity = leftSpeed;
        
        leftPalmPosition = leftHand.palmPosition;
        leftCursorPosition = new THREE.Vector3( leftPalmPosition[0]+SCREEN_OFFSET_X, leftPalmPosition[1]-SCREEN_OFFSET_Y, 0 );
        if (leftHand.grabStrength == 1) {
            left_cursor.userData.isGrabbing =true;
        } else {
            left_cursor.userData.isGrabbing = false;
        }

        if (leftHand.pinchStrength == 1) {
            left_cursor.userData.isPinching = true;
        } else {
            left_cursor.userData.isPinching = false;
        }
    } else {
        left_cursor.userData.isPinching = false;
        left_cursor.userData.isGrabbing = false;
    }

    var rightIsGrabbing = right_cursor.userData.isGrabbing;
    var leftIsGrabbing = left_cursor.userData.isGrabbing;

    var rightIsPinching = right_cursor.userData.isPinching;
    var leftIsPinching = left_cursor.userData.isPinching;

    if (!rightCursorPosition.equals(empty_vector)){
        right_cursor.position.set(rightCursorPosition.x/X_SCALE_OFFSET, (rightCursorPosition.y/Y_SCALE_OFFSET), 0);
    }
    if (!leftCursorPosition.equals(empty_vector)){
        left_cursor.position.set(leftCursorPosition.x/X_SCALE_OFFSET, leftCursorPosition.y/Y_SCALE_OFFSET, 0);
    }

    // loop through all objects in scene
    for (var i = scene.objects.length - 1; i >= 0; i--)  {
        // console.log("currently grabbing: ", currentlyGrabbedObject);
        // if an object is grabbed/pinched break out of the for loop 
        let obj = scene.objects[i];
        // console.log(obj.bounding_box.min, obj.bounding_box.max, "bounding min and max");
        if ( obj.contains(right_cursor)) { //this might be costly
            obj.rightOverlapped = true;
            if ( obj.contains(left_cursor)) {
                obj.leftOverlapped = true;
            } else {
                obj.leftOverlapped = false;
            }
        } else {
            obj.rightOverlapped = false;
        }
        
        // ROTATING
        if (leftIsGrabbing && rightIsGrabbing && !currentlyRotatingObject) {
            console.log("rotating");
            currentlyRotatingObject = obj;
            activeObject = currentlyRotatingObject;
            break;
        } else if (currentlyRotatingObject == obj && leftIsGrabbing && rightIsGrabbing) {
            if (Date.now()-rotating_delay > 1000){
                if (right_cursor.position.x > left_cursor.position.x) {
                    // rotate to the right
                    obj.mesh.rotation.y += Math.PI/4;
                } else {
                    obj.mesh.rotation.y -= Math.PI/4;
                } 
                rotating_delay = Date.now();
            }
            break;
        } else {
            currentlyRotatingObject = false;   
        }
        
        // GRABBING
        // console.log("currently grabbed", currentlyGrabbedObject, "currently pinched", currentlyPinchedObject);  
        if (!currentlyGrabbedObject && !currentlyPinchedObject ) {
            // console.log("GRABBING?", !obj.isGrabbed, !leftIsGrabbing, rightIsGrabbing, obj.rightOverlapped);
            if (!obj.isGrabbed && !leftIsGrabbing && rightIsGrabbing && obj.rightOverlapped) { 
                // grab and move object
                obj.isGrabbed = true;
                currentlyGrabbedObject = obj;
                activeObject = currentlyGrabbedObject;
                highlight(obj, 0xff7f7d);
                obj.grabOffsetX = obj.mesh.position.x - right_cursor.position.x;
                obj.grabOffsetY = obj.mesh.position.y - right_cursor.position.y;
                break;
            }
        } else if (currentlyGrabbedObject == obj && !leftIsGrabbing && rightIsGrabbing && obj.isGrabbed){
            // console.log("offsets: ", obj.mesh.position.x - right_cursor.position.x, obj.mesh.position.y - right_cursor.position.y )
            obj.setPosition(right_cursor);
            break;
        } else if (currentlyGrabbedObject == obj && !rightIsGrabbing) {
            console.log("right is no longer grabbing");
            obj.isGrabbed = false;
            currentlyGrabbedObject = false;
            unhighlight(obj);
            obj.bounding_box = obj.computeScreenSpaceBoundingBox(obj.mesh);
        }      

        // PINCHING
        if (!currentlyPinchedObject && !currentlyGrabbedObject) {
            if (leftIsPinching && rightIsPinching && obj.leftOverlapped && obj.rightOverlapped && (!obj.rightPinch||!obj.leftPinch)) {
                obj.rightPinch = true;
                obj.leftPinch = true;
                currentlyPinchedObject = obj;
                activeObject = currentlyPinchedObject;
                highlight(obj, 0x6bb3ff);
                console.log("pinching! 0x6bb3ff", currentlyPinchedObject, currentlyGrabbedObject);
            }
        } else if (currentlyPinchedObject == obj & leftIsPinching && rightIsPinching) {
            console.log("in the right place!");
            highlight(obj, 0x6bb3ff);
                
            var distance = right_cursor.position.x - left_cursor.position.x;
            if (Math.abs(obj.width-distance)>0.005) {
                // console.log("bounding box min and max: ", obj.bounding_box.min, obj.bounding_box.max);
                obj.setScale(distance, right_cursor, left_cursor);
                obj.bounding_box = obj.computeScreenSpaceBoundingBox(obj.mesh);
                obj.width = distance;
            }
            break;
        } else if (currentlyPinchedObject == obj & !leftIsPinching && !rightIsPinching) {
            // console.log("right is no longer pinching");
            obj.rightPinch = false;
            obj.leftPinch = false;
            currentlyPinchedObject = false;
            unhighlight(obj);
            obj.bounding_box = obj.computeScreenSpaceBoundingBox(obj.mesh);
        } 

        //RECOGNIZE GESTURES
        if (!currentlyGrabbedObject && !currentlyPinchedObject && gestureRecogitionOn) {
            trainer.resume();
            // nntrainer.resume();
            trainer.on('FLATTEN', function() { 
                if (activeObject && activeObject.type == "screenImage" && activeObject.flattenedCount == 0){
                    activeObject.flattenedCount +=1;
                    activeObject.mesh.rotation.x -= Math.PI/2;
                }
                return;
             });
            trainer.on('SWIPE', function() { 
                removeObject(activeObject);
                return; 
            });
        } else {
            trainer.pause();
            // nntrainer.pause();
        }

        // HIGHLIGHT IF HOVERED OVER
        if (!currentlyGrabbedObject && !currentlyPinchedObject && rightHand && rightHand.type) {
            if (!currentlyPinchedObject && obj.rightOverlapped){
                highlight(obj, 0xffff00);
                currentlyHighlightedObject = obj;
                break;
            } else {
                unhighlight(obj);
                currentlyHighlightedObject = false;
            }
        }       
    }
    renderer.render( scene, camera );

    // DISPLAY INFORMATION 
    if(activeObject) updateActiveObject();
}

// KEYBINDINGS

//toggle gesture recognition
hotkeys('g', function(event, handler){
    event.preventDefault();
    gestureRecogitionOn = !gestureRecogitionOn;
    document.getElementById('gestureRecognition').innerHTML = '<p> gesture recognition: '+gestureRecogitionOn+'</p>';
});
// reload the page
hotkeys('r', function(event, handler){
    event.preventDefault();
    window.location.reload();
});
// shift active object
hotkeys('right', function(event, handler){
    event.preventDefault();
    let i;
    if (activeObject) {
        i = scene.objects.indexOf(activeObject);
        i=(i+1) % scene.objects.length;
    } else {
        i = 0;
    }
    activeObject = (scene.objects[i]);
    updateActiveObject();
    console.log(activeObject, "active object");
});
hotkeys('backspace', function(event, handler){
    event.preventDefault();
    removeObject(activeObject);
});

const removeObject = (object) =>{
    const index =  scene.objects.indexOf(object);
    if (object && index>-1)  {
        console.log('SWIPE!'); 
        // object.dispose();
        console.log("removing object from scene");    
        scene.remove(object.mesh);
        if (index > -1) {
            scene.objects.splice(index, 1);
        }
        console.log(scene.objects);
        activeObject = false;
        updateActiveObject();
    }
}

const updateActiveObject = () => {
    document.getElementById('activeObject').innerHTML = '<p> active object: '+activeObject.name+'</p>';
}




const highlight = (obj, color) => {
    if (!obj.isModel) {
        if (!obj.mesh.userData.oldColor) {
            obj.mesh.userData.oldColor = obj.mesh.material.color.getHex();
            console.log("set color", obj.mesh.userData.oldColor);
        }

        if(obj.mesh.material.color != color ) {
            // console.log("highlight");
            // obj.userData.isHighlighted = true;
            obj.mesh.material.color.set( color );
        }
    }
};

const unhighlight = (obj) => {
    if (obj.mesh.userData.oldColor && (!obj.isModel )) {
        if (obj.mesh.material.color != obj.mesh.userData.oldColor) {
            obj.mesh.material.color.set(obj.mesh.userData.oldColor);
        }
    }
};

// DOCUMENT EVENT LISTENERS
document.getElementById("toggleBackground").addEventListener("click", toggleBackground);

export function toggleBackground() {
    forScreenshare = !forScreenshare;
    if (forScreenshare) {
        scene.background.set("lightgreen" );
    } else {
        scene.background.set("white");
    }
    renderer.render( scene, camera );

}


renderer.render( scene, camera );
