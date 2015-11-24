import argparse

import simpleamt

if __name__ == '__main__':
  parser = argparse.ArgumentParser(parents=[simpleamt.get_parent_parser()],
              description="List active HITs")
  args = parser.parse_args()

  mtc = simpleamt.get_mturk_connection_from_args(args)

  for hit in mtc.get_all_hits():
    print hit.HITId
