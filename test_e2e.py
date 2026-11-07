import re
import socket
import subprocess
import sys
from pathlib import Path


# ============================================================
# NexusOps - Comprehensive End-to-End Test
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent
MAIN_FILE = PROJECT_ROOT / "llm_mcp_client.py"

MCP_HOST = "127.0.0.1"
MCP_PORT = 8000

TIMEOUT_SECONDS = 300


# ============================================================
# E2E TEST CASES
# ============================================================

TEST_CASES = [

    # --------------------------------------------------------
    # 1. Graduate Profile
    # --------------------------------------------------------
    {
        "name": "graduate_profile",
        "question": "اطلاعات فارغ‌التحصیلی G0001 چیست؟",

        "required": [
            "G0001",
            "Backend Developer",
            "1402",
            "Computer Engineering",
            "Software",
            "5",
            "4.5",
            "Python",
            "Django",
            "Git",
            "REST API",
            "Docker",
        ],

        "forbidden": [],
    },

    # --------------------------------------------------------
    # 2. Top 10 Skill Gaps
    # --------------------------------------------------------
    {
        "name": "top_10_skill_gaps",
        "question": "Top 10 مهارت با بیشترین شکاف دانشگاه و بازار چیست؟",

        "required": [
            "Kubernetes",
            "DevOps",
            "Docker",
            "Data Engineering",
            "Cloud Computing",
            "Deep Learning",
            "Git",
            "NLP",
            "REST API",
            "Distributed Systems",
        ],

        "forbidden": [
            "Cloud Architecture",
            "Microservices",
            "CI/CD",
            "Cybersecurity",
            "Full-Stack",
            "Network Engineering",
        ],
    },

    # --------------------------------------------------------
    # 3. Most Relevant Course + Tie
    # --------------------------------------------------------
    {
        "name": "graduate_course_tie",
        "question": "برای G0001 کدام درس بیشترین ارتباط را با شغل او داشته است؟",

        "required": [
            "طراحی الگوریتم",
            "برنامه‌سازی وب",
            "5.0",
            "C003",
            "C016",
        ],

        "forbidden": [],
    },

    # --------------------------------------------------------
    # 4. Top 5 Skill Gaps
    # --------------------------------------------------------
    {
        "name": "top_5_skill_gaps",
        "question": "۵ مهارت با بیشترین شکاف دانشگاه و بازار را بگو.",

        "required": [
            "Kubernetes",
            "DevOps",
            "Docker",
            "Data Engineering",
            "Cloud Computing",
        ],

        "forbidden": [
            "Cloud Architecture",
            "Microservices",
            "CI/CD",
        ],
    },

    # --------------------------------------------------------
    # 5. Unknown Graduate
    # --------------------------------------------------------
    {
        "name": "unknown_graduate",
        "question": "اطلاعات فارغ‌التحصیلی G9999 چیست؟",

        "required": [
        ],

        "forbidden": [
            "Backend Developer",
            "Computer Engineering",
            "1402",
            "G0001",
        ],
    },

    # --------------------------------------------------------
    # 6. Fresh Verification Repeat
    # --------------------------------------------------------
    {
        "name": "fresh_verification_repeat",
        "question": "اطلاعات فارغ‌التحصیلی G0001 چیست؟",

        "required": [
            "G0001",
            "Backend Developer",
            "Python",
        ],

        "forbidden": [],
    },
]


# ============================================================
# PRECHECK
# ============================================================

def check_mcp_port():
    print("=" * 72)
    print("PRECHECK: MCP SERVER")
    print("=" * 72)

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:

        sock.settimeout(3)

        result = sock.connect_ex(
            (
                MCP_HOST,
                MCP_PORT,
            )
        )

    if result != 0:

        raise RuntimeError(
            f"MCP server is not reachable at "
            f"{MCP_HOST}:{MCP_PORT}. "
            f"Start server.py first."
        )

    print(
        f"[PASS] TCP {MCP_HOST}:{MCP_PORT} is reachable."
    )

    print()


# ============================================================
# RUN MAIN APPLICATION
# ============================================================

def run_main():

    if not MAIN_FILE.exists():

        raise FileNotFoundError(
            f"Main application not found: {MAIN_FILE}"
        )

    input_text = (
        "\n".join(
            case["question"]
            for case in TEST_CASES
        )
        + "\n/exit\n"
    )

    print("=" * 72)
    print("E2E: STARTING NEXUSOPS")
    print("=" * 72)

    print(
        f"Main file: {MAIN_FILE}"
    )

    print(
        f"Test cases: {len(TEST_CASES)}"
    )

    print()

    completed = subprocess.run(

        [
            sys.executable,
            str(MAIN_FILE),
        ],

        input=input_text,

        capture_output=True,

        text=True,

        encoding="utf-8",

        errors="replace",

        cwd=str(PROJECT_ROOT),

        timeout=TIMEOUT_SECONDS,
    )

    output = (
        completed.stdout
        + "\n"
        + completed.stderr
    )

    print(
        f"Process exit code: "
        f"{completed.returncode}"
    )

    print()

    if completed.returncode != 0:

        print(output)

        raise RuntimeError(
            f"NexusOps exited with code "
            f"{completed.returncode}."
        )

    return output


# ============================================================
# EXTRACT ANSWER BLOCKS
# ============================================================

def extract_answer_blocks(output):

    blocks = []

    current = None

    for line in output.splitlines():

        if line.startswith("NexusOps:"):

            current = [
                line
            ]

            blocks.append(current)

        elif current is not None and line.startswith("You:"):

            current = None

        elif current is not None:

            current.append(line)

    return [
        "\n".join(block)
        for block in blocks
    ]


# ============================================================
# NUMBERED ITEMS
# ============================================================

def numbered_items(text):

    return [
        line.strip()

        for line in text.splitlines()

        if re.match(
            r"^\d+\.\s+",
            line.strip()
        )
    ]


# ============================================================
# ASSERTIONS
# ============================================================

def assert_contains(
    text,
    values,
    case_name,
):

    for value in values:

        if value not in text:

            raise AssertionError(
                f"[{case_name}] "
                f"Missing expected value: "
                f"{value!r}"
            )


def assert_not_contains(
    text,
    values,
    case_name,
):

    for value in values:

        if value in text:

            raise AssertionError(
                f"[{case_name}] "
                f"Unexpected value found: "
                f"{value!r}"
            )


# ============================================================
# CASE VALIDATION
# ============================================================

def validate_case(
    case,
    answer,
):

    name = case["name"]

    # --------------------------------------------------------
    # Required values
    # --------------------------------------------------------

    assert_contains(
        answer,
        case["required"],
        name,
    )

    # --------------------------------------------------------
    # Forbidden values
    # --------------------------------------------------------

    assert_not_contains(
        answer,
        case["forbidden"],
        name,
    )

    # --------------------------------------------------------
    # Top 10 Skill Gap Validation
    # --------------------------------------------------------

    if name == "top_10_skill_gaps":

        items = numbered_items(answer)

        if len(items) != 10:

            raise AssertionError(
                f"[{name}] "
                f"Expected exactly 10 ranking items, "
                f"found {len(items)}."
            )

        if not items[0].startswith(
            "1. Kubernetes"
        ):

            raise AssertionError(
                f"[{name}] "
                f"Rank 1 is not Kubernetes."
            )

        expected_order = [
            "Kubernetes",
            "DevOps",
            "Docker",
            "Data Engineering",
            "Cloud Computing",
            "Deep Learning",
            "Git",
            "NLP",
            "REST API",
            "Distributed Systems",
        ]

        for index, skill in enumerate(
            expected_order,
            start=1,
        ):

            if skill not in items[index - 1]:

                raise AssertionError(
                    f"[{name}] "
                    f"Expected {skill} at rank {index}, "
                    f"but received: "
                    f"{items[index - 1]}"
                )

    # --------------------------------------------------------
    # Top 5 Skill Gap Validation
    # --------------------------------------------------------

    elif name == "top_5_skill_gaps":

        items = numbered_items(answer)

        if len(items) != 5:

            raise AssertionError(
                f"[{name}] "
                f"Expected exactly 5 ranking items, "
                f"found {len(items)}."
            )

        expected_order = [
            "Kubernetes",
            "DevOps",
            "Docker",
            "Data Engineering",
            "Cloud Computing",
        ]

        for index, skill in enumerate(
            expected_order,
            start=1,
        ):

            if skill not in items[index - 1]:

                raise AssertionError(
                    f"[{name}] "
                    f"Expected {skill} at rank {index}, "
                    f"but received: "
                    f"{items[index - 1]}"
                )

    # --------------------------------------------------------
    # Graduate Course Tie
    # --------------------------------------------------------

    elif name == "graduate_course_tie":

        if "طراحی الگوریتم" not in answer:

            raise AssertionError(
                f"[{name}] "
                f"طراحی الگوریتم was omitted."
            )

        if "برنامه‌سازی وب" not in answer:

            raise AssertionError(
                f"[{name}] "
                f"برنامه‌سازی وب was omitted."
            )

        if "5.0" not in answer:

            raise AssertionError(
                f"[{name}] "
                f"course_relevance=5.0 "
                f"was not preserved."
            )

    # --------------------------------------------------------
    # Unknown Graduate
    # --------------------------------------------------------

    elif name == "unknown_graduate":

        lowered = answer.lower()

        refusal_markers = [

            "پیدا نشد",

            "وجود ندارد",

            "یافت نشد",

            "اطلاعاتی برای",

            "داده‌ای برای",

            "داده ای برای",

            "no result",

            "not found",

            "could not",

            "does not exist",
        ]

        if not any(
            marker in lowered
            for marker in refusal_markers
        ):

            raise AssertionError(
                f"[{name}] "
                f"Expected an explicit "
                f"no-data response."
            )


# ============================================================
# GLOBAL PIPELINE VALIDATION
# ============================================================

def validate_global_output(
    output,
    answers,
):

    print("=" * 72)
    print("GLOBAL E2E CHECKS")
    print("=" * 72)

    # --------------------------------------------------------
    # Required pipeline markers
    # --------------------------------------------------------

    required_markers = [

        "[Pipeline] "
        "Fresh MCP verification is mandatory.",

        "[Validator] "
        "MCP result accepted",

        "[Memory] "
        "Fresh MCP result stored as tool_verified.",

        "[Answer Layer] "
        "Deterministic answer generated.",
    ]

    for marker in required_markers:

        if marker not in output:

            raise AssertionError(
                f"Required pipeline marker "
                f"was not found: {marker}"
            )

    # --------------------------------------------------------
    # Fresh MCP count
    # --------------------------------------------------------

    fresh_count = output.count(
        "[Pipeline] "
        "Fresh MCP verification is mandatory."
    )

    if fresh_count < 5:

        raise AssertionError(
            "Expected fresh MCP verification "
            "for the structured E2E cases; "
            f"observed only {fresh_count}."
        )

    # --------------------------------------------------------
    # Answer count
    # --------------------------------------------------------

    if len(answers) < len(TEST_CASES):

        raise AssertionError(
            f"Expected {len(TEST_CASES)} "
            f"answers, found {len(answers)}."
        )

    print(
        "[PASS] "
        "Fresh MCP verification observed."
    )

    print(
        "[PASS] "
        "MCP Validator acceptance observed."
    )

    print(
        "[PASS] "
        "tool_verified memory storage observed."
    )

    print(
        "[PASS] "
        "Deterministic Answer Layer observed."
    )

    print(
        f"[PASS] "
        f"Fresh MCP verification count: "
        f"{fresh_count}"
    )

    print()


# ============================================================
# MAIN E2E RUNNER
# ============================================================

def main():

    print()

    print("#" * 72)

    print(
        "# NexusOps Comprehensive End-to-End Test"
    )

    print("#" * 72)

    print()

    try:

        # ----------------------------------------------------
        # PRECHECK
        # ----------------------------------------------------

        check_mcp_port()

        # ----------------------------------------------------
        # RUN APPLICATION
        # ----------------------------------------------------

        output = run_main()

        # ----------------------------------------------------
        # EXTRACT ANSWERS
        # ----------------------------------------------------

        answers = extract_answer_blocks(
            output
        )

        # ----------------------------------------------------
        # CASE RESULTS
        # ----------------------------------------------------

        print("=" * 72)

        print(
            "TEST CASE RESULTS"
        )

        print("=" * 72)

        passed = 0

        for index, case in enumerate(
            TEST_CASES
        ):

            name = case["name"]

            if index >= len(answers):

                print(
                    f"[FAIL] "
                    f"{index + 1:02d} - "
                    f"{name}"
                )

                print(
                    "       "
                    "No answer block was produced."
                )

                continue

            answer = answers[index]

            try:

                validate_case(
                    case,
                    answer,
                )

                print(
                    f"[PASS] "
                    f"{index + 1:02d} - "
                    f"{name}"
                )

                passed += 1

            except Exception as exc:

                print(
                    f"[FAIL] "
                    f"{index + 1:02d} - "
                    f"{name}"
                )

                print(
                    f"       {exc}"
                )

                print()

                print(
                    "Answer received:"
                )

                print(answer)

                print()

        # ----------------------------------------------------
        # GLOBAL CHECKS
        # ----------------------------------------------------

        validate_global_output(
            output,
            answers,
        )

        # ----------------------------------------------------
        # FINAL RESULT
        # ----------------------------------------------------

        print("=" * 72)

        print(
            f"E2E RESULT: "
            f"{passed}/{len(TEST_CASES)} "
            f"CASES PASSED"
        )

        print("=" * 72)

        if passed != len(TEST_CASES):

            print()

            print(
                "E2E FAILED."
            )

            print(
                "Do not move to the next "
                "architecture phase yet."
            )

            return 1

        print()

        print(
            "E2E PASSED."
        )

        print(
            "The current NexusOps pipeline "
            "passed the complete E2E suite."
        )

        return 0

    # --------------------------------------------------------
    # TIMEOUT
    # --------------------------------------------------------

    except subprocess.TimeoutExpired:

        print()

        print("=" * 72)

        print(
            "E2E FAILED: TIMEOUT"
        )

        print("=" * 72)

        print(
            f"NexusOps did not finish "
            f"within {TIMEOUT_SECONDS} seconds."
        )

        return 2

    # --------------------------------------------------------
    # GENERAL FAILURE
    # --------------------------------------------------------

    except Exception as exc:

        print()

        print("=" * 72)

        print(
            "E2E FAILED"
        )

        print("=" * 72)

        print(
            type(exc).__name__
            + ": "
            + str(exc)
        )

        return 3


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    raise SystemExit(
        main()
    )