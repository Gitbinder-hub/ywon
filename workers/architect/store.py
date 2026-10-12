"""B-005 local SQLite preview state. No providers, auth, billing or production queue."""
import datetime, hashlib, json, os, re, sqlite3, sys
from pathlib import Path
APP_ID = 0x51564D41
SCHEMA = 5
MAX_REQUEST = 256 * 1024
ID = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,63}\Z")
STATES = {"planned", "blocked", "needs_user", "reconciling", "stopped"}
class Reject(Exception):
    pass

def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)

def digest(value):
    return hashlib.sha256(encoded(value).encode()).hexdigest()

def ident(value):
    if not isinstance(value, str) or not ID.fullmatch(value):
        raise Reject("invalid_id")
    return value

def number(value, minimum=0):
    if type(value) is not int or value < minimum or value > 1_000_000_000_000:
        raise Reject("invalid_integer")
    return value

def verify(db, unit):
    rows = db.execute("SELECT version, previous_hash, event_hash, state_json, command_id FROM events WHERE unit_id=? ORDER BY version", (unit,)).fetchall()
    previous = "0" * 64
    for expected, row in enumerate(rows, 1):
        state = json.loads(row[3])
        if row[0] != expected or row[1] != previous or digest({"previous": previous, "commandId": row[4], "state": state}) != row[2]:
            raise Reject("integrity_failure")
        previous = row[2]
    current = db.execute("SELECT version, state_json FROM units WHERE unit_id=?", (unit,)).fetchone()
    if current and (not rows or current[0] != rows[-1][0] or current[1] != rows[-1][3]):
        raise Reject("integrity_failure")
    return json.loads(current[1]) if current else None

def initialize(db):
    db.executescript("""
    CREATE TABLE units(unit_id TEXT PRIMARY KEY, version INTEGER NOT NULL, state_json TEXT NOT NULL);
    CREATE TABLE commands(command_id TEXT PRIMARY KEY, request_hash TEXT NOT NULL, response_json TEXT NOT NULL);
    CREATE TABLE approval_receipts(approval_id TEXT PRIMARY KEY, unit_id TEXT NOT NULL, admission_hash TEXT NOT NULL, state_version INTEGER NOT NULL);
    CREATE TABLE attempt_receipts(attempt_id TEXT PRIMARY KEY, approval_id TEXT NOT NULL UNIQUE, unit_id TEXT NOT NULL, admission_hash TEXT NOT NULL, state_version INTEGER NOT NULL);
    CREATE TABLE reservation_intent_receipts(intent_id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL UNIQUE, unit_id TEXT NOT NULL, intent_hash TEXT NOT NULL, state_version INTEGER NOT NULL);
    CREATE TABLE reservation_evidence_receipts(receipt_id TEXT PRIMARY KEY, intent_id TEXT NOT NULL UNIQUE, intent_hash TEXT NOT NULL, state_version INTEGER NOT NULL);
    CREATE TABLE reservation_reconciliation_receipts(reconciliation_id TEXT PRIMARY KEY, receipt_id TEXT NOT NULL, intent_id TEXT NOT NULL, outcome TEXT NOT NULL, state_version INTEGER NOT NULL);
    CREATE TABLE events(unit_id TEXT NOT NULL, version INTEGER NOT NULL, previous_hash TEXT NOT NULL, event_hash TEXT NOT NULL, state_json TEXT NOT NULL, command_id TEXT NOT NULL UNIQUE, PRIMARY KEY(unit_id,version));
    CREATE TRIGGER events_no_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER events_no_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER commands_no_update BEFORE UPDATE ON commands BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER commands_no_delete BEFORE DELETE ON commands BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER approvals_no_update BEFORE UPDATE ON approval_receipts BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER approvals_no_delete BEFORE DELETE ON approval_receipts BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER attempts_no_update BEFORE UPDATE ON attempt_receipts BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER attempts_no_delete BEFORE DELETE ON attempt_receipts BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER reservation_intents_no_update BEFORE UPDATE ON reservation_intent_receipts BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER reservation_intents_no_delete BEFORE DELETE ON reservation_intent_receipts BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER reservation_evidence_no_update BEFORE UPDATE ON reservation_evidence_receipts BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER reservation_evidence_no_delete BEFORE DELETE ON reservation_evidence_receipts BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER reservation_reconciliations_no_update BEFORE UPDATE ON reservation_reconciliation_receipts BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER reservation_reconciliations_no_delete BEFORE DELETE ON reservation_reconciliation_receipts BEGIN SELECT RAISE(ABORT,'append_only'); END;
    """)
    db.execute(f"PRAGMA application_id={APP_ID}")
    db.execute(f"PRAGMA user_version={SCHEMA}")

def check_report(report, mode):
    if not isinstance(report, dict) or report.get("mode") != mode or report.get("executionAllowed") is not False or report.get("budgetReserved") is not False:
        raise Reject("preview_only_required")

def operate(db, request):
    action = request.get("action")
    if action not in {"create", "revise", "recover", "approve_plan", "prepare_attempt", "prepare_reservation", "record_reservation", "mark_reservation_unknown", "reconcile_reservation", "stop", "get", "events"}:
        raise Reject("unsupported_action")
    unit = ident(request.get("unitId"))
    current = verify(db, unit)
    if action in {"get", "events"}:
        if current is None:
            raise Reject("not_found")
        if action == "get":
            return {"ok": True, "state": current, "replayed": False}
        after = number(request.get("afterVersion", 0))
        rows = db.execute("SELECT version, event_hash, command_id FROM events WHERE unit_id=? AND version>? ORDER BY version LIMIT 51", (unit, after)).fetchall()
        return {"ok": True, "events": [{"version": r[0], "hash": r[1], "commandId": r[2]} for r in rows[:50]], "hasMore": len(rows) > 50, "executionAllowed": False}
    command = ident(request.get("commandId"))
    request_hash = digest(request)
    receipt = db.execute("SELECT request_hash,response_json FROM commands WHERE command_id=?", (command,)).fetchone()
    if receipt:
        if receipt[0] != request_hash:
            raise Reject("idempotency_conflict")
        response = json.loads(receipt[1])
        response["replayed"] = True
        return response
    expected = number(request.get("expectedVersion"))
    payload = request.get("payload", {})
    if not isinstance(payload, dict):
        raise Reject("invalid_payload")
    if action == "create":
        if current:
            raise Reject("unit_exists")
        if expected != 0:
            raise Reject("version_conflict")
        if db.execute("SELECT count(*) FROM units").fetchone()[0] >= 100:
            raise Reject("local_unit_limit")
        plan, report = payload.get("plan"), payload.get("report")
        check_report(report, "offline_preflight")
        if not isinstance(plan, dict) or plan.get("unitId") != unit or report.get("unitId") != unit:
            raise Reject("unit_mismatch")
        if plan.get("revision") != 1 or report.get("revision") != 1:
            raise Reject("initial_revision_required")
        state = {"schemaVersion": 1, "unitId": unit, "version": 1, "state": "planned" if report.get("status") == "ready_for_review" else "blocked", "executionAllowed": False, "budgetReserved": False, "plan": plan, "planReport": report, "recovery": None, "approval": None, "attemptAuthorization": None, "reservationIntent": None, "reservationEvidence": None, "reservationOutcome": None, "reservationReconciliation": None, "unsuccessfulAttempts": 0, "confirmedMinor": 0, "financialUncertainty": False}
    else:
        if not current:
            raise Reject("not_found")
        if current["version"] != expected:
            raise Reject("version_conflict")
        if current["version"] >= 200:
            raise Reject("local_event_limit")
        if current["state"] == "stopped":
            raise Reject("terminal_state")
        state = dict(current)
        state["version"] += 1
        if action == "stop":
            state["state"] = "stopped"
            state["approval"] = None
            state["attemptAuthorization"] = None
            state["reservationIntent"] = None
            state["reservationEvidence"] = None
            state["reservationOutcome"] = None
            state["reservationReconciliation"] = None
        elif action == "revise":
            if current["financialUncertainty"]:
                raise Reject("reconciliation_required")
            plan, report = payload.get("plan"), payload.get("report")
            check_report(report, "offline_preflight")
            if not isinstance(plan, dict) or plan.get("unitId") != unit or report.get("unitId") != unit:
                raise Reject("unit_mismatch")
            if plan.get("revision") != current["plan"]["revision"] + 1 or report.get("revision") != plan.get("revision"):
                raise Reject("plan_revision_conflict")
            if encoded(plan.get("budget")) != encoded(current["plan"].get("budget")):
                raise Reject("budget_amendment_not_supported")
            state.update(plan=plan, planReport=report, recovery=None, approval=None, attemptAuthorization=None, reservationIntent=None, reservationEvidence=None, reservationOutcome=None, reservationReconciliation=None, state="planned" if report.get("status") == "ready_for_review" else "blocked")
        elif action == "approve_plan":
            approval, report = payload.get("approval"), payload.get("report")
            check_report(report, "offline_plan_approval")
            if not isinstance(approval, dict) or approval.get("unitId") != unit or report.get("unitId") != unit:
                raise Reject("unit_mismatch")
            if current["state"] != "planned" or current["financialUncertainty"] or current.get("recovery") is not None:
                raise Reject("plan_not_approvable")
            if approval.get("revision") != current["plan"].get("revision") or report.get("revision") != approval.get("revision"):
                raise Reject("plan_revision_conflict")
            if approval.get("admissionHash") != current["planReport"].get("admissionHash") or report.get("admissionHash") != approval.get("admissionHash"):
                raise Reject("admission_conflict")
            approval_id = ident(approval.get("approvalId"))
            used = db.execute("SELECT unit_id,admission_hash FROM approval_receipts WHERE approval_id=?", (approval_id,)).fetchone()
            if used:
                raise Reject("approval_reuse_conflict")
            state.update(approval={"input": approval, "report": report}, attemptAuthorization=None, reservationIntent=None, reservationEvidence=None, reservationOutcome=None, reservationReconciliation=None)
            db.execute("INSERT INTO approval_receipts VALUES(?,?,?,?)", (approval_id, unit, approval.get("admissionHash"), state["version"]))
        elif action == "prepare_attempt":
            attempt = payload.get("attempt")
            if not isinstance(attempt, dict) or attempt.get("unitId") != unit:
                raise Reject("unit_mismatch")
            if current["state"] != "planned" or current["financialUncertainty"] or current.get("recovery") is not None or not isinstance(current.get("approval"), dict):
                raise Reject("attempt_not_preparable")
            approval_report = current["approval"].get("report", {})
            attempt_id = ident(attempt.get("attemptId"));approval_id = ident(attempt.get("approvalId"))
            if attempt.get("revision") != current["plan"].get("revision") or attempt.get("admissionHash") != current["planReport"].get("admissionHash") or approval_id != approval_report.get("approvalId") or attempt.get("admissionHash") != approval_report.get("admissionHash"):
                raise Reject("attempt_binding_conflict")
            if db.execute("SELECT 1 FROM attempt_receipts WHERE attempt_id=? OR approval_id=?", (attempt_id, approval_id)).fetchone():
                raise Reject("attempt_or_approval_reuse")
            prepared={"schemaVersion":1,"mode":"offline_attempt_preparation","attemptId":attempt_id,"approvalId":approval_id,"unitId":unit,"revision":attempt.get("revision"),"admissionHash":attempt.get("admissionHash"),"executionAllowed":False,"budgetReserved":False,"preparedAt":datetime.datetime.now(datetime.timezone.utc).isoformat()}
            state["attemptAuthorization"] = prepared
            state["reservationIntent"] = None
            state["reservationEvidence"] = None
            state["reservationOutcome"] = None
            state["reservationReconciliation"] = None
            db.execute("INSERT INTO attempt_receipts VALUES(?,?,?,?,?)", (attempt_id, approval_id, unit, attempt.get("admissionHash"), state["version"]))
        elif action == "prepare_reservation":
            intent = payload.get("intent")
            if not isinstance(intent, dict) or intent.get("unitId") != unit or not isinstance(current.get("attemptAuthorization"), dict):
                raise Reject("reservation_not_preparable")
            attempt = current["attemptAuthorization"]
            intent_id=ident(intent.get("intentId"));attempt_id=ident(intent.get("attemptId"))
            if attempt_id != attempt.get("attemptId") or intent.get("admissionHash") != attempt.get("admissionHash") or intent.get("executionAllowed") is not False or intent.get("budgetReserved") is not False:
                raise Reject("reservation_binding_conflict")
            if db.execute("SELECT 1 FROM reservation_intent_receipts WHERE intent_id=? OR attempt_id=?", (intent_id, attempt_id)).fetchone():
                raise Reject("reservation_intent_reuse")
            outcome={"schemaVersion":1,"mode":"offline_reservation_outcome","status":"pending","intentId":intent_id,"intentHash":intent.get("intentHash"),"unitId":unit,"attemptId":attempt_id,"reservedMinor":None,"liabilityUpperBoundMinor":number(intent.get("initialMinor")),"productionVerified":False,"executionAllowed":False,"budgetReserved":False,"observedBy":"intent","updatedAt":datetime.datetime.now(datetime.timezone.utc).isoformat()}
            state.update(reservationIntent=intent,reservationEvidence=None,reservationOutcome=outcome,reservationReconciliation=None)
            db.execute("INSERT INTO reservation_intent_receipts VALUES(?,?,?,?,?)",(intent_id,attempt_id,unit,intent.get("intentHash"),state["version"]))
        elif action == "record_reservation":
            receipt, report = payload.get("receipt"), payload.get("report")
            if not isinstance(receipt, dict) or not isinstance(report, dict) or not isinstance(current.get("reservationIntent"), dict):
                raise Reject("reservation_evidence_not_recordable")
            intent=current["reservationIntent"]
            if receipt.get("unitId")!=unit or receipt.get("intentId")!=intent.get("intentId") or receipt.get("intentHash")!=intent.get("intentHash") or report.get("productionVerified") is not False or report.get("executionAllowed") is not False or report.get("budgetReserved") is not False:
                raise Reject("reservation_evidence_conflict")
            receipt_id=ident(receipt.get("receiptId"));intent_id=ident(receipt.get("intentId"))
            if db.execute("SELECT 1 FROM reservation_evidence_receipts WHERE receipt_id=? OR intent_id=?",(receipt_id,intent_id)).fetchone():
                raise Reject("reservation_evidence_reuse")
            state["reservationEvidence"]={"input":receipt,"report":report}
            state["reservationOutcome"]={"schemaVersion":1,"mode":"offline_reservation_outcome","status":"confirmed","intentId":intent_id,"intentHash":intent.get("intentHash"),"unitId":unit,"attemptId":intent.get("attemptId"),"reservedMinor":number(receipt.get("reservedMinor")),"liabilityUpperBoundMinor":number(receipt.get("reservedMinor")),"productionVerified":False,"executionAllowed":False,"budgetReserved":False,"observedBy":"local_receipt","updatedAt":datetime.datetime.now(datetime.timezone.utc).isoformat()}
            state["reservationReconciliation"]=None
            db.execute("INSERT INTO reservation_evidence_receipts VALUES(?,?,?,?)",(receipt_id,intent_id,receipt.get("intentHash"),state["version"]))
        elif action == "mark_reservation_unknown":
            outcome=payload.get("outcome");intent=current.get("reservationIntent");previous=current.get("reservationOutcome")
            if not isinstance(intent,dict) or not isinstance(previous,dict) or previous.get("status")=="released" or not isinstance(outcome,dict):
                raise Reject("reservation_unknown_not_recordable")
            if outcome.get("status")!="unknown" or outcome.get("intentId")!=intent.get("intentId") or outcome.get("intentHash")!=intent.get("intentHash") or outcome.get("unitId")!=unit or outcome.get("attemptId")!=intent.get("attemptId") or outcome.get("reservedMinor") is not None or outcome.get("liabilityUpperBoundMinor")!=intent.get("initialMinor") or outcome.get("observedBy")!="ambiguous_result" or outcome.get("productionVerified") is not False or outcome.get("executionAllowed") is not False or outcome.get("budgetReserved") is not False:
                raise Reject("reservation_unknown_conflict")
            state["reservationOutcome"]=outcome
            state["reservationReconciliation"]=None
        elif action == "reconcile_reservation":
            receipt,report=payload.get("receipt"),payload.get("report");intent=current.get("reservationIntent");evidence=current.get("reservationEvidence");outcome=current.get("reservationOutcome")
            if not isinstance(receipt,dict) or not isinstance(report,dict) or not isinstance(intent,dict) or not isinstance(evidence,dict) or not isinstance(outcome,dict) or outcome.get("status")!="unknown":
                raise Reject("reservation_reconciliation_not_recordable")
            evidence_report=evidence.get("report",{});rid=ident(receipt.get("reconciliationId"));receipt_id=ident(receipt.get("receiptId"));intent_id=ident(receipt.get("intentId"))
            if receipt_id!=evidence_report.get("receiptId") or intent_id!=intent.get("intentId") or receipt.get("intentHash")!=intent.get("intentHash") or receipt.get("unitId")!=unit or receipt.get("attemptId")!=intent.get("attemptId") or report.get("reconciliationId")!=rid or report.get("outcome")!=receipt.get("outcome") or report.get("productionVerified") is not False or report.get("executionAllowed") is not False or report.get("budgetReserved") is not False:
                raise Reject("reservation_reconciliation_conflict")
            if db.execute("SELECT 1 FROM reservation_reconciliation_receipts WHERE reconciliation_id=?",(rid,)).fetchone():
                raise Reject("reservation_reconciliation_reuse")
            status=report.get("outcome");liability=report.get("liabilityUpperBoundMinor");reserved=report.get("reservedMinor")
            if status=="released" and (reserved!=0 or liability!=0):raise Reject("reservation_reconciliation_conflict")
            if status=="confirmed" and (reserved!=intent.get("initialMinor") or liability!=intent.get("initialMinor")):raise Reject("reservation_reconciliation_conflict")
            if status in {"pending","unknown"} and (reserved is not None or liability!=intent.get("initialMinor")):raise Reject("reservation_reconciliation_conflict")
            state["reservationReconciliation"]={"input":receipt,"report":report}
            state["reservationOutcome"]={"schemaVersion":1,"mode":"offline_reservation_outcome","status":status,"intentId":intent_id,"intentHash":intent.get("intentHash"),"unitId":unit,"attemptId":intent.get("attemptId"),"reservedMinor":reserved,"liabilityUpperBoundMinor":liability,"productionVerified":False,"executionAllowed":False,"budgetReserved":False,"observedBy":report.get("method"),"updatedAt":report.get("observedAt")}
            db.execute("INSERT INTO reservation_reconciliation_receipts VALUES(?,?,?,?,?)",(rid,receipt_id,intent_id,status,state["version"]))
        elif action == "recover":
            recovery, report = payload.get("recovery"), payload.get("report")
            check_report(report, "offline_recovery")
            if not isinstance(recovery, dict) or recovery.get("unitId") != unit or report.get("unitId") != unit:
                raise Reject("unit_mismatch")
            if recovery.get("revision") != current["plan"]["revision"] or report.get("revision") != recovery.get("revision"):
                raise Reject("plan_revision_conflict")
            if encoded(recovery.get("budget")) != encoded(current["plan"].get("budget")):
                raise Reject("budget_amendment_not_supported")
            if current["financialUncertainty"] and recovery.get("defect") != "rights":
                raise Reject("reconciliation_required")
            attempts = number(recovery.get("unsuccessfulAttempts"))
            cost = number(recovery.get("confirmedMinor"))
            if attempts < current["unsuccessfulAttempts"] or cost < current["confirmedMinor"]:
                raise Reject("cumulative_counter_decrease")
            scene_ids = {s["id"] for s in current["plan"]["scenes"]}
            asset_ids = {a["id"] for a in current["plan"]["assets"]}
            if not set(recovery.get("affectedSceneIds", [])) <= scene_ids or not set(recovery.get("retainedAssetIds", [])) <= asset_ids:
                raise Reject("unknown_scene_or_asset")
            next_state = {"repair_proposed": "needs_user", "needs_user": "needs_user", "reconciling": "reconciling", "stopped": "stopped"}.get(report.get("state"))
            if next_state not in STATES:
                raise Reject("invalid_transition")
            uncertain = current["financialUncertainty"] or recovery.get("pendingUpperBoundMinor") is None or recovery.get("defect") == "unknown_paid"
            state.update(recovery={"input": recovery, "report": report}, approval=None, attemptAuthorization=None, reservationIntent=None, reservationEvidence=None, reservationOutcome=None, reservationReconciliation=None, state=next_state, unsuccessfulAttempts=attempts, confirmedMinor=cost, financialUncertainty=uncertain)
    state["updatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    previous = db.execute("SELECT event_hash FROM events WHERE unit_id=? ORDER BY version DESC LIMIT 1", (unit,)).fetchone()
    previous_hash = previous[0] if previous else "0" * 64
    event_hash = digest({"previous": previous_hash, "commandId": command, "state": state})
    text = encoded(state)
    response = {"ok": True, "state": state, "replayed": False}
    db.execute("INSERT INTO events VALUES(?,?,?,?,?,?)", (unit, state["version"], previous_hash, event_hash, text, command))
    db.execute("INSERT INTO units VALUES(?,?,?) ON CONFLICT(unit_id) DO UPDATE SET version=excluded.version,state_json=excluded.state_json", (unit, state["version"], text))
    db.execute("INSERT INTO commands VALUES(?,?,?)", (command, request_hash, encoded(response)))
    return response

def main():
    if len(sys.argv) != 2:
        raise Reject("database_path_required")
    raw = sys.stdin.buffer.read(MAX_REQUEST + 1)
    if len(raw) > MAX_REQUEST:
        raise Reject("request_too_large")
    request = json.loads(raw, parse_constant=lambda _: (_ for _ in ()).throw(Reject("nonfinite_json")))
    if not isinstance(request, dict):
        raise Reject("invalid_request")
    path = Path(sys.argv[1])
    if path.is_symlink() or (path.exists() and not path.is_file()):
        raise Reject("unsafe_database_path")
    new = not path.exists()
    if new and request.get("action") != "create":
        raise Reject("not_found")
    if new:
        path.parent.mkdir(parents=True, exist_ok=True)
        # A sibling exclusive lock prevents two simultaneous first-create initializations.
    lock = Path(str(path) + ".init-lock")
    fd = None
    if new:
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        except FileExistsError:
            raise Reject("initialization_busy")
    db = None
    try:
        # Recheck after initialization lock: another completed initializer may have created it.
        fresh = new and not path.exists()
        db = sqlite3.connect(path, timeout=3, isolation_level=None)
        db.execute("PRAGMA busy_timeout=3000")
        if fresh:
            db.execute("PRAGMA journal_mode=WAL")
            db.execute("PRAGMA synchronous=FULL")
            initialize(db)
        elif db.execute("PRAGMA application_id").fetchone()[0] != APP_ID or db.execute("PRAGMA user_version").fetchone()[0] != SCHEMA:
            raise Reject("unsupported_database")
        db.execute("PRAGMA synchronous=FULL")
        db.execute("BEGIN IMMEDIATE")
        try:
            result = operate(db, request)
            db.execute("COMMIT")
        except Exception:
            db.execute("ROLLBACK")
            raise
        print(encoded(result))
    finally:
        if db is not None:
            db.close()
        if fd is not None:
            os.close(fd)
            lock.unlink(missing_ok=True)

if __name__ == "__main__":
    try:
        main()
    except Reject as error:
        print(encoded({"ok": False, "code": str(error)}))
    except (ValueError, KeyError, TypeError):
        print(encoded({"ok": False, "code": "invalid_request"}))
    except sqlite3.Error:
        print(encoded({"ok": False, "code": "database_error"}))
    except OSError:
        print(encoded({"ok": False, "code": "filesystem_error"}))

