"""Reviewed exact aliases shared by ingestion and historical evidence reads."""
import unicodedata

ALIASES = {
    "system verilog": "systemverilog", "systemverilog hdl": "systemverilog",
    "assembly": "assembly-language", "assembly language": "assembly-language",
    "assembly programming": "assembly-language", "زبان اسمبلی": "assembly-language",
    "پایتون": "python", "python programming": "python", "python programming language": "python",
    "field programmable gate array": "fpga", "field-programmable gate array": "fpga",
    "regular expressions": "regular-expressions", "finite state machines": "finite-state-machines",
    "boolean logic": "boolean-logic",
}


def canonical(label):
    key = " ".join(unicodedata.normalize("NFKC", label).casefold().split())
    return ALIASES.get(key, key)
