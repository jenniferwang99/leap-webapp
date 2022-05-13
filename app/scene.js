import { loadSpriteImage, load3DModel, loadImageScreen } from "../../app/loaders.js";
import { Object } from './object.js';
// CONSTANTS

const queryString = window.location.search;
console.log(queryString);
const urlParams = new URLSearchParams(queryString);
const SCREEN_OFFSET_X = parseFloat(urlParams.get("xscreen")) || 40;
const SCREEN_OFFSET_Y = parseFloat(urlParams.get("yscreen")) || 350;
const X_SCALE_OFFSET = parseFloat(urlParams.get("xscale"))+10 || 70;
const Y_SCALE_OFFSET = parseFloat(urlParams.get("yscale")) || 80;

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


// IMAGE UPLOAD
document.getElementById("fileUpload").addEventListener("submit", upload);
var imagekit = new ImageKit({
    publicKey: "public_HDWMj/1g2MZbnJ1y4VDMcmou9Xg=",
    urlEndpoint: "https://ik.imagekit.io/jennwang", // https://ik.imagekit.io/your_imagekit_id
    authenticationEndpoint: "http://localhost:3000/signature"
});

var slideURLs =[];
// Upload function internally uses the ImageKit.io javascript SDK
function upload(e) {
    e.preventDefault();
    console.log(e.target.input, "input");
    var files = document.getElementById("files").files;
    console.log("files submitted: ", files);
    for (let i = 0, numFiles = files.length; i < numFiles; i++) {
        console.log(files[i]);
        var file = files[i];
        imagekit.upload({
            file: files[i],
            fileName: files[i].name || "sample-file.jpg",
            tags: ["meng"], // Comma seperated value of tags
            responseFields: "tags" // Comma seperated values of fields you want in response e.g. tags, isPrivateFile etc
        }, function (err, result) {
            if (err) {
                alert("Error in file upload. Check console logs for error response");
                console.log(err);
            } else {
                console.log(result);
                console.log(result.url);
                var slides = document.getElementById("isSlide");
                if (slides.checked) {
                    var slidePreviews = document.getElementById('slidePreviews'),
                        src = result.url,
                        img = document.createElement('img');
                    img.src = src;
                    img.width = 150;
                    slidePreviews.appendChild(img);
                } else if (file.type.startsWith("image")) {
                    loadImageScreen(result.url, scene);
                } else {
                    console.log("3d model submitted!")
                    let obj = load3DModel(result.url, scene, 1);
                    console.log(obj, "obj")
                }
                
                renderer.render( scene, camera );
            }
        }) 
    };
}


// slide
var slidePreviews = document.getElementById('slidePreviews');
var sortableSlides = new Sortable(slidePreviews, {
    animation: 150
});

slidePreviews.addEventListener("drag", updateSlideOrder);

function updateSlideOrder() { // this can be optimized
    slideURLs = [];
    console.log(slidePreviews.children);
    var slides = slidePreviews.children;
    for (let slide of slides) {
        console.log(slide.getAttribute("src"));
        slideURLs.push(slide.getAttribute("src"));
    }
}

// load in slide
hotkeys('right', function(event){
    console.log("right arrow pressed")
    event.preventDefault();
    if (!slideURLs) {
        updateSlideOrder();
        console.log("slideURL" , slideURLs[0]);
    }
    loadSpriteImage(slideURLs[0], scene, true);
    slideURLs.splice(0, 1);
    renderer.render( scene, camera );
});

// LOADERS
// loadImageScreen('img/Slide6.JPG', scene);
// loadSpriteImage('img/Slide6.jpg', scene);
// load3DModel('assets/city.glb', scene, 0.1);

// trash bin
const geometry = new THREE.BoxGeometry( .8, .8, .8 );
const material = new THREE.MeshBasicMaterial( {color: "grey"} );
const cube = new THREE.Mesh( geometry, material );
cube.position.set(-4, -3, 0);
scene.add( cube );
var trash = new Object(cube);
trash.userData = {highlighted: false}

//CREATE CURSORS
const right_cursor_geo = new THREE.CircleGeometry( 0.1, 32 );
const right_cursor_material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
const right_cursor = new THREE.Mesh( right_cursor_geo, right_cursor_material );
scene.add( right_cursor );
right_cursor.userData = { isGrabbing: false, isPinching: false, prevX: 0, prevY: 0};

const left_cursor_geo = new THREE.CircleGeometry( 0.1, 32 );
const left_cursor_material = new THREE.MeshBasicMaterial( { color: 0xff0f00 } );
const left_cursor = new THREE.Mesh( left_cursor_geo, left_cursor_material );
scene.add( left_cursor );
left_cursor.userData = { isGrabbing: false, isPinching: false , prevX: 0, prevY: 0};    

camera.position.z = 5;

const empty_vector = new THREE.Vector3( 0, 0, 0);

console.log(scene.objects);

// these values are for rotation
let rotationSpeed = 0.05,
    prevCursorPosition = empty_vector;


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
        // console.log("left hand exists!")
        leftSpeed = leftHand.palmVelocity ? leftHand.palmVelocity : [0, 0, 0];
        // console.log("left speed: ", leftSpeed);
        left_cursor.userData.velocity = leftSpeed;
        
        leftPalmPosition = leftHand.palmPosition;
        leftCursorPosition = new THREE.Vector3( leftPalmPosition[0]-SCREEN_OFFSET_X+60, leftPalmPosition[1]-SCREEN_OFFSET_Y, 0 );
        // console.log(leftCursorPosition, "left cursor pos")
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
    
    if (trash.contains(right_cursor)) {
        highlight(trash, "pink");
        trash.userData.highlighted = true;
        removeObject(activeObject);
    } else {
        unhighlight(trash);
        trash.userData.highlighted = false;
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
        if (currentlyRotatingObject && currentlyRotatingObject == obj) {
            if (rightIsGrabbing) {
                const deltaMove = {
                  x: right_cursor.position.x - prevCursorPosition.x,
                  y: right_cursor.position.y - prevCursorPosition.y,
                };
                console.log(deltaMove, "deltaMove")
                prevCursorPosition = { x: right_cursor.position.x, y: right_cursor.position.y };
          
                if (deltaMove.x != 0) {
                  // && (Math.abs(deltaMove.x) > Math.abs(deltaMove.y))) {
                  // enabling this, the mesh will rotate only in one specific direction
                  // for mouse movement
                  if (!obj.isWithinMaxAngle(Math.sign(deltaMove.x) * rotationSpeed, "y", obj.mesh)) {
                    console.log("BAD HORIZ ANGLE")
                    return;
                  }
                  obj.rotateHorizontal(deltaMove, obj.mesh);
                }
          
                if (deltaMove.y != 0) {
                  // &&(Math.abs(deltaMove.y) > Math.abs(deltaMove.x)) //
                  // enabling this, the mesh will rotate only in one specific direction for
                  // mouse movement
                  if (!obj.isWithinMaxAngle(Math.sign(deltaMove.y) * rotationSpeed, "x", obj.mesh)) {
                    console.log("BAD ANGLE")
                    return;
                  }
                  obj.rotateVertical(deltaMove, obj.mesh);
                }
                break;
            } else {
                currentlyRotatingObject = false; 
                break;
            }
        } 

        
        // GRABBING
        // console.log("currently grabbed", currentlyGrabbedObject, "currently pinched", currentlyPinchedObject);  
        if (!currentlyGrabbedObject && !currentlyPinchedObject ) {
            // console.log("GRABBING?", !obj.isGrabbed, !leftIsGrabbing, rightIsGrabbing, obj.rightOverlapped);
            if (!obj.isGrabbed && !leftIsGrabbing && rightIsGrabbing && obj.rightOverlapped) { 
                // grab and move object
                if (obj.locked) {
                    // ROTATING
                    console.log("setting rotating object!");
                    currentlyRotatingObject = obj;
                    activeObject = currentlyRotatingObject;
                    prevCursorPosition = { x: right_cursor.position.x, y: right_cursor.position.y };
                    break;
                } else {
                    obj.isGrabbed = true;
                    currentlyGrabbedObject = obj;
                    activeObject = currentlyGrabbedObject;
                    highlight(obj, 0xff7f7d);
                    obj.grabOffsetX = obj.mesh.position.x - right_cursor.position.x;
                    obj.grabOffsetY = obj.mesh.position.y - right_cursor.position.y;
                }
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
                console.log("pinching!", currentlyPinchedObject, currentlyGrabbedObject);
                right_cursor.userData.prevX = right_cursor.position.x;
                right_cursor.userData.prevY = right_cursor.position.y;
                left_cursor.userData.prevX = left_cursor.position.x;
                left_cursor.userData.prevY = left_cursor.position.y;
            }
        } else if (currentlyPinchedObject == obj & leftIsPinching && rightIsPinching) {
            console.log("in pinching place!");
            highlight(obj, 0x6bb3ff);
                
            var distance = right_cursor.position.x - left_cursor.position.x;
            if (Math.abs(obj.width-distance)>0.005) {
                // console.log("bounding box min and max: ", obj.bounding_box.min, obj.bounding_box.max);
                // // center mesh
                // obj.mesh.position.set((right_cursor.position.x+left_cursor.position.x)/2, (right_cursor.position.y+left_cursor.position.y)/2, -1);
                
                obj.setScale(right_cursor, left_cursor);
                obj.bounding_box = obj.computeScreenSpaceBoundingBox(obj.mesh);
                // obj.width = distance;
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
// lock position for rotating
hotkeys('l', function(event, handler){
    event.preventDefault();
    activeObject.locked = !activeObject.locked;
    console.log("activeObject.locked", activeObject.locked)
    
});
// reload the page
hotkeys('r', function(event, handler){
    event.preventDefault();
    window.location.reload();
});
// shift active object
hotkeys('down', function(event, handler){
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
        // console.log('SWIPE!'); 
        if (!object.isModel) {
            object.dispose();
        }
        console.log("removing object from scene");    
        scene.remove(object.mesh);
        if (index > -1) {
            scene.objects.splice(index, 1);
        }
        console.log(scene.objects);
        activeObject = false;
        updateActiveObject();
    }
    renderer.render( scene, camera );

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
