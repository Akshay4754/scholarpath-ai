// Single source of truth for profile values. The eligibility engine compares these strings exactly,
// and the frontend loads them from GET /api/meta so the form can only produce values the engine knows.
export const ALL_INDIA = 'All India';
export const ALL_FIELDS = 'All fields';

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry'
];
export const EDUCATION_LEVELS = ['Class 9-10', 'Class 11-12', 'Diploma / ITI', 'Undergraduate', 'Postgraduate', 'Doctoral (PhD)'];
export const FIELDS_OF_STUDY = [
  'Engineering & Technology', 'Medicine & Health Sciences', 'Natural & Basic Sciences', 'Commerce & Management', 'Arts & Humanities',
  'Law', 'Architecture & Design', 'Agriculture', 'Education', 'Vocational / Skills', 'School (no specialisation)'
];
export const GENDERS = ['Female', 'Male', 'Other'];
export const SOCIAL_CATEGORIES = ['General', 'EWS', 'OBC', 'EBC', 'DNT', 'SC', 'ST'];
export const YEARS_OF_STUDY = [1, 2, 3, 4, 5, 6];

export const profileOptions = { states: STATES, educationLevels: EDUCATION_LEVELS, fieldsOfStudy: FIELDS_OF_STUDY, genders: GENDERS, socialCategories: SOCIAL_CATEGORIES, yearsOfStudy: YEARS_OF_STUDY };
