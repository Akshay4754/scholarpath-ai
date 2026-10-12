// Scholarship catalogue compiled from official scheme pages, portals and notices.
//
// Field reference
// - verification: 'official-document' = facts read from the provider's own notice/guidelines;
//   'public-sources' = facts cross-checked across public sources, with the official portal linked for confirmation.
// - deadline / deadlineSource: ISO date, or null when the provider has not published one for this cycle.
//   'official' = from the provider's notice; 'reported' = from published coverage of the current cycle.
// - incomeMaxINR: null means no family income ceiling. incomeMaxByCategory overrides it per social category.
// - minPercentage: 0 means no minimum marks. minPercentageByCategory overrides it per social category.
// - genders / socialCategories / yearsOfStudy / minDisabilityPercent: only present when the scheme restricts them.
// - manualChecks: conditions the rule engine cannot verify from a profile; shown to the student as items to confirm.
//
// Rules, amounts and deadlines change every academic year. Re-verify each record against its sourceUrl
// before every cycle and update lastVerifiedAt. Never add a record without an official source link.
export const CATALOGUE_REVIEWED_AT = '2026-10-13';

const NSP = 'https://scholarships.gov.in/';
const NSP_DEADLINE_NOTE = 'NSP lists 31 Oct 2026 as the 2026-27 closing date for live schemes (institute verification until 15 Nov 2026). Confirm on NSP before relying on it.';
const AICTE_FIELDS = ['Engineering & Technology', 'Architecture & Design', 'Commerce & Management', 'Medicine & Health Sciences'];
const POST_MATRIC_LEVELS = ['Class 11-12', 'Diploma / ITI', 'Undergraduate', 'Postgraduate', 'Doctoral (PhD)'];
const BANK = 'Aadhaar-seeded bank account details';
const INCOME = 'Family income certificate from a competent revenue authority';

const base = { isDemo: false, lastVerifiedAt: CATALOGUE_REVIEWED_AT, states: ['All India'], fields: ['All fields'], minPercentage: 0, manualChecks: [], deadline: null, deadlineSource: null, deadlineNote: '' };

export const scholarships = [
  {
    ...base,
    id: 'central-csss-pm-usp',
    title: 'PM-USP Central Sector Scheme of Scholarship (CSSS)',
    provider: 'Department of Higher Education, Ministry of Education',
    providerType: 'Central Government', category: 'Merit-cum-means',
    amountLabel: '₹12,000/year (UG years 1–3) · ₹20,000/year (years 4–5 and PG)', amountINR: 20000,
    educationLevels: ['Undergraduate', 'Postgraduate'],
    incomeMaxINR: 450000,
    manualChecks: [
      'Scored above the 80th percentile of successful candidates in your Class XII board and stream',
      'Enrolled in a regular course (not distance or correspondence) at a recognised institution',
      'Fresh applications are made in the year after Class XII; later years can only renew an existing award',
      'Not receiving benefits from any other scholarship scheme'
    ],
    requiredDocuments: ['Class XII marksheet', INCOME, 'Admission proof or bonafide certificate', BANK],
    deadlineNote: NSP_DEADLINE_NOTE,
    academicYear: '2026-27', applicationUrl: NSP, sourceUrl: NSP, sourceLabel: 'National Scholarship Portal (NSP)', verification: 'public-sources',
    summary: 'Merit-cum-means scholarship for students in the top 20% of their Class XII board stream whose family income is up to ₹4.5 lakh a year. Around 82,000 fresh awards a year, half reserved for girls.',
    rules: ['Above the 80th percentile in Class XII (board and stream-wise)', 'Family income up to ₹4.5 lakh per year', 'Regular UG/PG course at a recognised institution', 'Not availing any other scholarship']
  },
  {
    ...base,
    id: 'central-aicte-pragati',
    title: 'AICTE Pragati Scholarship for Girl Students',
    provider: 'All India Council for Technical Education (AICTE)',
    providerType: 'Central Government', category: 'Girls in technical education',
    amountLabel: '₹50,000/year', amountINR: 50000,
    educationLevels: ['Diploma / ITI', 'Undergraduate'], fields: AICTE_FIELDS, yearsOfStudy: [1, 2], genders: ['Female'],
    incomeMaxINR: 800000,
    manualChecks: [
      'Your course and institution are AICTE-approved (technical degree or diploma)',
      'If you are in 2nd year, you joined through lateral entry',
      'No more than two girl children from your family receive this scholarship'
    ],
    requiredDocuments: ['Class X / XII or qualifying marksheet', INCOME, 'Admission letter or fee receipt from the AICTE-approved institute', BANK],
    deadline: '2026-10-31', deadlineSource: 'reported', deadlineNote: NSP_DEADLINE_NOTE,
    academicYear: '2026-27', applicationUrl: NSP, sourceUrl: NSP, sourceLabel: 'AICTE via National Scholarship Portal', verification: 'public-sources',
    summary: 'Lump-sum ₹50,000 a year for girls admitted to the first year (or second year by lateral entry) of an AICTE-approved degree or diploma, for fees, a laptop, books and equipment.',
    rules: ['Female students only', 'First year of an AICTE-approved degree/diploma, or second year via lateral entry', 'Family income up to ₹8 lakh per year', 'Maximum two girl children per family']
  },
  {
    ...base,
    id: 'central-aicte-saksham',
    title: 'AICTE Saksham Scholarship for Specially-Abled Students',
    provider: 'All India Council for Technical Education (AICTE)',
    providerType: 'Central Government', category: 'Students with disabilities',
    amountLabel: '₹50,000/year', amountINR: 50000,
    educationLevels: ['Diploma / ITI', 'Undergraduate'], fields: AICTE_FIELDS, yearsOfStudy: [1, 2], minDisabilityPercent: 40,
    incomeMaxINR: 800000,
    manualChecks: [
      'Your course and institution are AICTE-approved (technical degree or diploma)',
      'If you are in 2nd year, you joined through lateral entry',
      'Not receiving any other central or state government scholarship'
    ],
    requiredDocuments: ['Disability certificate (40% or more) from a competent government authority', 'Class X / XII or qualifying marksheet', INCOME, 'Admission letter or fee receipt', BANK],
    deadline: '2026-10-31', deadlineSource: 'reported', deadlineNote: NSP_DEADLINE_NOTE,
    academicYear: '2026-27', applicationUrl: NSP, sourceUrl: NSP, sourceLabel: 'AICTE via National Scholarship Portal', verification: 'public-sources',
    summary: 'Lump-sum ₹50,000 a year for students with a certified disability of 40% or more in the first year (or second year by lateral entry) of an AICTE-approved degree or diploma.',
    rules: ['Certified disability of at least 40%', 'First year of an AICTE-approved degree/diploma, or second year via lateral entry', 'Family income up to ₹8 lakh per year']
  },
  {
    ...base,
    id: 'central-aicte-swanath',
    title: 'AICTE Swanath Scholarship',
    provider: 'All India Council for Technical Education (AICTE)',
    providerType: 'Central Government', category: 'Orphans and wards of martyrs',
    amountLabel: '₹50,000/year', amountINR: 50000,
    educationLevels: ['Diploma / ITI', 'Undergraduate'], fields: AICTE_FIELDS,
    incomeMaxINR: 800000,
    manualChecks: [
      'You are an orphan, lost a parent to COVID-19, or are a ward of armed forces / central armed police personnel martyred in action',
      'Your course and institution are AICTE-approved (technical degree or diploma)',
      'Check the eligible year of study in the current AICTE Swanath guidelines on NSP'
    ],
    requiredDocuments: ['Supporting certificate (death certificate of parent(s) or martyrdom certificate)', 'Qualifying marksheet', INCOME, 'Admission letter or fee receipt', BANK],
    deadline: '2026-10-31', deadlineSource: 'reported', deadlineNote: NSP_DEADLINE_NOTE,
    academicYear: '2026-27', applicationUrl: NSP, sourceUrl: NSP, sourceLabel: 'AICTE via National Scholarship Portal', verification: 'public-sources',
    summary: '₹50,000 a year for orphans, students who lost parents to COVID-19, and wards of martyred armed forces or CAPF personnel studying AICTE-approved technical courses.',
    rules: ['Orphan, COVID-19 bereaved, or ward of a martyr', 'AICTE-approved degree or diploma', 'Family income up to ₹8 lakh per year']
  },
  {
    ...base,
    id: 'central-pms-sc',
    title: 'Post Matric Scholarship for Scheduled Caste Students',
    provider: 'Ministry of Social Justice and Empowerment (implemented by states/UTs)',
    providerType: 'Central Government', category: 'SC students',
    amountLabel: 'Compulsory non-refundable fees + academic allowance (₹2,500–₹13,500/year by course group)', amountINR: 13500,
    educationLevels: POST_MATRIC_LEVELS, socialCategories: ['SC'],
    incomeMaxINR: 250000,
    manualChecks: [
      'Your course requires Class X or higher for admission and your institution is recognised under the scheme',
      'Apply on the portal your state notifies (NSP or the state scholarship portal, e.g. SSP Karnataka, MahaDBT, scholarship.up.gov.in)',
      'The Centre has announced plans to raise the income ceiling to ₹4.5 lakh — check the limit your state applies this year'
    ],
    requiredDocuments: ['Caste certificate (SC)', INCOME, 'Previous year marksheet', 'Fee receipt or admission proof', BANK],
    deadlineNote: 'Deadlines are set by each state or UT; check your state scholarship portal.',
    academicYear: '2026-27', applicationUrl: NSP, sourceUrl: 'https://socialjustice.gov.in/', sourceLabel: 'Ministry of Social Justice and Empowerment', verification: 'public-sources',
    summary: 'Covers compulsory fees and an academic allowance for SC students from Class XI to PhD whose parental income is up to ₹2.5 lakh a year.',
    rules: ['Scheduled Caste students only', 'Parental income up to ₹2.5 lakh per year', 'Post-matric course (Class XI onwards) at a recognised institution']
  },
  {
    ...base,
    id: 'central-pms-st',
    title: 'Post Matric Scholarship for Scheduled Tribe Students',
    provider: 'Ministry of Tribal Affairs (implemented by states/UTs)',
    providerType: 'Central Government', category: 'ST students',
    amountLabel: 'Compulsory fees + maintenance allowance (₹230–₹1,200/month by course)', amountINR: null,
    educationLevels: POST_MATRIC_LEVELS, socialCategories: ['ST'],
    incomeMaxINR: 250000,
    manualChecks: [
      'Your course requires Class X or higher for admission and your institution is recognised',
      'Not receiving any other scholarship at the same time',
      'Apply on the portal your state notifies (NSP or the state scholarship portal)'
    ],
    requiredDocuments: ['Tribe certificate (ST)', INCOME, 'Previous year marksheet', 'Fee receipt or admission proof', BANK],
    deadlineNote: 'Deadlines are set by each state or UT; check NSP or your state scholarship portal.',
    academicYear: '2026-27', applicationUrl: NSP, sourceUrl: 'https://tribal.nic.in/', sourceLabel: 'Ministry of Tribal Affairs', verification: 'public-sources',
    summary: 'Fee reimbursement and a monthly maintenance allowance for ST students from Class XI to postgraduate level whose family income is up to ₹2.5 lakh a year.',
    rules: ['Scheduled Tribe students only', 'Family income up to ₹2.5 lakh per year', 'Post-matric course at a recognised institution', 'No other scholarship at the same time']
  },
  {
    ...base,
    id: 'central-pm-yasasvi-post-matric',
    title: 'PM YASASVI Post Matric Scholarship for OBC, EBC and DNT Students',
    provider: 'Ministry of Social Justice and Empowerment (implemented by states/UTs)',
    providerType: 'Central Government', category: 'OBC / EBC / DNT students',
    amountLabel: 'Academic allowance + non-refundable fees at course-group rates', amountINR: null,
    educationLevels: POST_MATRIC_LEVELS, socialCategories: ['OBC', 'EBC', 'DNT'],
    incomeMaxINR: 250000,
    manualChecks: [
      'You are permanently settled in the state/UT where you apply',
      'Apply on the portal your state notifies (NSP or the state scholarship portal)'
    ],
    requiredDocuments: ['Caste / community certificate (OBC, EBC or DNT)', INCOME, 'Previous year marksheet', 'Fee receipt or admission proof', BANK],
    deadlineNote: 'Deadlines are set by each state or UT; check your state scholarship portal.',
    academicYear: '2026-27', applicationUrl: NSP, sourceUrl: 'https://www.myscheme.gov.in/schemes/pm-yasasvipmsobcebcdnts', sourceLabel: 'myScheme (Government of India)', verification: 'public-sources',
    summary: 'Post-matric support for OBC, EBC and DNT students whose family income is up to ₹2.5 lakh a year, paid by DBT to an Aadhaar-seeded account.',
    rules: ['OBC, EBC or DNT students', 'Family income up to ₹2.5 lakh per year', 'Post-matric course at a recognised institution']
  },
  {
    ...base,
    id: 'central-depwd-post-matric',
    title: 'Post Matric Scholarship for Students with Disabilities',
    provider: 'Department of Empowerment of Persons with Disabilities (DEPwD)',
    providerType: 'Central Government', category: 'Students with disabilities',
    amountLabel: 'Maintenance up to ₹1,600/month (hostellers) or ₹750/month (day scholars), disability allowance ₹2,000–₹4,000/year, plus non-refundable fees', amountINR: null,
    educationLevels: ['Class 11-12', 'Diploma / ITI', 'Undergraduate', 'Postgraduate'], minDisabilityPercent: 40,
    incomeMaxINR: 250000,
    manualChecks: ['Your disability is a specified disability under the Rights of Persons with Disabilities Act, 2016, certified by a competent authority'],
    requiredDocuments: ['Disability certificate (40% or more)', INCOME, 'Previous year marksheet', 'Fee receipt or admission proof', BANK],
    deadline: '2026-10-31', deadlineSource: 'reported', deadlineNote: NSP_DEADLINE_NOTE,
    academicYear: '2026-27', applicationUrl: NSP, sourceUrl: 'https://scholarships.gov.in//public/schemeGuidelines/DEPDGuidelines.pdf', sourceLabel: 'DEPwD scheme guidelines (NSP)', verification: 'public-sources',
    summary: 'Monthly maintenance, an annual disability allowance and fee reimbursement for students with a benchmark disability of 40% or more from Class XI to postgraduate level.',
    rules: ['Benchmark disability of 40% or more', 'Family income up to ₹2.5 lakh per year', 'Class XI to postgraduate courses']
  },
  {
    ...base,
    id: 'central-inspire-she',
    title: 'INSPIRE Scholarship for Higher Education (SHE)',
    provider: 'Department of Science & Technology (DST)',
    providerType: 'Central Government', category: 'Merit — basic sciences',
    amountLabel: '₹80,000/year (₹60,000 scholarship + ₹20,000 mentorship grant)', amountINR: 80000,
    educationLevels: ['Undergraduate', 'Postgraduate'], fields: ['Natural & Basic Sciences'],
    incomeMaxINR: null,
    manualChecks: [
      'Top 1% in your Class XII board, or JEE (Main/Advanced) rank within 10,000, or another qualifying route listed in the current call (NEET, NTSE, JBNSTS, International Olympiad medal)',
      'Enrolled in B.Sc., B.S., B.Sc. (Research) or Integrated M.Sc./M.S. in natural or basic sciences',
      'Aged 17–22 years when applying'
    ],
    requiredDocuments: ['Class XII marksheet', 'Proof of the qualifying route (board top-1% certificate or rank card)', 'Endorsement from your college principal', BANK],
    deadlineNote: 'Calls are announced on the INSPIRE portal; the previous call was reported to close on 31 Dec 2025.',
    academicYear: '2026 call', applicationUrl: 'https://online-inspire.gov.in/', sourceUrl: 'https://online-inspire.gov.in/', sourceLabel: 'DST INSPIRE portal', verification: 'public-sources',
    summary: '12,000 scholarships a year of ₹80,000 for top-ranked students who choose undergraduate or integrated degrees in the natural and basic sciences. No income limit.',
    rules: ['Top 1% in Class XII or a qualifying competitive-exam rank', 'Natural/basic sciences degree', 'Age 17–22']
  },
  {
    ...base,
    id: 'central-nmmss',
    title: 'National Means-cum-Merit Scholarship (NMMSS)',
    provider: 'Department of School Education & Literacy, Ministry of Education',
    providerType: 'Central Government', category: 'School merit-cum-means',
    amountLabel: '₹12,000/year (₹1,000/month), Class IX to XII', amountINR: 12000,
    educationLevels: ['Class 9-10', 'Class 11-12'],
    incomeMaxINR: 350000, minPercentage: 55, minPercentageByCategory: { SC: 50, ST: 50 },
    manualChecks: [
      'You qualified the state-level NMMS selection exam (taken in Class VIII)',
      'You study in a government, government-aided or local-body school (not KVS, JNV, Sainik or residential government schools)',
      'Renewal in Class X / XII needs the stated marks in the previous class'
    ],
    requiredDocuments: ['NMMS exam result / selection letter', 'Previous class marksheet', INCOME, 'School bonafide certificate', BANK],
    deadline: '2026-10-31', deadlineSource: 'reported', deadlineNote: NSP_DEADLINE_NOTE,
    academicYear: '2026-27', applicationUrl: NSP, sourceUrl: NSP, sourceLabel: 'National Scholarship Portal (NSP)', verification: 'public-sources',
    summary: '₹12,000 a year from Class IX to XII for students who clear the NMMS exam, study in government or aided schools, and have family income up to ₹3.5 lakh.',
    rules: ['Qualified the state NMMS exam', 'Government, aided or local-body school', '55% marks (50% for SC/ST)', 'Family income up to ₹3.5 lakh per year']
  },
  {
    ...base,
    id: 'central-pmss-ksb',
    title: "Prime Minister's Scholarship Scheme (PMSS) for Wards of Ex-Servicemen",
    provider: 'Kendriya Sainik Board, Ministry of Defence',
    providerType: 'Central Government', category: 'Defence wards',
    amountLabel: '₹2,500/month (boys) · ₹3,000/month (girls)', amountINR: 36000,
    educationLevels: ['Undergraduate', 'Postgraduate'], yearsOfStudy: [1],
    incomeMaxINR: null, minPercentage: 60,
    manualChecks: [
      'You are a dependent ward or widow of an ex-serviceman or ex-Coast Guard personnel',
      'First year of a professional degree on the KSB list (e.g. BE/BTech, MBBS, BDS, MBA, MCA) approved by AICTE/UGC or the relevant regulator',
      'Lateral-entry admissions are not eligible'
    ],
    requiredDocuments: ['Ex-serviceman identity card / discharge book of parent', 'Minimum educational qualification marksheet (60% or more)', 'Admission proof for the first year', BANK],
    deadlineNote: 'Applications are taken on the KSB portal; check ksb.gov.in for the 2026-27 window.',
    academicYear: '2026-27', applicationUrl: 'https://ksb.gov.in/', sourceUrl: 'https://www.india.gov.in/prime-ministers-scholarship-scheme-pmss', sourceLabel: 'National Portal of India', verification: 'public-sources',
    summary: 'Monthly scholarship for wards and widows of ex-servicemen in the first year of professional degree courses who scored at least 60% in the qualifying exam.',
    rules: ['Ward or widow of an ex-serviceman / ex-Coast Guard', 'First year of a professional degree', 'At least 60% in the minimum educational qualification']
  },
  {
    ...base,
    id: 'private-reliance-foundation-ug',
    title: 'Reliance Foundation Undergraduate Scholarship',
    provider: 'Reliance Foundation',
    providerType: 'Corporate / Foundation', category: 'Merit-cum-means',
    amountLabel: 'Up to ₹2,00,000 over the degree', amountINR: null,
    educationLevels: ['Undergraduate'], yearsOfStudy: [1],
    incomeMaxINR: 1500000, minPercentage: 60,
    manualChecks: [
      'Enrolled in the first year of a regular full-time degree at a recognised Indian institution',
      'Complete the mandatory online aptitude test after submitting the form',
      'Families earning under ₹2.5 lakh a year are given priority'
    ],
    requiredDocuments: ['Class XII marksheet', 'Proof of first-year admission', 'Family income proof', BANK],
    deadline: '2026-10-05', deadlineSource: 'reported', deadlineNote: 'Reported closing date for the 2026-27 cycle (5,000 UG scholarships).',
    academicYear: '2026-27', applicationUrl: 'https://scholarships.reliancefoundation.org/', sourceUrl: 'https://www.reliancefoundation.org/media/media-release/Reliance_Foundation_Scholarships_2026-27', sourceLabel: 'Reliance Foundation press release (14 Aug 2026)', verification: 'public-sources',
    summary: 'Up to ₹2 lakh across the degree for first-year undergraduates in any stream, selected on Class XII marks, family income and an aptitude test.',
    rules: ['First-year undergraduate, any stream', 'At least 60% in Class XII', 'Household income below ₹15 lakh', 'Aptitude test required']
  },
  {
    ...base,
    id: 'private-kotak-kanya',
    title: 'Kotak Kanya Scholarship',
    provider: 'Kotak Education Foundation',
    providerType: 'Corporate / Foundation', category: 'Girls in professional courses',
    amountLabel: '₹1,50,000/year until graduation', amountINR: 150000,
    educationLevels: ['Undergraduate'], fields: ['Engineering & Technology', 'Medicine & Health Sciences', 'Law', 'Architecture & Design', 'Natural & Basic Sciences'],
    yearsOfStudy: [1], genders: ['Female'],
    incomeMaxINR: 600000, minPercentage: 75,
    manualChecks: [
      'Admitted to the first year of a professional degree (e.g. Engineering, MBBS, 5-year integrated LLB, Integrated BS-MS, Design, Architecture) at an NIRF/NAAC-accredited institute',
      'Children of Kotak Mahindra Group, Kotak Education Foundation and Buddy4Study employees are not eligible'
    ],
    requiredDocuments: ['Class XII marksheet', 'Proof of admission and fee structure', 'Family income proof', BANK],
    deadline: '2026-09-30', deadlineSource: 'reported', deadlineNote: 'Reported closing date for the 2026-27 cycle.',
    academicYear: '2026-27', applicationUrl: 'https://www.kotakeducationfoundation.org/kotak-kanya-scholarship', sourceUrl: 'https://www.kotakeducationfoundation.org/kotak-kanya-scholarship', sourceLabel: 'Kotak Education Foundation', verification: 'public-sources',
    summary: '₹1.5 lakh a year for meritorious girls from families earning up to ₹6 lakh who start a professional degree at a NIRF/NAAC-accredited institute.',
    rules: ['Female students only', 'At least 75% in Class XII', 'Family income up to ₹6 lakh per year', 'First year of a professional degree']
  },
  {
    ...base,
    id: 'private-lic-gjf-general',
    title: 'LIC Golden Jubilee Scholarship (General, after Class XII)',
    provider: 'LIC Golden Jubilee Foundation',
    providerType: 'Corporate / Foundation', category: 'Merit-cum-means',
    amountLabel: '₹50,000/year (MBBS, BDS, BAMS, BHMS) · ₹40,000/year (BE, BTech, BArch) · ₹20,000/year (other degrees, diploma, ITI)', amountINR: 50000,
    educationLevels: ['Diploma / ITI', 'Undergraduate'], yearsOfStudy: [1],
    incomeMaxINR: 450000, minPercentage: 60,
    manualChecks: [
      'Passed Class XII (or equivalent) in 2023-24, 2024-25 or 2025-26 and admitted to a first-year course in 2026-27',
      'Regular course — correspondence, part-time, open-university and self-study courses (CA, CS, etc.) are not eligible',
      'Normally one scholarship per family (two if the later applicant is female)'
    ],
    requiredDocuments: ['Class XII marksheet', 'Parent/guardian income proof', 'Proof of first-year admission', 'PAN and e-Aadhaar details', 'Bank account details with a cancelled cheque'],
    deadline: '2026-09-30', deadlineSource: 'official', deadlineNote: 'Closing date in the LIC GJF Scholarship Scheme 2026 notice.',
    academicYear: '2026-27', applicationUrl: 'https://licindia.in/', sourceUrl: 'https://licindia.in/documents/d/guest/golden-jubilee-scholarship-scheme-2026', sourceLabel: 'LIC Golden Jubilee Scholarship Scheme 2026 (official notice)', verification: 'official-document',
    summary: 'Annual scholarship for first-year students from families earning up to ₹4.5 lakh who scored 60% in Class XII, paid in two instalments for the full course. 80 awards per LIC division (40 girls, 40 boys).',
    rules: ['At least 60% in Class XII (or equivalent CGPA)', 'Parent/guardian income up to ₹4.5 lakh per year', 'First year of a degree, diploma, integrated, vocational or ITI course']
  },
  {
    ...base,
    id: 'private-lic-gjf-special',
    title: 'LIC Golden Jubilee Special Scholarship (after Class X)',
    provider: 'LIC Golden Jubilee Foundation',
    providerType: 'Corporate / Foundation', category: 'Merit-cum-means',
    amountLabel: '₹15,000/year', amountINR: 15000,
    educationLevels: ['Class 11-12', 'Diploma / ITI'], yearsOfStudy: [1],
    incomeMaxINR: 450000, minPercentage: 60,
    manualChecks: [
      'Passed Class X (or equivalent) in 2023-24, 2024-25 or 2025-26 and admitted in 2026-27 to the first year of Class XI/intermediate, a vocational or diploma course, or ITI',
      'Regular course at a government-recognised institution'
    ],
    requiredDocuments: ['Class X marksheet', 'Parent/guardian income proof', 'Proof of admission', 'PAN and e-Aadhaar details', 'Bank account details with a cancelled cheque'],
    deadline: '2026-09-30', deadlineSource: 'official', deadlineNote: 'Closing date in the LIC GJF Scholarship Scheme 2026 notice.',
    academicYear: '2026-27', applicationUrl: 'https://licindia.in/', sourceUrl: 'https://licindia.in/documents/d/guest/golden-jubilee-scholarship-scheme-2026', sourceLabel: 'LIC Golden Jubilee Scholarship Scheme 2026 (official notice)', verification: 'official-document',
    summary: '₹15,000 a year for students who scored 60% in Class X and continue to Class XI, a diploma, a vocational course or ITI, with family income up to ₹4.5 lakh. 40 awards per LIC division.',
    rules: ['At least 60% in Class X', 'Parent/guardian income up to ₹4.5 lakh per year', 'First year of Class XI, diploma, vocational course or ITI']
  },
  {
    ...base,
    id: 'tn-pudhumai-penn',
    title: 'Pudhumai Penn Scheme (Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme)',
    provider: 'Government of Tamil Nadu',
    providerType: 'State Government', category: 'Girls from government schools',
    amountLabel: '₹1,000/month for the duration of the course', amountINR: 12000,
    states: ['Tamil Nadu'], educationLevels: ['Diploma / ITI', 'Undergraduate'], genders: ['Female'],
    incomeMaxINR: null,
    manualChecks: [
      'You studied Class VI to XII in a Tamil Nadu government school',
      'Enrolled in a regular course at a recognised institution (distance, correspondence and open-university courses are not eligible)',
      'Registration is done through your college on the Penkalvi portal'
    ],
    requiredDocuments: ['School study certificates for Class VI–XII', 'Aadhaar card', BANK, 'College admission proof'],
    deadlineNote: 'Registration runs through colleges; ask your college nodal officer for the current window.',
    academicYear: '2026-27', applicationUrl: 'https://penkalvi.tn.gov.in/', sourceUrl: 'https://www.myscheme.gov.in/schemes/pudhumai-penn-scheme', sourceLabel: 'myScheme (Government of India)', verification: 'public-sources',
    summary: '₹1,000 a month during higher education for girls who studied Class VI–XII in Tamil Nadu government schools. No income limit.',
    rules: ['Female students', 'Class VI–XII in a Tamil Nadu government school', 'Regular higher-education course', 'No income limit']
  },
  {
    ...base,
    id: 'tn-tamil-pudhalvan',
    title: 'Tamil Pudhalvan Scheme',
    provider: 'Government of Tamil Nadu',
    providerType: 'State Government', category: 'Boys from government schools',
    amountLabel: '₹1,000/month for the duration of the course', amountINR: 12000,
    states: ['Tamil Nadu'], educationLevels: ['Diploma / ITI', 'Undergraduate'], genders: ['Male'],
    incomeMaxINR: null,
    manualChecks: [
      'You studied Class VI to XII in a Tamil Nadu government school, or in Tamil medium at a government-aided school',
      'Admitted to a recognised institution in Tamil Nadu',
      'Registration is done through your college on the UMIS portal'
    ],
    requiredDocuments: ['School study certificates for Class VI–XII', 'Aadhaar card', BANK, 'College admission proof'],
    deadlineNote: 'Registration runs through colleges on UMIS; ask your college for the current window.',
    academicYear: '2026-27', applicationUrl: 'https://umis.tn.gov.in/', sourceUrl: 'https://umis.tn.gov.in/', sourceLabel: 'UMIS portal, Government of Tamil Nadu', verification: 'public-sources',
    summary: '₹1,000 a month during higher education for boys who studied Class VI–XII in Tamil Nadu government schools (or Tamil medium in aided schools). No income limit.',
    rules: ['Male students', 'Class VI–XII in a Tamil Nadu government school (or Tamil-medium aided school)', 'Recognised institution in Tamil Nadu', 'No income limit']
  },
  {
    ...base,
    id: 'bihar-kanya-utthan-graduation',
    title: 'Mukhyamantri Kanya Utthan Yojana — Graduation Incentive',
    provider: 'Government of Bihar',
    providerType: 'State Government', category: 'Girls',
    amountLabel: '₹50,000 one-time incentive on passing graduation', amountINR: 50000,
    states: ['Bihar'], educationLevels: ['Undergraduate'], genders: ['Female'],
    incomeMaxINR: null,
    manualChecks: [
      'You have passed your graduation (final result declared) from a recognised university in Bihar',
      'Check any marital-status condition in the current notice on Medhasoft'
    ],
    requiredDocuments: ['Graduation marksheet / provisional certificate', 'Aadhaar card', 'Bihar residence proof', BANK],
    deadline: '2026-10-31', deadlineSource: 'reported', deadlineNote: 'Reported closing date for the current Medhasoft window.',
    academicYear: '2026-27', applicationUrl: 'https://medhasoft.bih.nic.in/', sourceUrl: 'https://medhasoft.bih.nic.in/', sourceLabel: 'Medhasoft portal, Government of Bihar', verification: 'public-sources',
    summary: 'One-time ₹50,000 for women from Bihar who complete graduation at a recognised university in the state. No caste or income restriction.',
    rules: ['Female residents of Bihar', 'Graduation passed from a recognised university in Bihar', 'No income limit']
  },
  {
    ...base,
    id: 'mh-rajarshi-shahu-shikshan-shulkh',
    title: 'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojana',
    provider: 'Government of Maharashtra',
    providerType: 'State Government', category: 'EBC / EWS fee support',
    amountLabel: '50% of tuition and exam fees (boys) · 100% (girls)', amountINR: null,
    states: ['Maharashtra'], educationLevels: ['Diploma / ITI', 'Undergraduate', 'Postgraduate'], socialCategories: ['General', 'EWS', 'EBC'],
    incomeMaxINR: 800000,
    manualChecks: [
      'Admitted to a professional or technical course through the Centralised Admission Process (CAP)',
      'At least 50% attendance in the previous semester'
    ],
    requiredDocuments: ['Maharashtra domicile certificate', INCOME, 'CAP allotment letter', 'Previous semester marksheet and attendance record', BANK],
    deadlineNote: 'MahaDBT announces the window each year; check the portal.',
    academicYear: '2026-27', applicationUrl: 'https://mahadbt.maharashtra.gov.in/', sourceUrl: 'https://mahadbt.maharashtra.gov.in/', sourceLabel: 'MahaDBT, Government of Maharashtra', verification: 'public-sources',
    summary: 'Tuition and exam fee support for open-category EBC/EWS students from Maharashtra admitted to professional courses through CAP, with family income up to ₹8 lakh.',
    rules: ['Maharashtra domicile', 'EBC/EWS (open category)', 'Admitted through CAP', 'Family income up to ₹8 lakh per year']
  },
  {
    ...base,
    id: 'up-post-matric-dashmottar',
    title: 'Uttar Pradesh Post-Matric (Dashmottar) Scholarship',
    provider: 'Government of Uttar Pradesh',
    providerType: 'State Government', category: 'Need-based',
    amountLabel: 'Fee reimbursement + maintenance allowance at course-group rates', amountINR: null,
    states: ['Uttar Pradesh'], educationLevels: POST_MATRIC_LEVELS,
    incomeMaxINR: 200000, incomeMaxByCategory: { SC: 250000, ST: 250000 },
    manualChecks: [
      'Your institution is registered on the UP scholarship portal',
      'Submit a printed copy of the online form to your institution for verification'
    ],
    requiredDocuments: ['UP domicile certificate', INCOME, 'Caste certificate (if applicable)', 'Previous year marksheet', 'Fee receipt', BANK],
    deadlineNote: 'The UP scholarship timetable is published each year on the portal.',
    academicYear: '2026-27', applicationUrl: 'https://scholarship.up.gov.in/', sourceUrl: 'https://scholarship.up.gov.in/', sourceLabel: 'Scholarship & Fee Reimbursement portal, Government of Uttar Pradesh', verification: 'public-sources',
    summary: 'Post-matric fee reimbursement and maintenance for UP students of all categories: income up to ₹2 lakh (General, OBC, minority) or ₹2.5 lakh (SC/ST).',
    rules: ['Uttar Pradesh domicile', 'Income up to ₹2 lakh (General/OBC/minority) or ₹2.5 lakh (SC/ST)', 'Class XI to PhD at a registered institution']
  },
  {
    ...base,
    id: 'delhi-mcm-financial-assistance',
    title: 'Delhi Merit-cum-Means Linked Financial Assistance Scheme',
    provider: 'Department of Higher Education, Government of NCT of Delhi',
    providerType: 'State Government', category: 'Merit-cum-means fee support',
    amountLabel: 'Tuition fee reimbursement: 100% (NFSA families) · 50% (income ₹1–2.5 lakh) · 25% (income ₹2.5–6 lakh)', amountINR: null,
    states: ['Delhi'], educationLevels: ['Undergraduate'],
    incomeMaxINR: 600000, minPercentage: 60,
    manualChecks: ["Enrolled in an undergraduate course at one of Delhi's seven state universities or their affiliated institutes"],
    requiredDocuments: ['Qualifying exam marksheet (60% or more)', INCOME, 'NFSA ration card (if applicable)', 'Fee receipt from the university/institute', BANK],
    deadlineNote: 'Applications open on e-District each academic year; check the Department of Higher Education notice.',
    academicYear: 'Recurring — check the current notice', applicationUrl: 'https://edistrict.delhigovt.nic.in/', sourceUrl: 'https://higheredn.delhi.gov.in/', sourceLabel: 'Department of Higher Education, Delhi', verification: 'public-sources',
    summary: 'Tuition fee reimbursement for undergraduates at Delhi state universities who scored 60% in the qualifying exam, scaled by family income up to ₹6 lakh.',
    rules: ['Undergraduate at a Delhi state university or affiliated institute', 'At least 60% in the qualifying exam', 'Family income up to ₹6 lakh per year']
  }
];

export const findScholarship = id => scholarships.find(s => s.id === id);
