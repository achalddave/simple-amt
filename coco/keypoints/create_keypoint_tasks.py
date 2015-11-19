"""Create HITs for keypoint annotation with batch tasks from a list of tasks."""

import argparse
import json

parser = argparse.ArgumentParser(__doc__)
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
args = parser.parse_args()
if 'keypoint_name_plural' not in args:
    args.keypoint_name_plural = args.keypoint_name + 's'

def create_task(annotation_info, name, name_plural,
                bounding_box_as_groundtruth):
    """Transform COCO annotation object into a task."""
    if bounding_box_as_groundtruth:
        annotation_info['annotation']['groundtruth'] = {
            'x': annotation_info['annotation']['bbox'][0],
            'y': annotation_info['annotation']['bbox'][1],
            'w': annotation_info['annotation']['bbox'][2],
            'h': annotation_info['annotation']['bbox'][3],
        }
    annotation_info['object_name'] = name
    annotation_info['object_name_plural'] = name_plural
    return annotation_info

def main():
    with open(args.tasks_file) as tasks_file, \
         open(args.output_hits, 'wb') as output:
        tasks = json.load(tasks_file)

        tasks_per_hit = args.tasks_per_hit
        num_tasks = len(tasks)
        for i in xrange(0, num_tasks, tasks_per_hit):
            batch_tasks = tasks[i:i + tasks_per_hit]
            keypoint_tasks = [create_task(task, args.keypoint_name,
                                          args.keypoint_name_plural, True)
                              for task in batch_tasks]
            json.dump(keypoint_tasks, output)
            output.write('\n')

if __name__ == '__main__':
    main()
