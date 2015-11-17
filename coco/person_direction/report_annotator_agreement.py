"""Report interannotator mapping given results from a HIT."""

import argparse
import collections
import json

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('hit_results',
                    help='Results received from a set of HITs on AMT.')
args = parser.parse_args()

def report_agreement(hit_results):
    """Report annotator agreement for each annotation_id.

    TODO(achald): For now, we just report how many of the annotation_ids had all
    the workers agree.

    Params:
        hit_results (list of result objects)

    Returns:
    """
    # Maps annotation_ids to list of results.
    annotation_results = collections.defaultdict(list)
    for hit_result in hit_results:
        hit_output = hit_result['output']
        for annotation_result in hit_output:
            annotation_id = annotation_result['annotation_id']
            direction = int(annotation_result['direction'])
            annotation_results[annotation_id].append(direction)

    confident_annotations = 0
    for annotation_result in annotation_results.values():
        if len(set(annotation_result)) == 1:
            confident_annotations += 1
    return (confident_annotations, len(annotation_results))

def main():
    with open(args.hit_results) as f:
        hit_results = [json.loads(line.strip()) for line in f]
        confident_annotations, num_annotations = report_agreement(hit_results)
        print '{}/{} annotations had all workers agreeing.'.format(
                confident_annotations, num_annotations)

if __name__ == '__main__':
    main()
