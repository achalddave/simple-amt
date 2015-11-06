"""Simplify the output from an old version of the person labeling HIT.

The old version contained the entire input annotation as well as the direction.
This strips it down to {'annotation_id': <id>, 'direction': <direction>} for
each task.

WARNING: This is really a one-time script that shouldn't need to be used again;
this is here mainly for reference.
"""

import argparse
import json

parser = argparse.ArgumentParser(
    description='Simplify old direction annotations')
parser.add_argument('old_direction_annotations')
parser.add_argument('simpler_annotations')
args = parser.parse_args()


def main():
    with open(args.old_direction_annotations) as old_annotations_f, \
         open(args.simpler_annotations, 'wb') as simpler_annotations_f:
        for assignment_result_raw in old_annotations_f:
            assignment_result = json.loads(assignment_result_raw)
            updated_outputs = []
            for annotation in assignment_result['output']:
                updated_outputs.append({
                    'annotation_id': annotation['input']['annotation_id'],
                    'direction': annotation['direction']
                })
            assignment_result['output'] = updated_outputs
            json.dump(assignment_result, simpler_annotations_f)
            simpler_annotations_f.write('\n')


if __name__ == '__main__':
    main()
