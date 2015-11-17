String.prototype.format = function(placeholders) {
  var s = this;
  for(var propertyName in placeholders) {
    var re = new RegExp('{' + propertyName + '}', 'gm');
    s = s.replace(re, placeholders[propertyName]);
  }
  return s;
};

// Global variables

// Define some default input.
var DEFAULT_INPUT = [
  {"image_id": 167765, "image_url": "http://mscoco.org/images/167765", "annotation": {"image_id": 167765, "bbox": [0.0, 1.44, 182.65, 629.93], "id": 183813}, "annotation_id": 183813},
  {"image_id": 495312, "image_url": "http://mscoco.org/images/495312", "annotation": {"image_id": 495312, "bbox": [1.31, 28.26, 373.56, 470.91], "id": 183172}, "annotation_id": 183172},
  {"image_id": 44474, "image_url": "http://mscoco.org/images/44474", "annotation": {"image_id": 44474, "bbox": [33.42, 11.94, 303.68, 407.76], "id": 183024}, "annotation_id": 183024},
  {"image_id": 196842, "image_url": "http://mscoco.org/images/196842", "annotation": {"image_id": 196842, "bbox": [273.14, 82.25, 72.6, 129.68], "id": 183022, "direction": 3}, "annotation_id": 183022}
];

var input = null;

var key_to_button_id = {
  "a": "direction-left",
  "w": "direction-away",
  "d": "direction-right",
  "s": "direction-towards",
  "n": "impossible-to-tell"
  // "m": "direction-ambiguous"
};
var button_id_to_direction = {
  "direction-left": 0,
  "direction-away": 1,
  "direction-right": 2,
  "direction-towards": 3,
  // "direction-ambiguous": -2,
  "impossible-to-tell": -3
};
var direction_to_button_id = {
  "0": "direction-left",
  "1": "direction-away",
  "2": "direction-right",
  "3": "direction-towards",
  // "-2": "direction-ambiguous",
  "-3": "impossible-to-tell"
};

// Direction of each person, parallel to input.
var directions = [];

// Some variables to track state of the HIT.
var idx = 0;
var enabled = false;
var images = [];

function setupExamples() {
  var exampleTemplate =
    '<div class="example" id="{exampleId}">' +
    '<div class="example-image-container">' +
    '<canvas class="example-image">' +
      'Your browser does not support canvas. Unfortunately, this means ' +
      'you will not be able to complete this task. Sorry!' +
    '</canvas>' +
    '</div>' +
    '<div class="example-caption">{caption}</div>' +
    '</div>';

  // Examples for instructions; the keys map to HTML ids.
  var exampleInputs = {
    'example-impossible-to-tell': {
      'task_info': {
        'image_id': 167765,
        'image_url': 'http://mscoco.org/images/167765',
        'annotation': {
          'image_id': 167765,
          'bbox': [0.0, 1.44, 182.65, 629.93],
          'id': 183813
        },
        'annotation_id': 183813
      },
      'caption': 'Impossible to tell'
    },
    'example-towards-you': {
      'task_info': {
        'image_id': 44474,
        'image_url': 'http://mscoco.org/images/44474',
        'annotation': {
          'image_id': 44474,
          'bbox': [33.42, 11.94, 303.68, 407.76],
          'id': 183024
        },
        'annotation_id': 183024
      },
      'caption': 'Towards you'
    },
    'example-away-from-you': {
      'task_info': {
        'image_id': 11702,
        'image_url': 'http://mscoco.org/images/11702',
        'annotation': {
          'image_id': 11702,
          'bbox': [88.07, 108.82, 50.17, 76.92],
          'id': 183846
        },
        'annotation_id': 183846
      },
      'caption': 'Away from you'
    }
  }

  var examplesInOrder = ['example-towards-you', 'example-away-from-you', 'example-impossible-to-tell'];
  for (var i = 0; i < examplesInOrder.length; ++i) {
    var exampleId = examplesInOrder[i];
    $('#examples').append(exampleTemplate.format({
      exampleId: exampleId,
      caption: exampleInputs[exampleId]['caption']
    }));
    var taskInfo = exampleInputs[exampleId]['task_info'];
    var img = new Image();
    img.src = taskInfo['image_url'];
    // Draw image to canvas once image loads.
    // Capture exampleId in callback
    img.onload = (function(id, taskInfo) {
      return function() {
        var jCanvas = $('#' + id + ' canvas');
        drawImageWithBox(jCanvas[0],
          this,
          taskInfo['annotation']['bbox']);
        var topOffset = ($('.example-image-container').height()
                         - jCanvas.height()) / 2;
        jCanvas.css('top', topOffset);
      }
    })(exampleId, taskInfo);
  }
}

function expandBoxForStroke(boxDimensions, strokeWidth) {
  // Scale the bounding box so that when you stroke the border, the
  // inside contains as much space as the original bounding box. This
  // is necessary since the Canvas API draws half of the "strokeWidth"
  // inside the rectangle.
  //
  // Params:
  //   boxDimensions: [topLeftX, topLeftY, width, height] of a
  //     bounding box.
  //  strokeWidth (int): Stroke width used for canvas.
  //
  // Returns:
  //   [topLeftX, topLeftY, width, height] of updated bounding box.
  var boxStartX = boxDimensions[0],
      boxStartY = boxDimensions[1],
      boxWidth = boxDimensions[2],
      boxHeight = boxDimensions[3];

  // Move strokeWidth/2 left and up.
  boxStartX = boxStartX - (strokeWidth / 2.0);
  boxStartY = boxStartY - (strokeWidth / 2.0);
  // Increase dimensions by strokeWidth (since we lose strokeWidth/2
  // on each side to the stroke).
  boxWidth = boxWidth + strokeWidth;
  boxHeight = boxHeight + strokeWidth;

  return [boxStartX, boxStartY, boxWidth, boxHeight];
}

function clipBoxInCanvas(boxDimensions, canvasDimensions) {
  // Clips bounding box so it is within the canvas.
  //
  // Params:
  //   boxDimensions: [topLeftX, topLeftY, width, height] of a
  //     bounding box.
  //   canvasDimensions: [width, height] of the Canvas.
  //
  // Returns:
  //   [topLeftX, topLeftY, width, height] of updated bounding box.
  //
  var boxStartX = boxDimensions[0],
      boxStartY = boxDimensions[1],
      boxWidth = boxDimensions[2],
      boxHeight = boxDimensions[3],
      boxEndX = boxStartX + boxWidth,
      boxEndY = boxStartY + boxHeight,
      canvasWidth = canvasDimensions[0],
      canvasHeight = canvasDimensions[1];

  boxStartX = Math.max(boxStartX, 0);
  boxStartY = Math.max(boxStartY, 0);
  boxEndX   = Math.min(boxEndX, canvasWidth);
  boxEndY   = Math.min(boxEndY, canvasHeight);
  return [boxStartX, boxStartY, boxEndX - boxStartX, boxEndY - boxStartY];
}

function drawImageWithBox(canvas, image, boundingBox) {
  // Draw image onto canvas with the specified bounding box.

  // We're going to draw 2 rectangles around the image with the same
  // strokeWidth. To avoid issues at the borders, we'll create a canvas with a
  // 2 * strokeWidth padding on all sides, and draw the image at the center.
  var strokeWidth = image.height / 75;

  // Make a copy to allow modification.
  var boundingBox = boundingBox.slice();

  // Bounding box is relative to image; make it relative to canvas.
  boundingBox[0] += 2 * strokeWidth;
  boundingBox[1] += 2 * strokeWidth;

  // Add 2 * strokeWidth empty padding around image.
  canvas.width = image.width + 4 * strokeWidth;
  canvas.height = image.height + 4 * strokeWidth;
  var ctx = canvas.getContext("2d");
  // Draw image at the center.
  ctx.drawImage(image, 2 * strokeWidth, 2 * strokeWidth);

  // Draw an outer outline around inner outline, which should hopefully
  // provide enough contrast. Note that the inside of the bounding
  // box itself will not be stroked, since we scale the bounding box
  // to stroke only the outside.

  // Leave enough room for both rectangles. This one will squeeze
  // 0.5 stroke widths into the rectangle, and the other one will
  // squeeze 1.0 stroke widths into the rectangle; so we need to
  // pretend like we're going to draw a 3*strokeWidth stroke.
  var outerBoxDimensions = clipBoxInCanvas(
    expandBoxForStroke(boundingBox, 3 * strokeWidth),
    [canvas.width, canvas.height]);

  ctx.strokeStyle = "red";
  ctx.lineWidth = strokeWidth;
  ctx.strokeRect(outerBoxDimensions[0],
                 outerBoxDimensions[1],
                 outerBoxDimensions[2],
                 outerBoxDimensions[3]);

  ctx.strokeStyle = "black";
  var innerBoxDimensions = clipBoxInCanvas(
    expandBoxForStroke(boundingBox, strokeWidth),
    [canvas.width, canvas.height]);
  ctx.strokeRect(innerBoxDimensions[0],
                 innerBoxDimensions[1],
                 innerBoxDimensions[2],
                 innerBoxDimensions[3]);
}

// Use the current index to update the image and description
function render() {
  if (!images[idx].complete) {
    images[idx].onload = function() { render(images); }
    return;
  }

  // Set up the image.
  var jCanvas = $('#image-canvas');
  var canvas = jCanvas[0];
  drawImageWithBox(canvas, images[idx], input[idx]['annotation']['bbox']);
  jCanvas.css('height', '500px');
  jCanvas.css('max-width', '700px');

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
    $('.direction-annotation').prop('disabled', false);
    // If an answer was already provided for this image, set the
    // respective button to be active.
    if (directions[idx] != -1
        && $('.direction-annotation.active').length == 0) {
      $('#' + direction_to_button_id[directions[idx]]).addClass('active');
    }
    if (idx > 0) {
      prev_btn.prop('disabled', false);
    }
    if (idx < input.length - 1) next_btn.prop('disabled', false);
  }
}

function main() {
  // If this is a HIT on AMT, then replace the default input with the real input.
  input = simpleamt.getInput(DEFAULT_INPUT);

  // Enable the UI if the HIT is not in preview mode.
  if (!simpleamt.isPreview()) {
    enableHit();
  }

  setupExamples();

  // Set up the directions.
  _.each(input, function() {
    directions.push(-1);
  });

  // Preload all images
  _.each(input, function(task_info) {
    var img = new Image();
    var img_url = task_info['image_url'];
    img.src = img_url;
    images.push(img);
  });

  // Setup keyboard shortcuts
  if (enabled) {
    // Highlight button on keypress so there is some visual feedback,
    // skip on keyup.
    $(document).keypress(function(e) {
      var key = String.fromCharCode(e.which).toLowerCase();
      if (key in key_to_button_id) {
        $('.direction-annotation').removeClass('active');
        $('#' + key_to_button_id[key]).addClass('active');
      }
    });

    // Handle direction marking, previous/next buttons.
    $(document).keyup(function(e) {
      var key = String.fromCharCode(e.which).toLowerCase();
      if (key in key_to_button_id) {
        $('#' + key_to_button_id[key]).click();
      } else {
        if (e.which == 39) { // right arrow
          $('#next-btn').click();
        } else if (e.which == 37) { // left arrow
          $('#prev-btn').click();
        }
      }
    });
  }

  render();
}

function updateSelectedDirection() {
  // Update the directions array with the selected direction for the
  // current image.
  selected_direction_buttons = $('.direction-annotation.active');
  if (selected_direction_buttons.length == 1) {
    selected_direction_id = selected_direction_buttons[0].id;
    directions[idx] = button_id_to_direction[selected_direction_id];
  }
}

// Update the index, and save the text in the text area.
function setIdx(new_idx) {
  if (new_idx < 0 || new_idx >= input.length) return;

  updateSelectedDirection();
  $('.direction-annotation').removeClass('active');

  idx = new_idx;
  render();
}

// Enable the UI.
function enableHit() {
  enabled = true;

  // Enable components
  $('#next-btn').click(function() { setIdx(idx + 1) });
  $('#prev-btn').click(function() { setIdx(idx - 1) });
  $('#text-area').prop('disabled', false);
  $('#submit-btn').prop('disabled', false);

  // Mark the selected button as active.
  $('.direction-annotation').click(function() {
    $('.direction-annotation').removeClass('active');
    $(this).addClass('active');
    if (idx < input.length - 1) {
      setIdx(idx + 1);
    } else {
      $('#submit-hint-done').show();
    }
  });


  // Set up submit handler.
  simpleamt.setupSubmit();
  $('#submit-btn').click(function() {
    return submit();
  });
}

function getMissingAnnotations() {
  // Get a list of indices of images that don't have a direction
  // specified.
  //
  // Returns:
  //  missing_annotations (list)
  var invalid_direction_indices =
    _.map(directions, function(d, idx) {
      if (d == -1) { return idx + 1; } else { return -1; }
    });
  invalid_direction_indices =
    _.filter(invalid_direction_indices,
             function(idx) { return idx != -1; })
  return invalid_direction_indices;
}

function submit() {
  updateSelectedDirection();
  var invalid_direction_indices = getMissingAnnotations();
  if (invalid_direction_indices.length > 0) {
    alert('Direction for image(s) '
          + invalid_direction_indices.join(', ')
          + ' missing.');
    return false;
  }
  var num_missed_groundtruth = 0;
  var num_groundtruth = 0;
  var output = _.map(_.zip(input, directions), function(x) {
    if ('direction' in x[0]['annotation']) {
      num_groundtruth++;
      if (x[1] != x[0]['annotation']['direction']) {
        num_missed_groundtruth++;
      }
    }
    return {'annotation_id': x[0]['annotation_id'], 'direction': x[1]};
  });
  if (num_missed_groundtruth / num_groundtruth > 0.2) {
    var isare = num_missed_groundtruth > 1 ? "are" : "is";
    alert("There " + isare + " at least " + num_missed_groundtruth
          + " mislabeled image(s)! Please take another look.")
    return false;
  }
  simpleamt.setOutput(output);
}

$(function() {
  main();
});
