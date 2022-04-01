import {animate} from "./scene.js";
import { flattenData, swipeData } from "./gestures.js";
// import { flattenData2 } from "./flatten2.js";

// Setup Leap loop with frame callback function
// TRAIN LEAP
var trainer = new LeapTrainer.Controller();
// var nntrainer = new LeapTrainer.ANNController();
trainer.fromJSON(flattenData);
trainer.fromJSON(swipeData);

// nntrainer.fromJSON(swipeData);
// console.log(trainer, trainer.gestures);

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
    animate(rightHand, leftHand, trainer);
  }
})

// DOCUMENT EVENT LISTENERS
var sidebarOpen = false;
var views = "horizontal";
document.getElementById("sidebarArrow").addEventListener("click", toggleSidebar);
document.getElementById("recalibrateButton").addEventListener("click", recalibrate);

export function toggleSidebar() {
    console.log("sidebarOpen", sidebarOpen);
    sidebarOpen = !sidebarOpen;
    const sidebar = document.getElementById("sidebar");
    const arrow = document.getElementById("sidebarArrow");
    
    if (sidebarOpen) {
      sidebar.classList.remove("hide");
      arrow.classList.add("open");
    } else {
      sidebar.classList.add("hide");
      arrow.classList.remove("open");
    }
}

export function recalibrate() {
  window.location.replace("http://localhost:8000/calibration.html")
}
