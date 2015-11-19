function _expandBoxForStroke(boxDimensions, strokeWidth) {
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

function _clipBoxInCanvas(boxDimensions, canvasDimensions) {
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
  /***
   * Draw image onto canvas with the specified bounding box.
   *
   * @returns {int} x/y offset of image in canvas.
   */

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
  var outerBoxDimensions = _clipBoxInCanvas(
    _expandBoxForStroke(boundingBox, 3 * strokeWidth),
    [canvas.width, canvas.height]);

  ctx.strokeStyle = "red";
  ctx.lineWidth = strokeWidth;
  ctx.strokeRect(outerBoxDimensions[0],
                 outerBoxDimensions[1],
                 outerBoxDimensions[2],
                 outerBoxDimensions[3]);

  ctx.strokeStyle = "black";
  var innerBoxDimensions = _clipBoxInCanvas(
    _expandBoxForStroke(boundingBox, strokeWidth),
    [canvas.width, canvas.height]);
  ctx.strokeRect(innerBoxDimensions[0],
                 innerBoxDimensions[1],
                 innerBoxDimensions[2],
                 innerBoxDimensions[3]);
  return 2 * strokeWidth;
}