# Scholarship catalogue

The catalogue lives in [`backend/src/data/scholarships.js`](../backend/src/data/scholarships.js). It holds 21 real schemes: 11 central government, 6 state government (Tamil Nadu, Bihar, Maharashtra, Uttar Pradesh and Delhi) and 4 from corporate foundations. It was reviewed on **13 October 2026** for the 2026-27 cycle.

## How records were verified

- **Official notice**: every fact was read from the provider's own published notice this cycle (for example, the LIC Golden Jubilee Scholarship Scheme 2026 PDF).
- **Public sources**: facts were cross-checked across published coverage and portal listings for the current cycle. The record links to the official portal or ministry page so students can confirm it.
- Anything that could not be confirmed was left out, or written into `manualChecks` so the student confirms it on the source. Nothing is guessed.
- One scheme was deliberately excluded: Karnataka's Raitha Vidya Nidhi, because its current status could not be confirmed.
- Deadlines carry a `deadlineSource`: `official` (from the provider's notice), `reported` (published coverage of this cycle), or no deadline when the provider has not published one. Cards show "Closed for this cycle" once a deadline passes.

## What the rule engine checks

Each record's structured fields drive [`evaluateRules`](../backend/src/services/eligibility.service.js):

| Field | Check |
| --- | --- |
| `states` | Residence state, or `All India` |
| `educationLevels` | Current level of study |
| `fields` | Field of study, or `All fields` |
| `yearsOfStudy` | Year of the current course (e.g. first-year-only schemes) |
| `genders`, `socialCategories` | Only present when the scheme restricts them |
| `minDisabilityPercent` | Certified disability threshold |
| `incomeMaxINR` / `incomeMaxByCategory` | Family income ceiling; `null` means no ceiling |
| `minPercentage` / `minPercentageByCategory` | Minimum marks; `0` means none |
| `manualChecks` | Conditions a profile cannot prove (exam rank, school type, institution approval). Shown as "Confirm before applying" and added to the checklist; they never block a match. |

All values must come from [`profileOptions.js`](../backend/src/data/profileOptions.js). The test suite enforces this, along with https source links, valid dates and complete records (`npm test` in `backend`).

## Records

| Scheme | Provider type | Verification | Deadline | Source |
| --- | --- | --- | --- | --- |
| PM-USP Central Sector Scheme of Scholarship (CSSS) | Central Government | Public sources | Not published | [National Scholarship Portal (NSP)](https://scholarships.gov.in/) |
| AICTE Pragati Scholarship for Girl Students | Central Government | Public sources | 2026-10-31 (reported) | [AICTE via National Scholarship Portal](https://scholarships.gov.in/) |
| AICTE Saksham Scholarship for Specially-Abled Students | Central Government | Public sources | 2026-10-31 (reported) | [AICTE via National Scholarship Portal](https://scholarships.gov.in/) |
| AICTE Swanath Scholarship | Central Government | Public sources | 2026-10-31 (reported) | [AICTE via National Scholarship Portal](https://scholarships.gov.in/) |
| Post Matric Scholarship for Scheduled Caste Students | Central Government | Public sources | Not published | [Ministry of Social Justice and Empowerment](https://socialjustice.gov.in/) |
| Post Matric Scholarship for Scheduled Tribe Students | Central Government | Public sources | Not published | [Ministry of Tribal Affairs](https://tribal.nic.in/) |
| PM YASASVI Post Matric Scholarship for OBC, EBC and DNT Students | Central Government | Public sources | Not published | [myScheme (Government of India)](https://www.myscheme.gov.in/schemes/pm-yasasvipmsobcebcdnts) |
| Post Matric Scholarship for Students with Disabilities | Central Government | Public sources | 2026-10-31 (reported) | [DEPwD scheme guidelines (NSP)](https://scholarships.gov.in//public/schemeGuidelines/DEPDGuidelines.pdf) |
| INSPIRE Scholarship for Higher Education (SHE) | Central Government | Public sources | Not published | [DST INSPIRE portal](https://online-inspire.gov.in/) |
| National Means-cum-Merit Scholarship (NMMSS) | Central Government | Public sources | 2026-10-31 (reported) | [National Scholarship Portal (NSP)](https://scholarships.gov.in/) |
| Prime Minister's Scholarship Scheme (PMSS) for Wards of Ex-Servicemen | Central Government | Public sources | Not published | [National Portal of India](https://www.india.gov.in/prime-ministers-scholarship-scheme-pmss) |
| Reliance Foundation Undergraduate Scholarship | Corporate / Foundation | Public sources | 2026-10-05 (reported) | [Reliance Foundation press release (14 Aug 2026)](https://www.reliancefoundation.org/media/media-release/Reliance_Foundation_Scholarships_2026-27) |
| Kotak Kanya Scholarship | Corporate / Foundation | Public sources | 2026-09-30 (reported) | [Kotak Education Foundation](https://www.kotakeducationfoundation.org/kotak-kanya-scholarship) |
| LIC Golden Jubilee Scholarship (General, after Class XII) | Corporate / Foundation | Official notice | 2026-09-30 (official) | [LIC Golden Jubilee Scholarship Scheme 2026 (official notice)](https://licindia.in/documents/d/guest/golden-jubilee-scholarship-scheme-2026) |
| LIC Golden Jubilee Special Scholarship (after Class X) | Corporate / Foundation | Official notice | 2026-09-30 (official) | [LIC Golden Jubilee Scholarship Scheme 2026 (official notice)](https://licindia.in/documents/d/guest/golden-jubilee-scholarship-scheme-2026) |
| Pudhumai Penn Scheme (Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme) | State Government | Public sources | Not published | [myScheme (Government of India)](https://www.myscheme.gov.in/schemes/pudhumai-penn-scheme) |
| Tamil Pudhalvan Scheme | State Government | Public sources | Not published | [UMIS portal, Government of Tamil Nadu](https://umis.tn.gov.in/) |
| Mukhyamantri Kanya Utthan Yojana — Graduation Incentive | State Government | Public sources | 2026-10-31 (reported) | [Medhasoft portal, Government of Bihar](https://medhasoft.bih.nic.in/) |
| Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojana | State Government | Public sources | Not published | [MahaDBT, Government of Maharashtra](https://mahadbt.maharashtra.gov.in/) |
| Uttar Pradesh Post-Matric (Dashmottar) Scholarship | State Government | Public sources | Not published | [Scholarship & Fee Reimbursement portal, Government of Uttar Pradesh](https://scholarship.up.gov.in/) |
| Delhi Merit-cum-Means Linked Financial Assistance Scheme | State Government | Public sources | Not published | [Department of Higher Education, Delhi](https://higheredn.delhi.gov.in/) |

## Yearly refresh

Rules, amounts and deadlines change every academic year. Before each cycle:

1. Re-read every `sourceUrl` and update amounts, limits, `manualChecks`, `deadline`, `deadlineSource` and `academicYear`.
2. Set `lastVerifiedAt` on each record you re-checked, and `CATALOGUE_REVIEWED_AT` once the review is done.
3. Remove schemes that have been discontinued; add new ones only with an official source link.
4. Run `npm test` in `backend`; the dataset integrity tests must pass.
