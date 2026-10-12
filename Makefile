.PHONY: dev check bootstrap-check spec-check spec-status spec-next spec-render package-check transfer-check
dev:
	node --watch apps/api/src/server.ts
bootstrap-check:
	npm run check
check: bootstrap-check
	@node scripts/check_skills.mjs
# Полные прогоны — только вручную перед релизом, не на каждый шаг:
#   npm run test:manual / npm run check:all / make spec-check / make transfer-check
spec-check:
	@test -f scripts/project.py || (echo 'BLOCKED: full v0.4 spec import pending; see bootstrap/REMOTE_IMPORT.md'; exit 1)
	python3 scripts/project.py validate
	python3 -m unittest discover -s tests_spec -v
	@node scripts/check_skills.mjs
spec-status:
	python3 scripts/project.py status
spec-next:
	python3 scripts/project.py next
spec-render:
	python3 scripts/project.py render
package-check:
	python3 scripts/check_package.py

transfer-check:
	python3 -m unittest discover -s tests_transfer -v
