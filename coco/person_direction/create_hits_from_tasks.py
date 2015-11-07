"""Creates a JSON file for HITs with batch tasks by taking a list of tasks."""

import argparse
import json
import random

parser = argparse.ArgumentParser(
    description='Create batched task HITs from tasks.',
    formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument('tasks_file')
parser.add_argument('output_hits')
parser.add_argument('--tasks_per_hit',
                    type=int,
                    default=50,
                    help='Number of tasks per HIT assignment.')
parser.add_argument(
    '--groundtruth_per_hit',
    type=int,
    default=0,
    help=('Include this many expert annotated tasks per HIT.'
          'If 0, groundtruth tasks are simply treated as regular tasks.'))

args = parser.parse_args()

def split_groundtruth_tasks(tasks):
    """Split tasks into groundtruth and others.

    Params:
        tasks (list): List of tasks

    Returns:
        split_tasks (tuple): First element is a list of groundtruth tasks.
            Second element is a list of the other tasks."""
    groundtruth = []
    rest = []
    for task in tasks:
        if 'direction' in task['annotation']:
            groundtruth.append(task)
        else:
            rest.append(task)
    return (groundtruth, rest)

def main():
    with open(args.tasks_file) as tasks_file, \
         open(args.output_hits, 'wb') as output:
        tasks = json.load(tasks_file)

        groundtruth_per_hit = args.groundtruth_per_hit
        tasks_per_hit = args.tasks_per_hit
        if args.groundtruth_per_hit > 0:
            groundtruth, tasks = split_groundtruth_tasks(tasks)
            tasks_per_hit -= args.groundtruth_per_hit
        num_tasks = len(tasks)

        for i in xrange(0, num_tasks, tasks_per_hit):
            batch_tasks = tasks[i:i + tasks_per_hit]
            if groundtruth_per_hit > 0:
                batch_tasks.extend(random.sample(groundtruth,
                                                 groundtruth_per_hit))
            json.dump(batch_tasks, output)
            output.write('\n')


if __name__ == '__main__':
    main()
