"""Reviewed exact aliases shared by ingestion and historical evidence reads."""
import unicodedata

ALIAS_VERSION = "2.0.0"
PERSIAN_CHARACTERS = str.maketrans({"ي": "ی", "ك": "ک", "\u200c": " "})

ALIASES = {
    "system verilog": "systemverilog", "systemverilog hdl": "systemverilog",
    "system-verilog": "systemverilog", "سیستم وریلاگ": "systemverilog",
    "سیستم وریلوگ": "systemverilog", "وریلاگ": "verilog", "وریلوگ": "verilog",
    "وی اچ دی ال": "vhdl", "vhsic hardware description language": "vhdl",
    "متلب": "matlab", "مت لب": "matlab",
    "اف پی جی ای": "fpga", "آرایه گیت برنامه پذیر میدانی": "fpga",
    "assembly": "assembly-language", "assembly language": "assembly-language",
    "assembly programming": "assembly-language", "زبان اسمبلی": "assembly-language",
    "پایتون": "python", "python programming": "python", "python programming language": "python",
    "fpgas": "fpga", "field programmable gate array": "fpga", "field-programmable gate array": "fpga",
    "field programmable gate arrays": "fpga", "field-programmable gate arrays": "fpga",
    "regular expressions": "regular-expressions", "finite state machines": "finite-state-machines",
    "boolean logic": "boolean-logic",
}


def canonical(label):
    key = " ".join(unicodedata.normalize("NFKC", label).casefold().translate(PERSIAN_CHARACTERS).split())
    return ALIASES.get(key, key)
