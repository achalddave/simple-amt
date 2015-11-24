// Define some default input.
var DEFAULT_INPUT = {
  'questions': [
    {
      "image_id": 196842,
      "image_url": "http://mscoco.org/images/196842",
      "annotation_id": 183022,
      "annotation": {
        "area": 3817.67415,
        "iscrowd": 0,
        "image_id": 196842,
        "bbox": [273.14, 82.25, 72.6, 129.68],
        "groundtruth":
            {"bbox": {"y": 82.25, "x": 273.14, "w": 72.6, "h": 129.68}},
        "category_id": 1,
        "id": 183022
      }
    },
    {
      "image_id": 44474,
      "image_url": "http://mscoco.org/images/44474",
      "annotation_id": 183024,
      "annotation": {
        "area": 52541.14914999998,
        "iscrowd": 0,
        "image_id": 44474,
        "bbox": [33.42, 11.94, 303.68, 407.76],
        "groundtruth":
            {"bbox": {"y": 11.94, "x": 33.42, "w": 303.68, "h": 407.76}},
        "category_id": 1,
        "id": 183024
      }
    },
    {
      "image_id": 382669,
      "image_url": "http://mscoco.org/images/382669",
      "annotation_id": 183026,
      "annotation": {
        "area": 10161.016499999998,
        "iscrowd": 0,
        "image_id": 382669,
        "bbox": [237.59, 107.09, 110.99, 241.92],
        "groundtruth":
            {"bbox": {"y": 107.09, "x": 237.59, "w": 110.99, "h": 241.92}},
        "category_id": 1,
        "id": 183026
      }
    }
  ],
  "object_name": "right wrist",
  "object_name_plural": "right wrists",
};

var input = null;

// Some variables to track state of the HIT.
var enabled = false;
var keypointTasks = [];

var validation = {'minAccuracy': 0.9, 'minTimeSpentSeconds': 0.1};

function calculateGroundtruthAccuracy() {}

function error(msg) {
  $('#error-div').text(msg).removeClass('hidden');
}

function submit() {
  var questions = input.questions;
  if (keypointTasks.length < questions.length) {
    error('Please mark a point for each image.');
    return false;
  }

  var answers = [];
  var groundtruthCorrect = 0;
  var groundtruthIncorrect = 0;
  for (var i = 0; i < questions.length; ++i) {
    var answer = keypointTasks[i].GetAnswerIfValid();
    answers.push(answer);

    if (answer.time < validation.minTimeSpentSeconds) {
      error('Please take another look at image', i + 1);
      return false;
    }

    switch (answer.eval) {
      case VG.EvaluationEnum.good:
        groundtruthCorrect += 1;
        break;
      case VG.EvaluationEnum.bad:
        groundtruthIncorrect += 1;
        break;
      case VG.EvaluationEnum.incomplete:
        error('Please take another look at image ' + (i + 1));
        return false;
      case VG.EvaluationEnum.neutral:
        break;
      default:
        console.error('Received strange, invalid evaluation:', answer.eval);
        break;
    }
  }

  if (groundtruthCorrect + groundtruthIncorrect > 0) {
    var accuracy =
        groundtruthCorrect / (groundtruthCorrect + groundtruthIncorrect);
    if (accuracy < validation.minAccuracy) {
      error('Please take another look at your answers.');
      return false;
    }
  }

  simpleamt.setOutput({'output': answers, 'input': input});
  return true;
}

// Enable the UI.
function enableHit() {
  enabled = true;

  // Set up submit handler.
  simpleamt.setupSubmit();
  $('#submit-btn').prop('disabled', false);
  $('#submit-btn').click(function() {
    try {
      return submit();
    } catch (e) {
      error('There was an error submitting. Please try again. '
            + 'If this keeps happening, please email the requester.');
      return false;
    }
  });
}

function caroselShowCallback(idx, activeDiv) {
  for (var i = 0; i < keypointTasks.length; ++i) {
    keypointTasks[i].disable();
  }
  if (idx >= keypointTasks.length) {
    var taskInfo = input.questions[idx];
    console.log(taskInfo);
    taskInfo.object_name = input.object_name;
    taskInfo.object_name_plural = input.object_name_plural;
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

  var numImages = input.questions.length;
  var carosel = new VG.Carosel(imageDiv, buttonsDiv, numImages,
                               caroselShowCallback, false /*carosel_scroll*/);
  carosel.enable();
  carosel.enableKeyboardShortcuts();

  $('.object-name').text(input.object_name)
  $('.object-name-plural').text(input.object_name_plural)
  $('title').text($('title').text().replace('key point', input.object_name));
}

$(function() {
  main();
});
