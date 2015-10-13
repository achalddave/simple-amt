import argparse, json

from boto.mturk.price import Price
from boto.mturk.question import HTMLQuestion
from boto.mturk.connection import MTurkRequestError

import simpleamt

if __name__ == '__main__':
  parser = argparse.ArgumentParser(parents=[simpleamt.get_parent_parser()])
  parser.add_argument(
      '--hit_properties_file',
      type=argparse.FileType('r'),
      required=True)
  parser.add_argument(
      '--html_template',
      required=True)
  parser.add_argument(
      '--input_json_file',
      type=argparse.FileType('r'),
      required=True)
  args = parser.parse_args()
  # Alas, it doesn't seem to be possible to update an argument that was defined
  # in a parent parser to be required.
  if args.hit_ids_file is None:
    parser.error('argument --hit_ids_file is required')

  mtc = simpleamt.get_mturk_connection_from_args(args)

  hit_properties = json.load(args.hit_properties_file)
  hit_properties['reward'] = Price(hit_properties['reward'])
  simpleamt.setup_qualifications(hit_properties)

  frame_height = hit_properties.pop('frame_height')
  env = simpleamt.get_jinja_env(args.config)
  template = env.get_template(args.html_template)

  hit_ids = []
  with open(args.hit_ids_file, 'w') as hit_ids_file_handle:
    for i, line in enumerate(args.input_json_file):
      hit_input = json.loads(line.strip())

      # In a previous version I removed all single quotes from the json dump.
      # TODO: double check to see if this is still necessary.
      template_params = { 'input': json.dumps(hit_input) }
      html = template.render(template_params)
      html_question = HTMLQuestion(html, frame_height)
      hit_properties['question'] = html_question

      # This error handling is kinda hacky.
      # TODO: Do something better here.
      launched = False
      while not launched:
        try:
          print 'Trying to launch HIT %d' % (i + 1)
          boto_hit = mtc.create_hit(**hit_properties)
          launched = True
        except MTurkRequestError as e:
          print e
      hit_id = boto_hit[0].HITId
      hit_ids_file_handle.write('%s\n' % hit_id)
