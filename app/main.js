import {animate} from "./scene.js";
// import { flattenData } from "./flatten.js";
import { flattenData2 } from "./flatten2.js";

// Setup Leap loop with frame callback function
// TRAIN LEAP
var trainer = new LeapTrainer.ANNController();
trainer.fromJSON(flattenData2);
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



// export function checkLibrary() {
//   if (typeof Leap === "undefined") {
//     document.getElementById("main").innerHTML = "The Leap JavaScript client library (leap.js file) was not found. Please download the library from the GitHub project at <a href='https://github.com/leapmotion/leapjs'>https://github.com/leapmotion/leapjs</a>."
//     alert("The Leap JavaScript client library (leap.js file) was not found. Please download the latest version from the GitHub project at https://github.com/leapmotion/leapjs");
//   }
// }