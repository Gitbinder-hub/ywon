# ADR 0003: Машиночитаемое состояние, handoff и owner acceptance
Статус: предложенная механика реализована в spec tooling; процесс принимается Q-001.
project.json — статусы/зависимости/history; features.json — цель; STATE/BACKLOG generated.
Structured handoff и AC evidence; REVIEW отдельно от DONE; no hidden model memory.
Python tooling локально, без сети/платных calls; git review является внешним контролем.
Owner flag не auth; local start не distributed lock. Remote runner откладывается до security gate.
