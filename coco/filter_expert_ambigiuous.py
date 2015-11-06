"""Given annotation output from an "expert," write out a mapping from
annotation_id to direction. This assumes there is only one direction per
annotation_id; if there are multiple, there is no specification as to which
one is selected.
"""

import argparse
import json

parser = argparse.ArgumentParser(
    description='Remove annotations that were marked as ambiguous')
parser.add_argument('expert_annotations',
                    help='Input JSON file with expert annotations')
parser.add_argument(
    'output_annotations',
    help='Output JSON file mapping from annotation_id to direction')

args = parser.parse_args()
json_file = args.expert_annotations
output_json_file = args.output_annotations

direction_to_direction_ids = {
    'left': 0,
    'away': 1,
    'right': 2,
    'towards': 3,
    # -1 is an invalid direction
    'ambiguous': -2
}
valid_directions = [direction_to_direction_ids[x]
                    for x in ['left', 'away', 'right', 'towards']]


def main():
    annotation_directions = {}
    with open(json_file) as input_file:
        for assignment_result_raw in input_file:
            assignment_result = json.loads(assignment_result_raw)
            unambiguous_directions = {
                annotation['annotation_id']: annotation['direction']
                for annotation in assignment_result['output']
                if annotation['direction'] in valid_directions
            }
            annotation_directions.update(unambiguous_directions)

    annotation_directions_output = [
        {'annotation_id': annotation_id,
         'direction': direction}
        for (annotation_id, direction) in annotation_directions.items()
    ]
    with open(output_json_file, 'wb') as output_file:
        output_file.write(json.dumps(annotation_directions_output))


if __name__ == '__main__':
    main()
