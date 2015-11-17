var VG = (function(vg) {
  /***
   * Setup a keypoint annotation task using VG.PointDrawer.
   *
   * @param {jQuery div} container_div HTML div wrapped by jQuery.
   * @param {object} task_input Input for the task. Contains the following keys
   *     <ul>
   *     <li> image_id
   *     <li> image_url
   *     <li> annotation (Optionally contains groundtruth)
   *     <li> object_name
   *     <li> object_name_plural
   *     </ul>
   */
  vg.KeypointTask = function(container_div, task_input) {
    var that = (this === vg ? {} : this);
    var enabled = false;

    var image_url = task_input.image_url;

    var drawer_div = $('<div>').appendTo(container_div);

    VIEWPORT_HEIGHT = 500;

    var max_height = VIEWPORT_HEIGHT;
    max_height -= $('#task-instr-div').height();
    max_height -= $('#c-buttons-div').height();
    var images_div = $('#c-imgs-div');
    var bbox_drawer_options = {
      max_height : max_height,
      max_width : images_div.width(),

      gt : task_input.annotation.groundtruth,
      obj_singular : task_input.object_name,
      obj_plural : task_input.object_plural
    };
    var bbox_drawer =
        new VG.PointDrawer(drawer_div, image_url, null, bbox_drawer_options);

    var timer = new VG.Timer();

    that.GetAnswerIfValid = function() {
      return {
        'answer' : bbox_drawer.GetAnswer(),
        'time' : timer.total(),
        'eval' : bbox_drawer.EvalAnswer()
      };
    };

    that.enable = function() {
      enabled = true;
      bbox_drawer.enable();
      timer.start();
    };

    that.disable = function() {
      enabled = false;
      bbox_drawer.disable();
      timer.stop();
    };

    that.disable();

    return that;
  };

  return vg;

}(VG || {}));
