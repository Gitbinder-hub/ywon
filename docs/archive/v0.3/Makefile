.PHONY: spec-check spec-status spec-next spec-render
spec-check:
	python3 scripts/project.py validate
	python3 -m unittest discover -s tests_spec -v
spec-status:
	python3 scripts/project.py status
spec-next:
	python3 scripts/project.py next
spec-render:
	python3 scripts/project.py render
