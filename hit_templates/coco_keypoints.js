// Define some default input.
var DEFAULT_INPUT = [
  {
    "object_name_plural": "necks",
    "image_id": 196842,
    "object_name": "neck",
    "image_url": "http://mscoco.org/images/196842",
    "annotation_id": 183022,
    "annotation": {
      "area": 3817.67415,
      "iscrowd": 0,
      "image_id": 196842,
      "bbox": [273.14, 82.25, 72.6, 129.68],
      "groundtruth": {"y": 82.25, "x": 273.14, "w": 72.6, "h": 129.68},
      "category_id": 1,
      "id": 183022
    }
  },
  {
    "object_name_plural": "necks",
    "image_id": 44474,
    "object_name": "neck",
    "image_url": "http://mscoco.org/images/44474",
    "annotation_id": 183024,
    "annotation": {
      "area": 52541.14914999998,
      "iscrowd": 0,
      "image_id": 44474,
      "bbox": [33.42, 11.94, 303.68, 407.76],
      "groundtruth": {"y": 11.94, "x": 33.42, "w": 303.68, "h": 407.76},
      "category_id": 1,
      "id": 183024
    }
  },
  {
    "object_name_plural": "necks",
    "image_id": 382669,
    "object_name": "neck",
    "image_url": "http://mscoco.org/images/382669",
    "annotation_id": 183026,
    "annotation": {
      "area": 10161.016499999998,
      "iscrowd": 0,
      "image_id": 382669,
      "bbox": [237.59, 107.09, 110.99, 241.92],
      "groundtruth": {"y": 107.09, "x": 237.59, "w": 110.99, "h": 241.92},
      "category_id": 1,
      "id": 183026
    }
  }
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
