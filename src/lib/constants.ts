export const STREAMS = [
  { id: "Engineering", label: "Engineering", icon: "⚙️" },
  { id: "Pharmacy", label: "Pharmacy", icon: "💊" },
  { id: "Nursing", label: "B.Sc Nursing / GNM", icon: "🏥" },
  { id: "Agriculture", label: "Agriculture", icon: "🌾" },
  { id: "Medical", label: "Medical (MBBS/BDS)", icon: "🩺" },
] as const;

export const ENGINEERING_COLLEGES = [
  "G. H. Raisoni College of Engineering",
  "Yeshwantrao Chavan College of Engineering",
  "KDK College of Engineering",
  "S. B. Jain Institute of Technology",
  "JD College of Engineering and Management",
  "Priyadarshini College of Engineering",
  "St. Vincent Pallotti College of Engineering",
  "Tulsiramji Gaikwad Patil College of Engineering",
  "Wainganga College of Engineering and Management",
  "Julelal College of Engineering Nagpur",
  "Anjuman College of Engineering and Technology",
  "Pandav College of Engineering Nagpur/Bhandara",
  "KITS College Ramtek",
  "MIET College Bhandara",
  "Karanjekar College Sakoli",
];

export const ENGINEERING_BRANCHES = [
  "Computer Science Engineering",
  "Computer Technology",
  "Computer Engineering",
  "Computer Science Data Science",
  "Computer Science & Electronics",
  "Computer Science AIML",
  "Computer Science & AI",
  "AIML", "AIRO", "AIDS", "ETC", "ECE", "E&TC",
  "Civil", "Electrical", "Mechanical", "Aeronautical", "Chemical", "Biotechnology",
];

export const NURSING_COLLEGES = [
  "Datta Meghe College of Nursing",
  "Government College of Nursing Nagpur",
  "Shreeji Institute of Nursing",
  "Sumantai Washnik College of Nursing",
  "Suretech College of Nursing",
  "Lata Mangeshkar College of Nursing",
  "VSPM College of Nursing",
  "Shantiniketan College of Nursing",
  "Radhikatai Pandav College of Nursing",
  "Bhausaheb Mulak College of Nursing",
  "Indutai Gaikwad Patil College of Nursing",
];

export const NURSING_BRANCHES = ["BSc Nursing", "GNM", "ANM", "PB Nursing", "MSc Nursing"];

export const AGRICULTURE_COURSES = [
  "BSc Agriculture", "Agricultural Engineering", "Food Technology", "Dairy Technology",
];

export const PHARMACY_COURSES = ["D. Pharmacy", "B. Pharmacy", "M. Pharmacy", "Pharm.D"];
export const MEDICAL_COURSES = ["MBBS", "BDS", "BAMS", "BHMS"];

export const PHARMACY_COLLEGES = [
  "Government College of Pharmacy Amravati",
  "Datta Meghe College of Pharmacy",
  "Kamla Nehru College of Pharmacy",
  "Smt. Kishoritai Bhoyar College of Pharmacy",
  "Priyadarshini J. L. College of Pharmacy",
];

export const AGRICULTURE_COLLEGES = [
  "Dr. Panjabrao Deshmukh Krishi Vidyapeeth",
  "Mahatma Phule Krishi Vidyapeeth",
  "College of Agriculture Nagpur",
  "College of Agriculture Bhandara",
];

export const MEDICAL_COLLEGES = [
  "Government Medical College Nagpur",
  "Indira Gandhi Govt. Medical College",
  "NKP Salve Institute of Medical Sciences",
  "Datta Meghe Institute of Medical Sciences",
];

export const CATEGORIES = ["General", "OBC", "SC", "ST", "NT", "SBC", "EWS"];
export const STATES = [
  "Maharashtra", "Madhya Pradesh", "Chhattisgarh", "Gujarat", "Karnataka",
  "Telangana", "Andhra Pradesh", "Uttar Pradesh", "Bihar", "Rajasthan", "Other",
];

// Documents checklist
export const DOCUMENTS = [
  { key: "tenth_marksheet", label: "10th Marksheet & Certificate" },
  { key: "twelfth_marksheet", label: "12th Marksheet & Certificate" },
  { key: "cet_jee_neet_score", label: "CET / JEE / NEET Score Card" },
  { key: "school_leaving", label: "School Leaving Certificate (LC/TC)" },
  { key: "domicile", label: "Domicile Certificate" },
  { key: "nationality_birth", label: "Nationality / Birth Certificate" },
  { key: "aadhaar", label: "Aadhaar Card" },
  { key: "photos", label: "Passport Size Photos (4 copies)" },
  { key: "caste_certificate", label: "Caste Certificate (SC/ST/OBC/EWS)" },
  { key: "caste_validity", label: "Caste Validity Certificate" },
  { key: "non_creamy_layer", label: "Non-Creamy Layer Certificate" },
  { key: "income_certificate", label: "Income Certificate" },
  { key: "gap_certificate", label: "Gap Certificate (if gap in education)" },
  { key: "migration_certificate", label: "Migration Certificate (Other Board)" },
  { key: "email_provided", label: "Email ID (Provided)" },
  { key: "apaar_id", label: "APAAR ID" },
] as const;

// Service / fee options
export const SERVICE_OPTIONS = [
  "Form Registration Charges – ₹100/-",
  "Counseling Charges + Registration – ₹150/-",
  "Documentation + Registration – ₹1,000/-",
  "CAP Round Processing Charges – ₹2,000/-",
  "Total Admission Assistance Package – ₹5,000/-",
];

// Branding
export const ACADEMY_NAME = "Youth Career Academy";
export const ACADEMY_TAGLINE = "Expert Coaching for JEE, NEET & MHT-CET";
export const CENTER_NAME = "YCC Education Admission Help Center";
export const CENTER_LOCATION = "Bhandara, Maharashtra";
export const CONTACT_PHONE = "+91 99700 99623";
export const WEBSITE_URL = "https://www.youthcareers.in/";

// Admin credentials
export const ADMIN_USERNAME = "yccadmin";
export const ADMIN_PASSWORD = "YCC@2025Admin";
