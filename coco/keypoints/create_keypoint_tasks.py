"""Create HITs for keypoint annotation with batch tasks from a list of tasks."""

import argparse
import json

parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument('tasks_file')
parser.add_argument('output_hits')
parser.add_argument('keypoint_name')
parser.add_argument('keypoint_name_plural', nargs='?')
parser.add_argument('--tasks_per_hit',
                    type=int,
                    default=50,
                    help='Number of tasks per HIT assignment.')
parser.add_argument(
    '--bbox_as_gt',
    action='store_true',
    help=('Use annotation bounding box as "groundtruth" box for keypoint. '
          'That is, any keypoint should be within the bounding box.'))
parser.add_argument(
    '--bbox_gt_scale',
    type=float,
    default=1,
    help=("Scale bounding box by this factor before storing as groundtruth. "
          "This way, if user's click slightly outside the box, they will not "
          "penalized."))

args = parser.parse_args()
if 'keypoint_name_plural' not in args:
    args.keypoint_name_plural = args.keypoint_name + 's'

class Rectangle(object):
    """
    Attributes:
        x (float)
        y (float)
        w (float)
        h (float)
    """
    def __init__(self, coordinates):
        """
        Params:
            coordinates (list): Contains [x, y, w, h]
        """
        self.x, self.y, self.w, self.h = coordinates

    def scale(self, scale_factor):
        """
        Scale rectangle by 2, keeping the center of the rectangle fixed.

        >>> r = Rectangle([0, 0, 2, 2])
        >>> r.scale(2)
        >>> assert r.x == -1, 'r.x is {}, expected -1.'.format(r.x)
        >>> assert r.y == -1, 'r.y is {}, expected -1.'.format(r.y)
        >>> assert r.w == 4, 'r.w is {}, expected 4.'.format(r.w)
        >>> assert r.h == 4, 'r.h is {}, expected 4.'.format(r.h)
        """
        updated_width = self.w * scale_factor
        updated_height = self.h * scale_factor
        self.x = self.x - (updated_width - self.w) / 2.
        self.y = self.y - (updated_height - self.h) / 2.
        self.w = updated_width
        self.h = updated_height

    def to_dict(self):
        return {'x': self.x, 'y': self.y, 'w': self.w, 'h': self.h}

def create_task(annotation_info, bounding_box_as_groundtruth,
                bounding_box_groundtruth_scale):
    """Transform COCO annotation object into a task."""
    if bounding_box_as_groundtruth:
        bounding_box = Rectangle(annotation_info['annotation']['bbox'])
        bounding_box.scale(bounding_box_groundtruth_scale)
        annotation_info['annotation']['groundtruth'] = {
            'bbox': bounding_box.to_dict()
        }
    return annotation_info

def main():
    with open(args.tasks_file) as tasks_file, \
         open(args.output_hits, 'wb') as output:
        tasks = json.load(tasks_file)

        tasks_per_hit = args.tasks_per_hit
        num_tasks = len(tasks)
        for i in xrange(0, num_tasks, tasks_per_hit):
            batch_tasks = tasks[i:i + tasks_per_hit]
            keypoint_tasks = [create_task(task, args.bbox_as_gt,
                                          args.bbox_gt_scale)
                              for task in batch_tasks]
            keypoint_hit = {
                'questions': keypoint_tasks,
                'object_name': args.keypoint_name,
                'object_name_plural': args.keypoint_name_plural
            }
            json.dump(keypoint_hit, output)
            output.write('\n')

if __name__ == '__main__':
    main()
