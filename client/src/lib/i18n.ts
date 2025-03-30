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
  },
  guide: {
    helpButton: "Interactive Guide",
    buttons: {
      back: "Back",
      close: "Close",
      finish: "Finish",
      next: "Next",
      skip: "Skip Tour"
    },
    menu: {
      title: "Interactive Guides",
      userGuide: "User Guide",
      adminGuide: "Admin Guide",
      seatGuide: "Seat Selection Guide",
      profileGuide: "Profile Guide",
      resetGuides: "Reset All Guides"
    },
    admin: {
      welcome: {
        title: "Admin Dashboard",
        content: "Welcome to the admin dashboard! Here you can manage shows, users, and reservations for Shahbaaz Auditorium."
      },
      tabs: {
        title: "Management Tabs",
        content: "Use these tabs to switch between different management areas. You can manage shows, users, and reservations."
      },
      shows: {
        title: "Show Management",
        content: "Create, edit, or delete upcoming shows. You can set show details including title, date, and customize seat layouts."
      },
      users: {
        title: "User Management",
        content: "Create and manage user accounts. You can set user permissions, seat limits, and enable/disable accounts."
      },
      reservations: {
        title: "Reservation Management",
        content: "View and manage all reservations. You can filter by show, edit seat assignments, or cancel reservations if needed."
      }
    },
    user: {
      welcome: {
        title: "Welcome to Shahbaaz Auditorium",
        content: "This is your home page where you can view upcoming shows and manage your seat reservations."
      },
      shows: {
        title: "Upcoming Shows",
        content: "Browse and view all upcoming shows. Click on a show to reserve seats."
      },
      reservations: {
        title: "Your Reservations",
        content: "View all your current seat reservations. You can see details about each reservation here."
      },
      actions: {
        title: "User Actions",
        content: "Access your profile settings, change language, toggle theme, or log out using these options."
      }
    },
    auth: {
      welcome: {
        title: "Authentication",
        content: "Welcome to the authentication page. You can login to your existing account or register a new account (if you're an admin)."
      },
      login: {
        title: "Login Form",
        content: "Enter your username and password to access your account and reserve seats for upcoming shows."
      },
      register: {
        title: "Registration",
        content: "Note: Only administrators can create new user accounts. If you need an account, please contact an administrator."
      }
    },
    seats: {
      welcome: {
        title: "Seat Selection",
        content: "Welcome to the seat selection page. Here you can select seats for your reservation."
      },
      grid: {
        title: "Seat Grid",
        content: "This is the interactive seat grid. Click on available seats to select them. The grid shows both Balcony (prefix B) and Downstairs (prefix D) sections."
      },
      legend: {
        title: "Seat Legend",
        content: "This legend explains the different seat states: available, selected, reserved by others, and blocked seats."
      },
      actions: {
        title: "Reservation Actions",
        content: "When you're done selecting seats, use these buttons to confirm your reservation or cancel and return to the home page."
      }
    },
    profile: {
      welcome: {
        title: "Your Profile",
        content: "Welcome to your profile page. Here you can view and update your account information."
      },
      info: {
        title: "Account Information",
        content: "View and edit your basic account information including email address and username."
      },
      password: {
        title: "Password Management",
        content: "Change your password here. You'll need to enter your current password for verification."
      }
    }
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
  },
  guide: {
    helpButton: "इंटरैक्टिव गाइड",
    buttons: {
      back: "पीछे",
      close: "बंद करें",
      finish: "समाप्त",
      next: "अगला",
      skip: "टूर छोड़ें"
    },
    menu: {
      title: "इंटरैक्टिव गाइड",
      userGuide: "उपयोगकर्ता गाइड",
      adminGuide: "एडमिन गाइड",
      seatGuide: "सीट चयन गाइड",
      profileGuide: "प्रोफाइल गाइड",
      resetGuides: "सभी गाइड रीसेट करें"
    },
    admin: {
      welcome: {
        title: "एडमिन डैशबोर्ड",
        content: "एडमिन डैशबोर्ड में आपका स्वागत है! यहां आप शहबाज़ ऑडिटोरियम के शो, उपयोगकर्ता और आरक्षण का प्रबंधन कर सकते हैं।"
      },
      tabs: {
        title: "प्रबंधन टैब",
        content: "विभिन्न प्रबंधन क्षेत्रों के बीच स्विच करने के लिए इन टैब का उपयोग करें। आप शो, उपयोगकर्ता और आरक्षण का प्रबंधन कर सकते हैं।"
      },
      shows: {
        title: "शो प्रबंधन",
        content: "आगामी शो बनाएं, संपादित करें या हटाएं। आप शो विवरण, तिथि और सीट लेआउट को अनुकूलित कर सकते हैं।"
      },
      users: {
        title: "उपयोगकर्ता प्रबंधन",
        content: "उपयोगकर्ता खाते बनाएं और प्रबंधित करें। आप उपयोगकर्ता अनुमतियां, सीट सीमाएं और खाते को सक्षम/अक्षम कर सकते हैं।"
      },
      reservations: {
        title: "आरक्षण प्रबंधन",
        content: "सभी आरक्षण देखें और प्रबंधित करें। आप शो के अनुसार फ़िल्टर कर सकते हैं, सीट असाइनमेंट संपादित कर सकते हैं, या यदि आवश्यक हो तो आरक्षण रद्द कर सकते हैं।"
      }
    },
    user: {
      welcome: {
        title: "शहबाज़ ऑडिटोरियम में आपका स्वागत है",
        content: "यह आपका होम पेज है जहां आप आगामी शो देख सकते हैं और अपने सीट आरक्षण का प्रबंधन कर सकते हैं।"
      },
      shows: {
        title: "आगामी शो",
        content: "सभी आगामी शो ब्राउज़ करें और देखें। सीट आरक्षित करने के लिए किसी शो पर क्लिक करें।"
      },
      reservations: {
        title: "आपके आरक्षण",
        content: "अपने सभी वर्तमान सीट आरक्षण देखें। आप यहां प्रत्येक आरक्षण के बारे में विवरण देख सकते हैं।"
      },
      actions: {
        title: "उपयोगकर्ता कार्य",
        content: "इन विकल्पों का उपयोग करके अपनी प्रोफ़ाइल सेटिंग्स तक पहुंचें, भाषा बदलें, थीम टॉगल करें, या लॉग आउट करें।"
      }
    },
    auth: {
      welcome: {
        title: "प्रमाणीकरण",
        content: "प्रमाणीकरण पेज में आपका स्वागत है। आप अपने मौजूदा खाते में लॉगिन कर सकते हैं या नया खाता पंजीकृत कर सकते हैं (यदि आप एडमिन हैं)।"
      },
      login: {
        title: "लॉगिन फॉर्म",
        content: "अपने खाते तक पहुंचने और आगामी शो के लिए सीटें आरक्षित करने के लिए अपना उपयोगकर्ता नाम और पासवर्ड दर्ज करें।"
      },
      register: {
        title: "पंजीकरण",
        content: "नोट: केवल व्यवस्थापक ही नए उपयोगकर्ता खाते बना सकते हैं। यदि आपको खाते की आवश्यकता है, तो कृपया किसी व्यवस्थापक से संपर्क करें।"
      }
    },
    seats: {
      welcome: {
        title: "सीट चयन",
        content: "सीट चयन पृष्ठ में आपका स्वागत है। यहां आप अपने आरक्षण के लिए सीटें चुन सकते हैं।"
      },
      grid: {
        title: "सीट ग्रिड",
        content: "यह इंटरैक्टिव सीट ग्रिड है। उन्हें चुनने के लिए उपलब्ध सीटों पर क्लिक करें। ग्रिड बालकनी (उपसर्ग B) और नीचे की मंजिल (उपसर्ग D) दोनों अनुभागों को दिखाता है।"
      },
      legend: {
        title: "सीट प्रतीक",
        content: "यह प्रतीक विभिन्न सीट स्थितियों की व्याख्या करता है: उपलब्ध, चयनित, दूसरों द्वारा आरक्षित और अवरुद्ध सीटें।"
      },
      actions: {
        title: "आरक्षण कार्य",
        content: "जब आप सीटें चुनना समाप्त कर लें, तो अपने आरक्षण की पुष्टि करने या रद्द करने और होम पेज पर वापस जाने के लिए इन बटनों का उपयोग करें।"
      }
    },
    profile: {
      welcome: {
        title: "आपकी प्रोफ़ाइल",
        content: "आपकी प्रोफ़ाइल पृष्ठ में आपका स्वागत है। यहां आप अपनी खाता जानकारी देख और अपडेट कर सकते हैं।"
      },
      info: {
        title: "खाता जानकारी",
        content: "अपनी बुनियादी खाता जानकारी देखें और संपादित करें, जिसमें ईमेल पता और उपयोगकर्ता नाम शामिल हैं।"
      },
      password: {
        title: "पासवर्ड प्रबंधन",
        content: "यहां अपना पासवर्ड बदलें। सत्यापन के लिए आपको अपना वर्तमान पासवर्ड दर्ज करना होगा।"
      }
    }
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
      guide: enTranslations.guide,
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
      guide: hiTranslations.guide,
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
