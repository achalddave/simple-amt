"""Add expert direction annotations output back into the HIT inputs."""

import argparse
import json

parser = argparse.ArgumentParser(
    description='Add expert direction annotations to COCO tasks.')
parser.add_argument('expert', help='Expert annotations with directions')
parser.add_argument('tasks', help='Input HIT tasks')
parser.add_argument('output',
                    help='Output HIT tasks with groundtruth direction value')
args = parser.parse_args()


def main():
    with open(args.expert) as expert_f:
        expert_directions = json.load(expert_f)
        expert_directions = {int(x['annotation_id']): x['direction']
                             for x in expert_directions}
    expert_annotated_ids = set(expert_directions.keys())
    print expert_annotated_ids

    with open(args.tasks) as tasks_f:
        tasks = json.load(tasks_f)
    for task in tasks:
        annotation_id = task['annotation_id']
        if annotation_id in expert_annotated_ids:
            task['annotation']['direction'] = expert_directions[annotation_id]
    with open(args.output, 'wb') as output_f:
        json.dump(tasks, output_f)


if __name__ == '__main__':
    main()
