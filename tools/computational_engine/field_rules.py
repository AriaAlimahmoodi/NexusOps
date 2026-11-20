"""Evaluate ordered, declarative field derivations on one input record."""
import json
import math

from tools.computational_engine.skill_ids import canonical


def evaluate_rule(record, rule):
    values = [record[name] for name in rule["inputs"]]
    op = rule["op"]
    if op in {"labels", "raw_labels", "canonical_labels"}:
        value, = values
        items = json.loads(value) if isinstance(value, str) and value.strip() else value
        if items is None or items == "":
            return []
        if not isinstance(items, list):
            raise ValueError("labels requires an array")
        labels = []
        for item in items:
            label = item[rule["key"]] if "key" in rule else item
            if not isinstance(label, str) or not label.strip():
                raise ValueError("Invalid skill or category label")
            if op == "raw_labels":
                labels.append(label)
            elif op == "canonical_labels":
                labels.append(canonical(label))
            else:
                labels.append(label.strip().casefold())
        return list(dict.fromkeys(labels))
    if op == "count":
        items, = values
        if not isinstance(items, list):
            raise ValueError("count requires an array")
        return len(items)
    if op not in {"difference", "ratio", "percentage"}:
        raise ValueError(f"Unknown computation: {op}")
    left, right = values
    if left in (None, "") or right in (None, ""):
        return None
    left, right = float(left), float(right)
    if not all(map(math.isfinite, (left, right))):
        raise ValueError("Non-finite computation input")
    if op == "difference":
        return left - right
    if right == 0:
        return None
    return left / right * (100 if op == "percentage" else 1)
