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
        "bbox" : {"x" : 0.0, "y" : 1.44, "w" : 182.65, "h" : 629.93},
        "num_min" : 1,
        "num_max" : 1
      },
    },
    "object_name": "elbow",
    "object_name_plural": "elbows",
    "annotation_id" : 183813
  },
];

var input = null;

// Some variables to track state of the HIT.
var idx = 0;
var enabled = false;
var images = [];

// Enable the UI.
function enableHit() {
  enabled = true;

  // Enable components
  $('#next-btn').click(function() { setIdx(idx + 1) });
  $('#prev-btn').click(function() { setIdx(idx - 1) });
  $('#text-area').prop('disabled', false);
  $('#submit-btn').prop('disabled', false);

  // Set up submit handler.
  simpleamt.setupSubmit();
  $('#submit-btn').click(function() {
    return submit();
  });
}

// Use the current index to update the image and description
function render() {
  if (!images[idx].complete) {
    images[idx].onload = function() { render(images); };
    return;
  }

  // Refresh the counter
  $('.counter-top').text(idx + 1);
  $('.counter-bottom').text(input.length);

  // If the UI is enabled, enable or disable the buttons depending on
  // the index.
  if (enabled) {
    var prev_btn = $('#prev-btn');
    var next_btn = $('#next-btn');
    prev_btn.prop('disabled', true);
    next_btn.prop('disabled', true);
    if (idx > 0) {
      prev_btn.prop('disabled', false);
    }
    if (idx < input.length - 1)
      next_btn.prop('disabled', false);
  }
}

function main() {
  // If this is a HIT on AMT, then replace the default input with the real
  // input.
  input = simpleamt.getInput(DEFAULT_INPUT);

  // Enable the UI if the HIT is not in preview mode.
  if (!simpleamt.isPreview()) {
    enableHit();
  }

  // Preload all images
  _.each(input, function(task_info) {
    var img = new Image();
    var img_url = task_info['image_url'];
    img.src = img_url;
    images.push(img);
  });

  // Setup keyboard shortcuts
  if (enabled) {
    // Do things here if necessary.
  }

  render();

  var imageDiv = $('#image-container')
  var keypointTasks = [];
  input.forEach(function(taskInfo) {
    var keypointTask = new VG.KeypointTask(imageDiv, taskInfo);
    keypointTasks.push(keypointTask);
  });
  keypointTasks[0].enable();
}

$(function() {
  main();
});
