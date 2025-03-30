import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// English translations
const enTranslations = {
  common: {
    appName: "Shahbaaz Auditorium",
    welcome: "Welcome to Shahbaaz Auditorium",
    login: "Login",
    register: "Register",
    logout: "Logout",
    profile: "Profile",
    admin: "Admin ",
    home: "Home",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    save: "Save",
    back: "Back",
    next: "Next",
    prev: "Previous",
    loading: "Loading...",
    noDataFound: "No data found",
    search: "Search",
    filter: "Filter",
    actions: "Actions",
    view: "View",
    seats: "Seats",
    morePages: "More pages",
    startTour: "Start interactive guide",
  },
  tourGuide: {
    // Home page
    "Welcome to Shahbaaz Auditorium Seat Reservation System! This is the header area where you can navigate the application.": "Welcome to Shahbaaz Auditorium Seat Reservation System! This is the header area where you can navigate the application.",
    "Toggle between light and dark mode for your comfort.": "Toggle between light and dark mode for your comfort.",
    "Switch between English and Hindi languages.": "Switch between English and Hindi languages.",
    "Access your profile or log out from the system here.": "Access your profile or log out from the system here.",
    "Browse all upcoming shows here. Click on a show to reserve seats.": "Browse all upcoming shows here. Click on a show to reserve seats.",
    "View all your current reservations here. You can cancel reservations if needed.": "View all your current reservations here. You can cancel reservations if needed.",
    
    // Show page
    "This is the seat map. Choose your seats by clicking on them.": "This is the seat map. Choose your seats by clicking on them.",
    "Legend shows available, reserved, and your selected seats.": "Legend shows available, reserved, and your selected seats.",
    "Two sections are available: Balcony (B) and Downstairs (D).": "Two sections are available: Balcony (B) and Downstairs (D).",
    "Exit locations are marked for your safety awareness.": "Exit locations are marked for your safety awareness.",
    "Click here to confirm your reservation after selecting seats.": "Click here to confirm your reservation after selecting seats.",
    
    // Admin page
    "Navigation between different management sections.": "Navigation between different management sections.",
    "Create and manage shows, set dates, and upload poster images.": "Create and manage shows, set dates, and upload poster images.",
    "Create and manage user accounts, reset passwords, and set seat limits.": "Create and manage user accounts, reset passwords, and set seat limits.",
    "View and manage all reservations across the system.": "View and manage all reservations across the system.",
    
    // Profile page
    "Update your profile information here.": "Update your profile information here.",
    "Change your password to maintain security.": "Change your password to maintain security.",
  },
  auth: {
    username: "Username",
    password: "Password",
    confirmPassword: "Confirm Password",
    email: "Email",
    name: "Name",
    loginTitle: "Login to your account",
    registerTitle: "Create a new account",
    registerCta: "Don't have an account? Contact admin",
    loginCta: "Already have an account? Login",
    loginButton: "Login",
    registerButton: "Register",
    forgotPassword: "Forgot password?",
    rememberMe: "Remember me",
    loginError: "Invalid username or password",
    registerError: "Username already exists",
    passwordMismatch: "Passwords do not match",
    secureAccess: "Secure access",
    secureAccessDescription: "High-security authentication system",
    realTimeUpdate: "Real-time updates",
    realTimeUpdateDescription: "Instant seat availability status",
  },
  home: {
    upcomingShows: "Upcoming Shows",
    noShows: "No upcoming shows",
    bookTickets: "Reserve Seats",
    viewDetails: "View Details",
    yourReservations: "Your Reservations",
    noReservations: "You have no reservations",
    viewReservation: "View Reservation",
    cancelReservation: "Reservation cancelled successfully",
    cancelReservationTitle: "Cancel Reservation",
    cancelReservationConfirmation: "Are you sure you want to cancel your reservation for {{showTitle}}? This action cannot be undone.",
  },
  show: {
    showDetails: "Show Details",
    title: "Title",
    date: "Date",
    time: "Time",
    duration: "Duration",
    description: "Description",
    genre: "Genre",
    director: "Director",
    cast: "Cast",
    price: "Price",
    availableSeats: "Available Seats",
    soldOut: "Sold Out",
    bookNow: "Reserve Now",
    selectSeats: "Select Seats",
    pastShow: "Past Show",
    pastShowDescription: "This show took place on {{date}} at {{time}}. Reservations are no longer available.",
    reservationsNotAvailable: "Reservations are not available for past shows.",
  },
  booking: {
    selectSeats: "Select Seats",
    selectedSeats: "Selected Seats",
    maxSeats: "Maximum seats allowed",
    continue: "Continue",
    confirmBooking: "Confirm Reservation",
    bookingSuccess: "Reservation successful",
    bookingError: "Reservation failed",
    seatUnavailable: "Seat unavailable",
    seatAlreadySelected: "Seat already selected",
    screen: "SCREEN",
    balcony: "UPSTAIRS BALCONY",
    seatTypes: {
      available: "Available",
      selected: "Selected",
      reserved: "Reserved",
      blocked: "Blocked",
    },
    exit: "EXIT",
  },
  admin: {
    dashboard: "Admin Dashboard",
    manageShows: "Manage Shows",
    manageUsers: "Manage Users",
    manageReservations: "Manage Reservations",
    addShow: "Add Show",
    editShow: "Edit Show",
    deleteShow: "Delete Show",
    addUser: "Add User",
    editUser: "Edit User",
    deleteUser: "Delete User",
    editReservation: "Edit Reservation",
    deleteReservation: "Delete Reservation",
    confirmDelete: "Are you sure you want to delete this?",
    cannotDelete: "Cannot delete this item",
    pastShowModificationsDisabled: "Past show - modifications disabled",
    backToHome: "Back to Home",
  },
  profile: {
    profileDetails: "Profile Details",
    updateProfile: "Update Profile",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    updateSuccess: "Profile updated successfully",
    updateError: "Failed to update profile",
    passwordChangeSuccess: "Password changed successfully",
    passwordChangeError: "Failed to change password",
  },
};

// Hindi translations
const hiTranslations = {
  common: {
    appName: "शाहबाज़ ऑडिटोरियम",
    welcome: "शाहबाज़ ऑडिटोरियम में आपका स्वागत है",
    login: "लॉगिन",
    register: "रजिस्टर",
    logout: "लॉगआउट",
    profile: "प्रोफाइल",
    admin: "एडमिन",
    home: "होम",
    error: "त्रुटि",
    success: "सफलता",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
    delete: "हटाएं",
    edit: "संपादित करें",
    save: "सहेजें",
    back: "वापस",
    next: "अगला",
    prev: "पिछला",
    loading: "लोड हो रहा है...",
    noDataFound: "कोई डेटा नहीं मिला",
    search: "खोज",
    filter: "फ़िल्टर",
    actions: "क्रियाएँ",
    view: "देखें",
    seats: "सीटें",
    morePages: "अधिक पृष्ठ",
    startTour: "इंटरैक्टिव गाइड शुरू करें",
  },
  tourGuide: {
    // Home page
    "Welcome to Shahbaaz Auditorium Seat Reservation System! This is the header area where you can navigate the application.": "शाहबाज़ ऑडिटोरियम सीट आरक्षण प्रणाली में आपका स्वागत है! यह हेडर क्षेत्र है जहां आप एप्लिकेशन को नेविगेट कर सकते हैं।",
    "Toggle between light and dark mode for your comfort.": "अपने आराम के लिए लाइट और डार्क मोड के बीच टॉगल करें।",
    "Switch between English and Hindi languages.": "अंग्रेजी और हिंदी भाषाओं के बीच स्विच करें।",
    "Access your profile or log out from the system here.": "यहां से अपने प्रोफाइल तक पहुंचें या सिस्टम से लॉग आउट करें।",
    "Browse all upcoming shows here. Click on a show to reserve seats.": "यहां सभी आगामी शो ब्राउज़ करें। सीटें आरक्षित करने के लिए शो पर क्लिक करें।",
    "View all your current reservations here. You can cancel reservations if needed.": "यहां अपने सभी वर्तमान आरक्षण देखें। आवश्यकता पड़ने पर आप आरक्षण रद्द कर सकते हैं।",
    
    // Show page
    "This is the seat map. Choose your seats by clicking on them.": "यह सीट मैप है। उन पर क्लिक करके अपनी सीटें चुनें।",
    "Legend shows available, reserved, and your selected seats.": "लीजेंड उपलब्ध, आरक्षित और आपकी चयनित सीटें दिखाता है।",
    "Two sections are available: Balcony (B) and Downstairs (D).": "दो सेक्शन उपलब्ध हैं: बालकनी (B) और नीचे (D)।",
    "Exit locations are marked for your safety awareness.": "आपकी सुरक्षा जागरूकता के लिए निकास स्थान चिह्नित हैं।",
    "Click here to confirm your reservation after selecting seats.": "सीटें चुनने के बाद अपना आरक्षण पुष्ट करने के लिए यहां क्लिक करें।",
    
    // Admin page
    "Navigation between different management sections.": "विभिन्न प्रबंधन अनुभागों के बीच नेविगेशन।",
    "Create and manage shows, set dates, and upload poster images.": "शो बनाएं और प्रबंधित करें, तिथियां सेट करें, और पोस्टर इमेज अपलोड करें।",
    "Create and manage user accounts, reset passwords, and set seat limits.": "उपयोगकर्ता खाते बनाएं और प्रबंधित करें, पासवर्ड रीसेट करें, और सीट सीमाएं सेट करें।",
    "View and manage all reservations across the system.": "सिस्टम भर में सभी आरक्षण देखें और प्रबंधित करें।",
    
    // Profile page
    "Update your profile information here.": "अपनी प्रोफाइल जानकारी यहां अपडेट करें।",
    "Change your password to maintain security.": "सुरक्षा बनाए रखने के लिए अपना पासवर्ड बदलें।",
  },
  auth: {
    username: "उपयोगकर्ता नाम",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    email: "ईमेल",
    name: "नाम",
    loginTitle: "अपने खाते में लॉगिन करें",
    registerTitle: "नया खाता बनाएं",
    registerCta: "क्या आपके पास अकाउंट नहीं है? एडमिन से संपर्क करें",
    loginCta: "पहले से खाता है? लॉगिन करें",
    loginButton: "लॉगिन",
    registerButton: "रजिस्टर",
    forgotPassword: "पासवर्ड भूल गए?",
    rememberMe: "मुझे याद रखें",
    loginError: "अमान्य उपयोगकर्ता नाम या पासवर्ड",
    registerError: "उपयोगकर्ता नाम पहले से मौजूद है",
    passwordMismatch: "पासवर्ड मेल नहीं खाते",
    secureAccess: "सुरक्षित पहुंच",
    secureAccessDescription: "उच्च सुरक्षा प्रमाणीकरण प्रणाली",
    realTimeUpdate: "वास्तविक समय अपडेट",
    realTimeUpdateDescription: "तत्काल सीट उपलब्धता स्थिति",
  },
  home: {
    upcomingShows: "आगामी शो",
    noShows: "कोई आगामी शो नहीं",
    bookTickets: "सीटें आरक्षित करें",
    viewDetails: "विवरण देखें",
    yourReservations: "आपके आरक्षण",
    noReservations: "आपके पास कोई आरक्षण नहीं है",
    viewReservation: "आरक्षण देखें",
    cancelReservation: "आरक्षण सफलतापूर्वक रद्द किया गया",
    cancelReservationTitle: "आरक्षण रद्द करें",
    cancelReservationConfirmation: "क्या आप वाकई {{showTitle}} के लिए अपना आरक्षण रद्द करना चाहते हैं? इस क्रिया को वापस नहीं किया जा सकता।",
  },
  show: {
    showDetails: "शो विवरण",
    title: "शीर्षक",
    date: "तारीख",
    time: "समय",
    duration: "अवधि",
    description: "विवरण",
    genre: "शैली",
    director: "निर्देशक",
    cast: "कलाकार",
    price: "कीमत",
    availableSeats: "उपलब्ध सीटें",
    soldOut: "बिक चुका है",
    bookNow: "अभी आरक्षित करें",
    selectSeats: "सीटें चुनें",
    pastShow: "बीता हुआ शो",
    pastShowDescription: "यह शो {{date}} को {{time}} पर हुआ था। आरक्षण अब उपलब्ध नहीं हैं।",
    reservationsNotAvailable: "पिछले शो के लिए आरक्षण उपलब्ध नहीं हैं।",
  },
  booking: {
    selectSeats: "सीटें चुनें",
    selectedSeats: "चयनित सीटें",
    maxSeats: "अधिकतम अनुमति सीटें",
    continue: "जारी रखें",
    confirmBooking: "आरक्षण की पुष्टि करें",
    bookingSuccess: "आरक्षण सफल",
    bookingError: "आरक्षण विफल",
    seatUnavailable: "सीट अनुपलब्ध",
    seatAlreadySelected: "सीट पहले से चयनित",
    screen: "स्क्रीन",
    balcony: "ऊपरी बालकनी",
    seatTypes: {
      available: "उपलब्ध",
      selected: "चयनित",
      reserved: "आरक्षित",
      blocked: "अवरुद्ध",
    },
    exit: "निकास",
  },
  admin: {
    dashboard: "एडमिन डैशबोर्ड",
    manageShows: "शो प्रबंधित करें",
    manageUsers: "उपयोगकर्ता प्रबंधित करें",
    manageReservations: "आरक्षण प्रबंधित करें",
    addShow: "शो जोड़ें",
    editShow: "शो संपादित करें",
    deleteShow: "शो हटाएं",
    addUser: "उपयोगकर्ता जोड़ें",
    editUser: "उपयोगकर्ता संपादित करें",
    deleteUser: "उपयोगकर्ता हटाएं",
    editReservation: "आरक्षण संपादित करें",
    deleteReservation: "आरक्षण हटाएं",
    confirmDelete: "क्या आप वाकई इसे हटाना चाहते हैं?",
    cannotDelete: "इस आइटम को हटाया नहीं जा सकता",
    pastShowModificationsDisabled: "पिछला शो - संशोधन अक्षम",
    backToHome: "होम पर वापस जाएं",
  },
  profile: {
    profileDetails: "प्रोफाइल विवरण",
    updateProfile: "प्रोफाइल अपडेट करें",
    changePassword: "पासवर्ड बदलें",
    currentPassword: "वर्तमान पासवर्ड",
    newPassword: "नया पासवर्ड",
    confirmNewPassword: "नए पासवर्ड की पुष्टि करें",
    updateSuccess: "प्रोफाइल सफलतापूर्वक अपडेट किया गया",
    updateError: "प्रोफाइल अपडेट करने में विफल",
    passwordChangeSuccess: "पासवर्ड सफलतापूर्वक बदला गया",
    passwordChangeError: "पासवर्ड बदलने में विफल",
  },
};

// First, define extended translation types
interface ExtendedCommonTranslation
  extends Partial<typeof enTranslations.common> {
  appName: string;
  welcome: string;
  login: string;
  register: string;
  logout: string;
  profile: string;
  admin: string;
  home: string;
  error: string;
  success: string;
  cancel: string;
  confirm: string;
  delete: string;
  edit: string;
  save: string;
  add: string;
  required: string;
  submit: string;
  date: string;
  time: string;
  price: string;
  seats: string;
  toThe: string;
  andTheir: string;
  configurations: string;
  system: string;
  back: string;
  next: string;
  prev: string;
  loading: string;
  noDataFound: string;
  search: string;
  filter: string;
  actions: string;
  view: string;
  morePages: string;
  startTour: string;
}

// Now update the common translations with the new keys
const extendedEnCommon: ExtendedCommonTranslation = {
  ...(enTranslations.common as any),
  toThe: "to the",
  andTheir: "and their",
  configurations: "configurations",
  system: "system",
  morePages: "More pages",
  add: "Add",
  required: "Required",
  submit: "Submit",
  date: "Date",
  time: "Time",
  price: "Price",
  startTour: "Start interactive guide",
};

const extendedHiCommon: ExtendedCommonTranslation = {
  ...(hiTranslations.common as any),
  toThe: "के लिए",
  andTheir: "और उनके",
  configurations: "विन्यास",
  system: "सिस्टम",
  morePages: "अधिक पृष्ठ",
  add: "जोड़ें",
  required: "आवश्यक",
  submit: "सबमिट करें",
  date: "दिनांक",
  time: "समय",
  price: "मूल्य",
  startTour: "इंटरैक्टिव गाइड शुरू करें",
};

// Replace the common objects with the extended versions
enTranslations.common = extendedEnCommon;
hiTranslations.common = extendedHiCommon;

// Restructure all translations to be flat, to match how they are used in components
const flattenTranslations = (translations: any, prefix = "") => {
  let result: Record<string, string> = {};

  for (const key in translations) {
    if (typeof translations[key] === "object" && translations[key] !== null) {
      const nestedKeys = flattenTranslations(
        translations[key],
        `${prefix}${key}.`,
      );
      result = { ...result, ...nestedKeys };
    } else {
      result[`${prefix}${key}`] = translations[key];
    }
  }

  return result;
};

// Create flattened resources
const flatEnResources = {
  translation: flattenTranslations({
    translation: {
      common: enTranslations.common,
      auth: enTranslations.auth,
      home: enTranslations.home,
      show: enTranslations.show,
      booking: enTranslations.booking,
      admin: enTranslations.admin,
      profile: enTranslations.profile,
      tourGuide: enTranslations.tourGuide,
    },
  }),
};

const flatHiResources = {
  translation: flattenTranslations({
    translation: {
      common: hiTranslations.common,
      auth: hiTranslations.auth,
      home: hiTranslations.home,
      show: hiTranslations.show,
      booking: hiTranslations.booking,
      admin: hiTranslations.admin,
      profile: hiTranslations.profile,
      tourGuide: hiTranslations.tourGuide,
    },
  }),
};

const resources = {
  en: flatEnResources,
  hi: flatHiResources,
};

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect language
  .use(initReactI18next) // Initialize react-i18next
  .init({
    resources,
    fallbackLng: "en", // Default language
    debug: true, // Enable debugging to see what's happening
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ["localStorage", "navigator"], // Detection order
      caches: ["localStorage"], // Cache user language
    },
  });

export default i18n;
