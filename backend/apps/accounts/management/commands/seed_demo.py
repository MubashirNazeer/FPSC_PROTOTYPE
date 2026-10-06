"""Seed demo data for FPSC MVP walkthrough."""
from __future__ import annotations

from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import CandidateProfile, Role, Wing
from apps.cbt.models import ExamSitting
from apps.cbt.services import enroll_candidate, go_live
from apps.ce.models import CECandidateProgress, CompetitiveExamCycle, ExaminerPanel
from apps.ce.services import create_cycle
from apps.cms.models import NewsItem, Page, SiteSetting
from apps.gr.models import Advertisement, ExamCentre, Requisition
from apps.gr.services import (
    assign_roll_and_admit,
    create_requisition,
    pay_application_fee,
    submit_application,
)
from apps.qdbms.models import PaperBlueprint, Question, TaxonomyNode
from apps.qdbms.services import dual_authorize_paper, generate_paper
from apps.supporting.models import DutyAssignment, InventoryItem, LibraryItem, TransportDispatch
from apps.uem.models import ExamType, UEMExamInstance
from apps.workflow.services import ensure_workflow, start_case

User = get_user_model()

DEMO_PASSWORD = "Fpsc@2026"


class Command(BaseCommand):
    help = "Seed FPSC demo users, workflows, GR/CE/UEM/QDB/CBT data"

    def handle(self, *args, **options):
        if User.objects.filter(username="admin").exists():
            self.stdout.write(self.style.WARNING("Demo data already present — skipping."))
            return
        self._wings_roles()
        self._workflows()
        users = self._users()
        centres = self._centres()
        req, ad = self._gr(users)
        self._ce(users, ad)
        self._uem(users)
        paper = self._qdb(users)
        self._cbt(users, paper, centres, ad)
        self._cms()
        self._supporting(users, centres)
        self.stdout.write(self.style.SUCCESS("Demo seed complete. Password for all: Fpsc@2026"))

    def _wings_roles(self):
        wings = [
            ("T_AND_S", "Tests & Secrecy Coordination"),
            ("R_AND_R", "Recruitment Rules"),
            ("CR_AND_C", "Curriculum & Research"),
            ("SECRECY", "Secrecy Wing"),
            ("CE", "Competitive Examination"),
            ("FS", "Facilitation Services"),
            ("IT", "IT Wing"),
            ("PROGRAM", "Program Management"),
            ("HR", "Human Resource"),
            ("LOGISTICS", "Logistics"),
            ("COMMISSION", "Commission"),
        ]
        for code, name in wings:
            Wing.objects.get_or_create(code=code, defaults={"name": name})

        roles = [
            ("ADMIN", "System Administrator", True),
            ("T_AND_S", "T&S Officer", True),
            ("R_AND_R", "R&R Officer", True),
            ("COMMISSION", "Commission Member", True),
            ("CR_AND_C", "CR&C Officer", True),
            ("SECRECY", "Secrecy Officer", True),
            ("CE", "CE Officer", True),
            ("FS", "FS Officer", True),
            ("IT", "IT Officer", True),
            ("PROGRAM", "Program Officer", True),
            ("HR", "HR Officer", True),
            ("LOGISTICS", "Logistics Officer", True),
            ("AUTHOR", "Question Author", True),
            ("REVIEWER", "Question Reviewer", True),
            ("APPROVER", "Question Approver", True),
            ("INVIGILATOR", "Invigilator", True),
            ("CANDIDATE", "Candidate", False),
        ]
        for code, name, staff in roles:
            Role.objects.get_or_create(
                code=code, defaults={"name": name, "is_staff_role": staff}
            )

    def _workflows(self):
        ensure_workflow(
            "GR_LIFECYCLE",
            "General Recruitment Lifecycle",
            "GR",
            [
                ("REQ_RECEIVED", "Requisition Received", "T_AND_S"),
                ("RR_CHECK", "R&R Verification", "R_AND_R"),
                ("COMMISSION", "Commission Approval", "COMMISSION"),
                ("SYLLABUS", "Syllabus Preparation", "CR_AND_C"),
                ("ADVERTISED", "Advertised", "FS"),
                ("APPLICATIONS", "Applications", "IT"),
                ("PRE_EXAM", "Pre-Exam", "T_AND_S"),
                ("EXAM", "Exam Conduct", "SECRECY"),
                ("RESULT", "Result", "SECRECY"),
                ("SCRUTINY", "Scrutiny/Interview", "PROGRAM"),
                ("NOMINATION", "Nomination", "COMMISSION"),
                ("CLOSED", "Closed", "IT"),
            ],
        )
        ensure_workflow(
            "CE_LIFECYCLE",
            "CSS Competitive Examination",
            "CE",
            [
                ("PAPER_PREP", "Paper Preparation", "SECRECY"),
                ("MPT_AD", "MPT Advertisement", "CE"),
                ("MPT_APPS", "MPT Applications", "IT"),
                ("MPT_EXAM", "MPT Exam", "SECRECY"),
                ("WRITTEN", "Written Exam", "SECRECY"),
                ("PSYCH", "Psychological Assessment", "PROGRAM"),
                ("MEDICAL", "Medical", "PROGRAM"),
                ("VIVA", "Viva Voce", "COMMISSION"),
                ("ALLOCATION", "Group Allocation", "CE"),
                ("CLOSED", "Closed", "IT"),
            ],
        )
        ensure_workflow(
            "UEM_GENERIC",
            "UEM Generic Engine",
            "UEM",
            [
                ("START", "Started", "IT"),
                ("MID", "In Progress", "IT"),
                ("END", "Completed", "IT"),
            ],
        )

    def _users(self) -> dict:
        mapping = {
            "admin": ("ADMIN", "IT", True, True),
            "ts.officer": ("T_AND_S", "T_AND_S", True, False),
            "rr.officer": ("R_AND_R", "R_AND_R", True, False),
            "commission": ("COMMISSION", "COMMISSION", True, False),
            "crc.officer": ("CR_AND_C", "CR_AND_C", True, False),
            "secrecy": ("SECRECY", "SECRECY", True, False),
            "ce.officer": ("CE", "CE", True, False),
            "fs.officer": ("FS", "FS", True, False),
            "it.officer": ("IT", "IT", True, False),
            "program": ("PROGRAM", "PROGRAM", True, False),
            "hr.officer": ("HR", "HR", True, False),
            "logistics": ("LOGISTICS", "LOGISTICS", True, False),
            "author": ("AUTHOR", "SECRECY", True, False),
            "reviewer": ("REVIEWER", "SECRECY", True, False),
            "approver": ("APPROVER", "SECRECY", True, False),
            "invigilator": ("INVIGILATOR", "HR", True, False),
            "candidate1": ("CANDIDATE", None, False, False),
            "candidate2": ("CANDIDATE", None, False, False),
        }
        users = {}
        for username, (role_code, wing_code, is_staff, is_super) in mapping.items():
            wing = Wing.objects.filter(code=wing_code).first() if wing_code else None
            user = User.objects.create_user(
                username=username,
                email=f"{username}@fpsc.gov.pk",
                password=DEMO_PASSWORD,
                first_name=username.split(".")[0].title(),
                last_name="Demo",
                is_staff=is_staff,
                is_superuser=is_super,
                wing=wing,
                cnic=f"37405-{abs(hash(username)) % 10000000:07d}-1"[:15],
                phone="03001234567",
            )
            user.roles.add(Role.objects.get(code=role_code))
            if role_code == "CANDIDATE":
                CandidateProfile.objects.create(
                    user=user,
                    father_name="Demo Father",
                    domicile="Punjab",
                    province="Punjab",
                    education_summary="BS Computer Science",
                    experience_summary="2 years public sector",
                    quota="Open Merit",
                )
            users[username] = user
        # multi-role for approver
        users["approver"].roles.add(Role.objects.get(code="SECRECY"))
        users["reviewer"].roles.add(Role.objects.get(code="AUTHOR"))
        return users

    def _centres(self):
        data = [
            ("ISB", "Islamabad CBT Lab", "Islamabad", 250),
            ("LHR", "Lahore Centre", "Lahore", 200),
            ("KHI", "Karachi Centre", "Karachi", 200),
            ("PEW", "Peshawar Centre", "Peshawar", 150),
            ("QTA", "Quetta Edge Site", "Quetta", 100),
        ]
        centres = []
        for code, name, city, cap in data:
            c, _ = ExamCentre.objects.get_or_create(
                code=code,
                defaults={"name": name, "city": city, "capacity": cap, "address": city},
            )
            centres.append(c)
        return centres

    def _gr(self, users):
        req = create_requisition(
            data={
                "case_number": "F.4-110/2026-R",
                "ministry": "Ministry of IT & Telecom",
                "department": "NTC",
                "post_title": "Assistant Director (IT)",
                "bps": 17,
                "vacancies": 5,
                "domicile_required": "All Pakistan",
                "quota_notes": "Open merit + provincial quotas",
                "syllabus_mcq": "IT fundamentals, networking, databases",
                "received_at": date.today() - timedelta(days=40),
                "status": Requisition.Status.DRAFT,
            },
            user=users["ts.officer"],
        )
        # Advance a few steps
        from apps.gr.services import advance_requisition

        for _ in range(5):
            advance_requisition(requisition=req, user=users["admin"], note="Seed advance")
            req.refresh_from_db()

        completed = create_requisition(
            data={
                "case_number": "F.4-88/2025-R",
                "ministry": "Cabinet Division",
                "department": "Cabinet",
                "post_title": "Section Officer",
                "bps": 17,
                "vacancies": 2,
                "domicile_required": "Punjab",
                "received_at": date.today() - timedelta(days=200),
                "status": Requisition.Status.DRAFT,
            },
            user=users["ts.officer"],
        )
        for _ in range(11):
            advance_requisition(
                requisition=completed, user=users["admin"], note="Seed complete"
            )
            completed.refresh_from_db()

        ad = Advertisement.objects.create(
            ref_number="CONSOLIDATED-AD-04-2026",
            title="Consolidated Advertisement No. 04/2026",
            kind=Advertisement.Kind.GR,
            consolidated_html="<p>Applications invited for Assistant Director (IT) BPS-17.</p>",
            publish_date=date.today() - timedelta(days=10),
            close_date=date.today() + timedelta(days=20),
            is_published=True,
            fee_amount=500,
        )
        ad.requisitions.add(req)

        app = submit_application(
            candidate=users["candidate1"],
            advertisement_id=ad.pk,
            requisition_id=req.pk,
            documents={"cnic": "uploaded", "degree": "uploaded"},
        )
        pay_application_fee(application=app, user=users["candidate1"])
        assign_roll_and_admit(application=app)

        app2 = submit_application(
            candidate=users["candidate2"],
            advertisement_id=ad.pk,
            requisition_id=req.pk,
        )
        pay_application_fee(application=app2, user=users["candidate2"])
        assign_roll_and_admit(application=app2)
        return req, ad

    def _ce(self, users, ad):
        cycle = create_cycle(year=2026, title="CSS Competitive Examination 2026", user=users["ce.officer"])
        ExaminerPanel.objects.create(
            cycle=cycle,
            subject="English Essay",
            examiners=[{"name": "Dr. A. Khan"}, {"name": "Prof. S. Ahmed"}],
            commission_approved=True,
            approved_at=timezone.now(),
        )
        CECandidateProgress.objects.create(
            cycle=cycle,
            candidate=users["candidate1"],
            mpt_passed=True,
            written_marks={"essay": 70, "english": 65},
            psych_status="CLEARED",
            medical_status="FIT",
            viva_marks=80,
            final_merit=1,
        )
        mpt_ad = Advertisement.objects.create(
            ref_number="MPT-2026",
            title="Mandatory Preliminary Test 2026",
            kind=Advertisement.Kind.CE,
            publish_date=date.today() - timedelta(days=5),
            close_date=date.today() + timedelta(days=15),
            is_published=True,
            fee_amount=1000,
            consolidated_html="<p>MPT for CSS 2026</p>",
        )
        cycle.mpt_advertisement = mpt_ad
        cycle.save(update_fields=["mpt_advertisement"])

    def _uem(self, users):
        for code, name, stages in [
            ("FPOE", "Final Passing Out Examination", ["REQUISITION", "AD", "APPLY", "EXAM", "RESULT"]),
            ("SOPE", "Section Officers Promotional Exam", ["AD", "APPLY", "EXAM", "VIVA", "RESULT"]),
            ("CIVIL_JUDGES", "Civil Judges Examination", ["AD", "APPLY", "EXAM", "INTERVIEW", "RESULT"]),
        ]:
            et, _ = ExamType.objects.get_or_create(
                code=code, defaults={"name": name, "stages": stages}
            )
            inst = UEMExamInstance.objects.create(
                exam_type=et,
                title=f"{name} 2026",
                current_stage=stages[0],
            )
            inst.case = start_case(
                workflow_code="UEM_GENERIC",
                reference_type="UEMExamInstance",
                reference_id=inst.pk,
                title=inst.title,
                created_by=users["it.officer"],
            )
            inst.save(update_fields=["case"])

    def _qdb(self, users):
        root, _ = TaxonomyNode.objects.get_or_create(
            code="GEN", defaults={"name": "General Knowledge", "level": 0}
        )
        subjects = [
            ("GK-PAK", "Pakistan Affairs", root),
            ("GK-ISL", "Islamic Studies", root),
            ("GK-ENG", "English", root),
            ("GK-IT", "Information Technology", root),
        ]
        tax = {}
        for code, name, parent in subjects:
            n, _ = TaxonomyNode.objects.get_or_create(
                code=code, defaults={"name": name, "parent": parent, "level": 1}
            )
            tax[code] = n

        stems = [
            ("The capital of Pakistan is?", "Islamabad", "Lahore", "Karachi", "Peshawar", "A", "GK-PAK", 2),
            ("Quaid-e-Azam was born in?", "1876", "1890", "1901", "1857", "A", "GK-PAK", 3),
            ("Largest province by area?", "Balochistan", "Punjab", "Sindh", "KP", "A", "GK-PAK", 2),
            ("National poet of Pakistan?", "Allama Iqbal", "Ghalib", "Faiz", "Mir", "A", "GK-PAK", 1),
            ("Objective Resolution passed in?", "1949", "1947", "1956", "1973", "A", "GK-PAK", 4),
            ("First pillar of Islam?", "Shahada", "Salah", "Zakat", "Hajj", "A", "GK-ISL", 1),
            ("Holy book of Islam?", "Quran", "Bible", "Torah", "Vedas", "A", "GK-ISL", 1),
            ("Synonym of 'rapid'?", "Quick", "Slow", "Late", "Dull", "A", "GK-ENG", 2),
            ("Antonym of 'scarce'?", "Abundant", "Rare", "Few", "Little", "A", "GK-ENG", 3),
            ("HTTP stands for?", "HyperText Transfer Protocol", "High Transfer", "Host Text", "Hyper Tool", "A", "GK-IT", 2),
            ("Primary key uniquely identifies?", "Row", "Column", "Database", "Server", "A", "GK-IT", 3),
            ("RAM is a type of?", "Volatile memory", "Permanent storage", "Printer", "Protocol", "A", "GK-IT", 2),
            ("CPU stands for?", "Central Processing Unit", "Computer Personal Unit", "Control Process", "Core Power", "A", "GK-IT", 1),
            ("SQL used for?", "Databases", "Graphics", "Networking only", "Audio", "A", "GK-IT", 2),
            ("OSI model layers?", "7", "5", "4", "9", "A", "GK-IT", 4),
            ("Constitution of Pakistan year?", "1973", "1956", "1962", "1947", "A", "GK-PAK", 3),
            ("Indus river ends in?", "Arabian Sea", "Bay of Bengal", "Caspian", "Red Sea", "A", "GK-PAK", 3),
            ("Passive voice of 'He writes'?", "Is written by him", "Was write", "Wrote", "Writing", "A", "GK-ENG", 3),
            ("Zakat percentage?", "2.5%", "5%", "10%", "1%", "A", "GK-ISL", 2),
            ("Binary of 2?", "10", "11", "01", "00", "A", "GK-IT", 2),
        ]
        # Expand to 200+ by variations
        created_qs = []
        for i in range(12):
            for stem, a, b, c, d, correct, tax_code, diff in stems:
                q = Question.objects.create(
                    stem=f"{stem} (Set {i+1})",
                    qtype=Question.QType.MCQ_SINGLE,
                    options=[
                        {"key": "A", "text": a},
                        {"key": "B", "text": b},
                        {"key": "C", "text": c},
                        {"key": "D", "text": d},
                    ],
                    correct_answer={"key": correct},
                    taxonomy=tax[tax_code],
                    difficulty=diff,
                    status=Question.Status.ACTIVE,
                    author=users["author"],
                    reviewer=users["reviewer"],
                    approver=users["approver"],
                )
                created_qs.append(q)

        bp = PaperBlueprint.objects.create(
            title="MPT Demo Blueprint 20Q",
            total_questions=20,
            constraints={
                "difficulty_dist": {"1": 4, "2": 8, "3": 6, "4": 2},
                "reuse_limit": 50,
            },
            created_by=users["author"],
        )
        paper = generate_paper(title="MPT Demo Paper 2026", blueprint=bp, user=users["secrecy"])
        dual_authorize_paper(paper=paper, user=users["secrecy"])
        dual_authorize_paper(paper=paper, user=users["approver"])
        return paper

    def _cbt(self, users, paper, centres, ad):
        now = timezone.now()
        sitting = ExamSitting.objects.create(
            title="MPT Demo Sitting — Islamabad",
            paper=paper,
            centre=centres[0],
            mode=ExamSitting.Mode.CENTRALIZED,
            duration_minutes=30,
            starts_at=now - timedelta(minutes=5),
            ends_at=now + timedelta(hours=2),
            shift=1,
        )
        go_live(sitting=sitting)
        from apps.gr.models import Application

        app = Application.objects.filter(candidate=users["candidate1"]).first()
        enroll_candidate(sitting=sitting, candidate=users["candidate1"], application=app)
        enroll_candidate(sitting=sitting, candidate=users["candidate2"])

    def _cms(self):
        Page.objects.create(
            title="About FPSC",
            slug="about",
            body="The Federal Public Service Commission is the premier federal institution for recruitment.",
            is_published=True,
        )
        Page.objects.create(
            title="Contact",
            slug="contact",
            body="Aga Khan Road, F-5/1, Islamabad. Provincial offices in Karachi, Lahore, Peshawar, Quetta.",
            is_published=True,
        )
        NewsItem.objects.create(
            title="Consolidated Advertisement 04/2026 Published",
            slug="ad-04-2026",
            category=NewsItem.Category.AD,
            summary="Apply online through the candidate portal.",
            body="FPSC invites online applications for various posts.",
            is_published=True,
        )
        NewsItem.objects.create(
            title="CSS 2026 MPT Schedule Announced",
            slug="css-mpt-2026",
            category=NewsItem.Category.NOTICE,
            summary="Candidates should download admit cards.",
            body="MPT will be conducted at designated CBT centres.",
            is_published=True,
        )
        SiteSetting.objects.create(
            key="brand",
            value={
                "name": "Federal Public Service Commission",
                "short": "FPSC",
                "tagline": "Merit • Transparency • Excellence",
            },
        )

    def _supporting(self, users, centres):
        DutyAssignment.objects.create(
            exam_date=date.today() + timedelta(days=1),
            centre=centres[0],
            staff=users["invigilator"],
            role="invigilator",
            shift=1,
        )
        InventoryItem.objects.create(sku="OMR-A4", name="OMR Answer Sheets", quantity_on_hand=5000)
        InventoryItem.objects.create(sku="SEAL-BAG", name="Security Seal Bags", quantity_on_hand=200)
        TransportDispatch.objects.create(
            centre=centres[0],
            dispatch_date=date.today(),
            vehicle="VH-101",
            driver="Ali Raza",
            materials="Question packets + OMR",
            status="DISPATCHED",
        )
        LibraryItem.objects.create(
            title="FPSC Annual Report 2025",
            accession_no="LIB-2025-001",
            category="Reports",
        )
