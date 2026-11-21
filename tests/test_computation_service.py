import pytest
from tools.computational_engine.service import compute, plan, answer


@pytest.mark.parametrize("name,n,d,expected", [
    ("demand_count", 1745, None, 1745), ("demand_share",1745,29587,5.90),
    ("recorded_share",1745,23528,7.42), ("mandatory_course_coverage",1,15,6.67),
    ("mandatory_credit_coverage",3,41,7.32)])
def test_verified_pilot_counts(name,n,d,expected):
    assert round(compute(name,n,d)["result"],2) == expected


def test_version_and_empty():
    with pytest.raises(ValueError):
        compute("demand_share",1,2,version="unknown")
    assert compute("demand_growth",1,0)["status"]=="not_computable"


def test_monthly_question():
    q="روند تقاضای پایتون در JobVision از 2023-01 تا 2023-02"
    assert plan(q)==("python",["2023-01","2023-02"])
    class Client:
        def search(self, **kwargs):
            assert kwargs["index"]=="job_postings_real"
            buckets={m:dict(doc_count=100,matched=dict(doc_count=n),missing=dict(doc_count=10))
                     for m,n in [("2023-01",10),("2023-02",15)]}
            return dict(timed_out=False,aggregations=dict(months=dict(buckets=buckets)))
    assert answer(Client(),q)["growth"]["percent"]==50
