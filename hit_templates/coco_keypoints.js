// Define some default input.
var DEFAULT_INPUT = [
  {
    "image_id" : 167765,
    "image_url" : "http://mscoco.org/images/167765",
    "annotation" : {
      "image_id" : 167765,
      "bbox" : [ 0.0, 1.44, 182.65, 629.93 ],
      "id" : 183813,
      "groundtruth" : {
        "bbox" : {"x" : 0.0, "y" : 1.44, "w" : 182.65, "h" : 629.93}
      },
    },
    "object_name": "elbow",
    "object_name_plural": "elbows",
    "annotation_id" : 183813
  },
  {
    "image_id" : 167765,
    "image_url" : "http://mscoco.org/images/167765",
    "annotation" : {
      "image_id" : 167765,
      "bbox" : [ 0.0, 1.44, 182.65, 629.93 ],
      "id" : 183813,
      "groundtruth" : {
        "bbox" : {"x" : 0.0, "y" : 1.44, "w" : 182.65, "h" : 629.93}
      },
    },
    "object_name": "elbow",
    "object_name_plural": "elbows",
    "annotation_id" : 183813
  },
  {
    "image_id" : 167765,
    "image_url" : "http://mscoco.org/images/167765",
    "annotation" : {
      "image_id" : 167765,
      "bbox" : [ 0.0, 1.44, 182.65, 629.93 ],
      "id" : 183813,
      "groundtruth" : {
        "bbox" : {"x" : 0.0, "y" : 1.44, "w" : 182.65, "h" : 629.93}
      },
    },
    "object_name": "elbow",
    "object_name_plural": "elbows",
    "annotation_id" : 183813
  },
];

var input = null;

// Some variables to track state of the HIT.
var enabled = false;
var keypointTasks = [];

// Enable the UI.
function enableHit() {
  enabled = true;

  // Set up submit handler.
  simpleamt.setupSubmit();
  $('#submit-btn').click(function() {
    return submit();
  });
}

function caroselShowCallback(idx, activeDiv) {
  for (var i = 0; i < keypointTasks.length; ++i) {
    keypointTasks[i].disable();
  }
  if (idx >= keypointTasks.length) {
    taskInfo = input[idx];
    var keypointTask = new VG.KeypointTask(activeDiv, taskInfo);
    keypointTasks.push(keypointTask);
  }
  keypointTasks[idx].enable();
}

function main() {
  // If this is a HIT on AMT, then replace the default input with the real
  // input.
  input = simpleamt.getInput(DEFAULT_INPUT);

  // Enable the UI if the HIT is not in preview mode.
  if (!simpleamt.isPreview()) {
    enableHit();
  }

  var imageDiv = $('#image-container');
  var buttonsDiv = $('#buttons-div');

  var numImages = input.length;
  var carosel = new VG.Carosel(imageDiv, buttonsDiv, input.length,
                               caroselShowCallback, false /*carosel_scroll*/);
  carosel.enable();
  carosel.enableKeyboardShortcuts();
}

$(function() {
  main();
});
