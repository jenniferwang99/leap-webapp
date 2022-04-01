var SCREEN_OFFSET_X = 0;
var SCREEN_OFFSET_Y = 0;
var X_SCALE_OFFSET = 0;
var Y_SCALE_OFFSET = 0;

var delay = Date.now();

// FOR THREEJS SCENE BUILDING
const scene = new THREE.Scene();

// set background color
scene.background = new THREE.Color("white");
var light = new THREE.AmbientLight(0x404040);
scene.add(light);
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
scene.objects = [];
const renderer = new THREE.WebGLRenderer({alpha: true});
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


// loadSpriteImage('img/baozi.jpg', 4, 3, scene);
//CREATE CURSORS
const right_cursor_geo = new THREE.CircleGeometry( 0.1, 32 );
const right_cursor_material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
const right_cursor = new THREE.Mesh( right_cursor_geo, right_cursor_material );
scene.add( right_cursor );
right_cursor.userData = { isGrabbing: false, isPinching: false };

camera.position.z = 5;

const empty_vector = new THREE.Vector3( 0, 0, 0);

var rightPalmPosition;
var rightCursorPosition = empty_vector;

var controller = Leap.loop(function(frame) {
    // draw cursors
    var rightHand = undefined;
    var leftHand = undefined;
    for (var i = 0; i < frame.hands.length; i++) {
      var hand = frame.hands[i];
      if (hand.type=="right"){
        rightHand = hand;
      }
      if (hand.type=="left"){
        leftHand = hand;
      }
    }
    
    if ((rightHand && rightHand.type) || (leftHand && leftHand.type)){
      animate(rightHand);
    }
  })

const geometry1 = new THREE.PlaneGeometry( .5, .5 );
const material1 = new THREE.MeshBasicMaterial( {color: "green", side: THREE.DoubleSide} );
const plane1 = new THREE.Mesh( geometry1, material1 );
plane1.position.set(-3.9, 2.05, 0);
scene.add( plane1 );
  
const geometry2 = new THREE.PlaneGeometry( .5, .5 );
const material2 = new THREE.MeshBasicMaterial( {color: "green", side: THREE.DoubleSide} );
const plane2 = new THREE.Mesh( geometry2, material2 );
scene.add( plane2 );
  
var topLeftCoords = false;
var centerCoords = false;

var prevState = 0;
  
export function animate(rightHand) {
	requestAnimationFrame( animate );
    // for the cursors
    if (rightHand && rightHand.type) {
        rightPalmPosition = rightHand.palmPosition;
        rightCursorPosition = new THREE.Vector3( rightPalmPosition[0]-SCREEN_OFFSET_X, rightPalmPosition[1]-SCREEN_OFFSET_Y, 1 );
        document.getElementById("center").classList.remove("hide")
        if (prevState == 0 && rightHand.grabStrength == 1) {
          console.log("grabbing!")
            calibrate(rightCursorPosition);
            prevState = 1;
        } else if ( ((Date.now()-delay) > 5000) && prevState == 1 && rightHand.grabStrength != 1) {
          console.log("grabbing part 2!")
          prevState = 0;
            delay = Date.now();
        } else {
            // console.log(Date.now()-delay);
        }
    } else {
        return;
    }
    if (!rightCursorPosition.equals(empty_vector)){
        right_cursor.position.set(rightCursorPosition.x/X_SCALE_OFFSET, (rightCursorPosition.y/Y_SCALE_OFFSET), 1);
    }
    renderer.render( scene, camera );
}

function calibrate(cursorPosition) {
    if (!centerCoords) {
        centerCoords = cursorPosition;
        SCREEN_OFFSET_Y = cursorPosition.y;
        SCREEN_OFFSET_X = cursorPosition.x;  
        document.getElementById("center").classList.add("green")
        document.getElementById("topLeft").classList.remove("hide")
        return;
    } else if (!topLeftCoords) {
        topLeftCoords = cursorPosition;
        console.log("cursor position for top left", cursorPosition);
        //coords to map to: -3.9, 2.05, 0
        X_SCALE_OFFSET = rightCursorPosition.x/(-3.9);
        Y_SCALE_OFFSET = rightCursorPosition.y/2.05;
        console.log(rightCursorPosition.x, rightCursorPosition.x/(-3.9), rightCursorPosition.y,rightCursorPosition.y/2.05, "x and y offset scale");
        document.getElementById("topLeft").classList.add("green")
        document.getElementById("center").classList.add("hide")
        window.location.replace("http://localhost:8000/?xscreen="+SCREEN_OFFSET_X+"&yscreen="+SCREEN_OFFSET_Y+"&xscale="+X_SCALE_OFFSET+"&yscale="+Y_SCALE_OFFSET)
        return;
    } else {
        console.log(SCREEN_OFFSET_X, SCREEN_OFFSET_Y, X_SCALE_OFFSET, Y_SCALE_OFFSET);
   }
}


// FOR WEBCAM
var video = document.querySelector("#videoElement");

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: {width: 960, height: 540} })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function () {
      console.log("Something went wrong!");
    });
}

