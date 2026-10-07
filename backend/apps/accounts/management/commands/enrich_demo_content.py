"""Enrich existing demo advertisements/news with realistic FPSC content."""
from __future__ import annotations

from datetime import date, timedelta

from django.core.management.base import BaseCommand

from apps.cms.models import NewsItem, Page
from apps.gr.models import Advertisement


GR_HTML = """
<p><strong>Federal Public Service Commission</strong><br/>
Aga Khan Road, F-5/1, Islamabad</p>
<p><strong>Consolidated Advertisement No. 04/2026</strong></p>
<p>Applications are invited online from Pakistani nationals for the following post(s). 
Candidates must apply through the FPSC Candidate Portal before the closing date.</p>
<table>
  <thead>
    <tr><th>Case No.</th><th>Post</th><th>BPS</th><th>Vacancies</th><th>Ministry / Dept.</th><th>Age</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>F.4-110/2026-R</td>
      <td>Assistant Director (IT)</td>
      <td>17</td>
      <td>05</td>
      <td>Ministry of IT &amp; Telecom / NTC</td>
      <td>22–30 years + general relaxation</td>
    </tr>
    <tr>
      <td>F.4-111/2026-R</td>
      <td>Assistant Director (Admin)</td>
      <td>17</td>
      <td>03</td>
      <td>Cabinet Division</td>
      <td>22–30 years + general relaxation</td>
    </tr>
  </tbody>
</table>
<p><strong>Minimum qualification:</strong> Second Class or Grade “C” Master’s / Bachelor’s (16 years)
in Computer Science / IT / Software Engineering or equivalent from an HEC-recognized university.</p>
<ul>
  <li>Apply online; no hard-copy applications except where Commission permits.</li>
  <li>Prescribed fee must be deposited through the portal payment gateway.</li>
  <li>Original documents will be scrutinized before interview (GR-1.7).</li>
  <li>Test may be conducted via Computer-Based Testing (CBT) where applicable.</li>
</ul>
<p><em>Closing date for online applications: as shown on this notice. Late applications will not be entertained.</em></p>
"""

MPT_HTML = """
<p><strong>Federal Public Service Commission</strong></p>
<p><strong>Mandatory Preliminary Test (MPT) — CSS Competitive Examination 2026</strong></p>
<p>Advance public notice for candidates intending to appear in CSS-2026. The MPT shall be
conducted at designated CBT centres (Islamabad, Lahore, Karachi, Peshawar, Quetta, and others).</p>
<ul>
  <li>Register / update candidate profile with CNIC, education, and preferred centre.</li>
  <li>Submit online application and fee before the closing date.</li>
  <li>Download admission certificate from the portal after roll-number allotment.</li>
  <li>Bring original CNIC on exam day; biometric verification will be performed.</li>
</ul>
<p>Syllabus and rules are available under CE Wing notices. Only MPT-qualified candidates
proceed to the written CSS examination stages.</p>
"""

FPOE_HTML = """
<p><strong>Final Passing Out Examination (FPOE) — 2026 Cycle</strong></p>
<p>Configurable UEM examination for probationary officers. Online registration, document
submission, and centre allocation will be managed through the Unified Examination Module.</p>
"""


class Command(BaseCommand):
    help = "Refresh advertisements and CMS content with realistic FPSC notices"

    def handle(self, *args, **options):
        today = date.today()
        ad, _ = Advertisement.objects.update_or_create(
            ref_number="CONSOLIDATED-AD-04-2026",
            defaults={
                "title": "Consolidated Advertisement No. 04/2026 — Multiple Posts (BPS-17)",
                "kind": Advertisement.Kind.GR,
                "consolidated_html": GR_HTML,
                "publish_date": today - timedelta(days=10),
                "close_date": today + timedelta(days=20),
                "is_published": True,
                "fee_amount": 500,
            },
        )
        Advertisement.objects.update_or_create(
            ref_number="MPT-2026",
            defaults={
                "title": "Mandatory Preliminary Test (MPT) for CSS Competitive Examination 2026",
                "kind": Advertisement.Kind.CE,
                "consolidated_html": MPT_HTML,
                "publish_date": today - timedelta(days=5),
                "close_date": today + timedelta(days=15),
                "is_published": True,
                "fee_amount": 1000,
            },
        )
        Advertisement.objects.update_or_create(
            ref_number="FPOE-2026-01",
            defaults={
                "title": "Final Passing Out Examination (FPOE) — Schedule & Online Registration",
                "kind": Advertisement.Kind.UEM,
                "consolidated_html": FPOE_HTML,
                "publish_date": today - timedelta(days=2),
                "close_date": today + timedelta(days=30),
                "is_published": True,
                "fee_amount": 800,
            },
        )
        Advertisement.objects.update_or_create(
            ref_number="CONSOLIDATED-AD-05-2026",
            defaults={
                "title": "Consolidated Advertisement No. 05/2026 — Section Officer & Allied Posts",
                "kind": Advertisement.Kind.GR,
                "consolidated_html": (
                    "<p><strong>Consolidated Advertisement No. 05/2026</strong></p>"
                    "<p>Applications invited for Section Officer (BPS-17) and Research Officer "
                    "(BPS-17) against various ministries. Detailed case-wise conditions are "
                    "available after login. Fee Rs. 500. Online only.</p>"
                    "<ul><li>All Pakistan domicile</li><li>Written MCQ + interview</li>"
                    "<li>Quota roster as per Federal Government policy</li></ul>"
                ),
                "publish_date": today - timedelta(days=1),
                "close_date": today + timedelta(days=25),
                "is_published": True,
                "fee_amount": 500,
            },
        )

        NewsItem.objects.update_or_create(
            slug="ad-04-2026",
            defaults={
                "title": "Consolidated Advertisement No. 04/2026 Published",
                "category": NewsItem.Category.AD,
                "summary": "Assistant Director (IT)/(Admin) and other posts — apply online before closing date.",
                "body": "FPSC has published Consolidated Advertisement 04/2026. Candidates must apply via the portal.",
                "is_published": True,
            },
        )
        NewsItem.objects.update_or_create(
            slug="css-mpt-2026",
            defaults={
                "title": "CSS 2026 MPT — Centres & Admit Cards",
                "category": NewsItem.Category.NOTICE,
                "summary": "MPT will be delivered on CBT. Download admit cards from Candidate Portal.",
                "body": "Centres include Islamabad CBT Lab and provincial sites. Biometric verification on exam day.",
                "is_published": True,
            },
        )
        NewsItem.objects.update_or_create(
            slug="cbt-pilot-islamabad",
            defaults={
                "title": "CBT Pilot Sitting — Islamabad (Demo)",
                "category": NewsItem.Category.NOTICE,
                "summary": "Demo sitting is LIVE for enrolled candidates (candidate1 / candidate2).",
                "body": "Use CBT login after portal authentication to attempt the seeded MPT demo paper.",
                "is_published": True,
            },
        )
        Page.objects.update_or_create(
            slug="about",
            defaults={
                "title": "About FPSC",
                "body": (
                    "The Federal Public Service Commission (FPSC), established under Article 242 "
                    "of the Constitution of Pakistan, conducts tests and examinations for "
                    "recruitment to Federal Services and civil posts. Headquarters: Aga Khan Road, "
                    "F-5/1, Islamabad. Provincial Offices: Karachi, Lahore, Peshawar, Quetta."
                ),
                "is_published": True,
            },
        )
        self.stdout.write(self.style.SUCCESS(f"Enriched ads/news (primary GR ad id={ad.pk})"))
