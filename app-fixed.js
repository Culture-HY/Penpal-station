console.log("app-fixed.js 실행됨");

// =======================================================
// PenPal Station
// Vanilla JS + Firebase Authentication + Firestore
// =======================================================

// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
  initializeFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-functions.js";

// =======================================================
// Firebase Config
// =======================================================

const firebaseConfig = {
  apiKey: "AIzaSyAbJGNBeiO13_YhnYVornnGUzNaeu4mJkA",
  authDomain: "world-penpal-station.firebaseapp.com",
  projectId: "world-penpal-station",
  storageBucket: "world-penpal-station.firebasestorage.app",
  messagingSenderId: "947512205365",
  appId: "1:947512205365:web:fbf347624f546f8569917c",
  measurementId: "G-1VWSBHNW42"
};

// =======================================================
// Firebase 초기화
// 중요: Firebase 콘솔의 Firestore DB 이름이 default이므로,
// getFirestore(app)가 아니라 initializeFirestore(app, 설정, "default")를 사용함
// =======================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});
const functions = getFunctions(app, "us-central1");
const translateTextFunction = httpsCallable(functions, "translateText");


// =======================================================
// DOM
// =======================================================

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

const logoutBtn = document.getElementById("logoutBtn");
const loginError = document.getElementById("loginError");


const languageSelect = document.getElementById("languageSelect");
const darkModeBtn = document.getElementById("darkModeBtn");
const darkModeIcon = document.getElementById("darkModeIcon");
const pointCount = document.getElementById("pointCount");
const writerTranslationInput = document.getElementById("writerTranslationInput");

const mobileWriteBtn = document.getElementById("mobileWriteBtn");
const mobileFormCloseBtn = document.getElementById("mobileFormCloseBtn");
const letterFormPanel = document.querySelector(".letter-form-panel");
const letterForm = document.getElementById("letterForm");
const titleInput = document.getElementById("titleInput");
const nationalityInput = document.getElementById("nationalityInput");
const emotionInput = document.getElementById("emotionInput");
const contentInput = document.getElementById("contentInput");


const searchInput = document.getElementById("searchInput");
const nationalityFilter = document.getElementById("nationalityFilter");
const emotionFilter = document.getElementById("emotionFilter");
const sortSelect = document.getElementById("sortSelect");
const letterCount = document.getElementById("letterCount");
const letterList = document.getElementById("letterList");
const emptyState = document.getElementById("emptyState");

const loadingOverlay = document.getElementById("loadingOverlay");
const toastContainer = document.getElementById("toastContainer");

const letterModal = document.getElementById("letterModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalEmotion = document.getElementById("modalEmotion");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalContent = document.getElementById("modalContent");
const writerTranslationSection = document.getElementById("writerTranslationSection");
const writerTranslationContent = document.getElementById("writerTranslationContent");
const commentSection = document.getElementById("commentSection");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");
const commentList = document.getElementById("commentList");
const commentAccessText = document.getElementById("commentAccessText");
const nationalitySettingBtn = document.getElementById("nationalitySettingBtn");
const userNationalityFlag = document.getElementById("userNationalityFlag");
const userNationalityText = document.getElementById("userNationalityText");

const nationalityModal = document.getElementById("nationalityModal");
const nationalityModalCloseBtn = document.getElementById("nationalityModalCloseBtn");
const nationalityOptions = document.getElementById("nationalityOptions");
const saveNationalityBtn = document.getElementById("saveNationalityBtn");
const nationalityModalNotice = document.getElementById("nationalityModalNotice");
const openNationalityFromFormBtn = document.getElementById("openNationalityFromFormBtn");
const formNationalityFlag = document.getElementById("formNationalityFlag");
const formNationalityText = document.getElementById("formNationalityText");
const contentCount = document.getElementById("contentCount");

// =======================================================
// Global State
// =======================================================

let currentUser = null;
let currentUserData = null;
let allLetters = [];

let unsubscribeUser = null;
let unsubscribeLetters = null;
let unsubscribeComments = null;

let activeLetterId = null;
let activeLetterCanComment = false;
let selectedNationalityCode = null;
let nationalityModalLocked = false;
let isSubmittingComment = false;

let currentLanguage = localStorage.getItem("penpal-language") || "en";
let isDarkMode = localStorage.getItem("penpal-dark-mode") === "true";

// =======================================================
// 다국어 텍스트
// =======================================================

const translations = {
  en: {
    appTitle: "PenPal Station",
    slogan: "Connect through letters, understand through cultures.",
    loginDescription:
      "Read and write anonymous international letters after Google login. Only nationality is shown.",
    googleLogin: "Continue with Google",
    loading: "Loading...",
    pointsLabel: "Points",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    logout: "Logout",
    searchFilterTitle: "Search & Filter Letters",
    totalLetters: "Total letters",
    searchPlaceholder: "Search by title",
    allNationalities: "All nationalities",
    allEmotions: "All emotions",
    newest: "Newest first",
    oldest: "Oldest first",
    writeLetterTitle: "Write a Letter",
    writeLetterSubtitle: "Share your thoughts and earn 1 point.",
    letterTitleLabel: "Letter Title",
    letterTitlePlaceholder: "Write a warm title",
    nationalityLabel: "Nationality",
    nationalityPlaceholder: "Example: Korea, Vietnam, Japan",
    emotionLabel: "Emotion Tag",
    selectEmotion: "Select emotion",
    contentLabel: "Letter Content",
    contentPlaceholder: "Write your anonymous letter here...",
    uploadLetter: "Upload Letter",
    letterListTitle: "Letter List",
    letterListSubtitle: "Open a letter by spending 1 point.",
    emptyLetters: "No letters have been registered.",
    readLetter: "Read Letter",
    dateLabel: "Date",
    nationalityMeta: "Nationality",
    requiredError: "Please fill in all required fields.",
    uploadSuccess: "Your letter has been uploaded. You earned 1 point.",
    uploadFail: "Failed to upload the letter. Please try again.",
    loginFail: "Google login failed. Please try again.",
    logoutFail: "Logout failed. Please try again.",
    readFail: "Failed to read the letter. Please try again.",
    pointLack: "You need points to read letters. Write a letter to earn points.",
    networkError: "Network error. Please check your connection.",
    firestoreReadFail: "Failed to load Firestore data.",
    firestoreConnectFail:
      "Login succeeded, but Firestore connection failed. Please check the database settings.",
    translateFail:
      "Translation is not available yet, so the original letter is shown.",
    Happy: "Happy",
    Excited: "Excited",
    Thankful: "Thankful",
    Curious: "Curious",
    Worried: "Worried",
    Lonely: "Lonely",
    Sad: "Sad",
    Hopeful: "Hopeful"
  },

  ko: {
    appTitle: "펜팔 스테이션",
    slogan: "편지로 연결되고, 문화로 서로를 이해합니다.",
    loginDescription:
      "구글 로그인 후 익명의 국제 편지를 읽고 쓸 수 있습니다. 이름은 공개되지 않고 국적만 표시됩니다.",
    googleLogin: "Google로 계속하기",
    loading: "불러오는 중...",
    pointsLabel: "포인트",
    darkMode: "다크모드",
    lightMode: "라이트모드",
    logout: "로그아웃",
    searchFilterTitle: "편지 검색 및 필터",
    totalLetters: "전체 편지",
    searchPlaceholder: "제목으로 검색",
    allNationalities: "전체 국적",
    allEmotions: "전체 감정",
    newest: "최신순",
    oldest: "오래된순",
    writeLetterTitle: "편지 작성",
    writeLetterSubtitle: "생각을 나누고 1포인트를 얻어보세요.",
    letterTitleLabel: "편지 제목",
    letterTitlePlaceholder: "따뜻한 제목을 적어주세요",
    nationalityLabel: "국적",
    nationalityPlaceholder: "예: Korea, Vietnam, Japan",
    emotionLabel: "감정 태그",
    selectEmotion: "감정을 선택하세요",
    contentLabel: "편지 내용",
    contentPlaceholder: "익명 편지를 작성해주세요...",
    uploadLetter: "편지 올리기",
    letterListTitle: "편지 목록",
    letterListSubtitle: "1포인트를 사용해 편지를 열어보세요.",
    emptyLetters: "등록된 편지가 없습니다.",
    readLetter: "편지 읽기",
    dateLabel: "작성일",
    nationalityMeta: "국적",
    requiredError: "필수 항목을 모두 입력해주세요.",
    uploadSuccess: "편지가 업로드되었습니다. 1포인트를 얻었습니다.",
    uploadFail: "편지 저장에 실패했습니다. 다시 시도해주세요.",
    loginFail: "Google 로그인에 실패했습니다. 다시 시도해주세요.",
    logoutFail: "로그아웃에 실패했습니다. 다시 시도해주세요.",
    readFail: "편지를 읽는 데 실패했습니다. 다시 시도해주세요.",
    pointLack:
      "편지를 읽으려면 포인트가 필요합니다. 편지를 작성해 포인트를 얻으세요.",
    networkError: "네트워크 오류입니다. 연결 상태를 확인해주세요.",
    firestoreReadFail: "Firestore 데이터를 불러오지 못했습니다.",
    firestoreConnectFail:
      "로그인은 되었지만 Firestore 연결에 실패했습니다. 데이터베이스 설정을 확인해주세요.",
    translateFail: "아직 번역 기능이 연결되지 않아 원문을 표시합니다.",
    Happy: "행복함",
    Excited: "신남",
    Thankful: "감사함",
    Curious: "궁금함",
    Worried: "걱정됨",
    Lonely: "외로움",
    Sad: "슬픔",
    Hopeful: "희망적"
  },

  es: {
    appTitle: "Estación PenPal",
    slogan: "Conecta con cartas, comprende con culturas.",
    loginDescription:
      "Lee y escribe cartas internacionales anónimas después de iniciar sesión con Google. Solo se muestra la nacionalidad.",
    googleLogin: "Continuar con Google",
    loading: "Cargando...",
    pointsLabel: "Puntos",
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    logout: "Cerrar sesión",
    searchFilterTitle: "Buscar y filtrar cartas",
    totalLetters: "Cartas totales",
    searchPlaceholder: "Buscar por título",
    allNationalities: "Todas las nacionalidades",
    allEmotions: "Todas las emociones",
    newest: "Más recientes",
    oldest: "Más antiguas",
    writeLetterTitle: "Escribir una carta",
    writeLetterSubtitle: "Comparte tus pensamientos y gana 1 punto.",
    letterTitleLabel: "Título de la carta",
    letterTitlePlaceholder: "Escribe un título cálido",
    nationalityLabel: "Nacionalidad",
    nationalityPlaceholder: "Ejemplo: Korea, Vietnam, Japan",
    emotionLabel: "Etiqueta emocional",
    selectEmotion: "Selecciona una emoción",
    contentLabel: "Contenido de la carta",
    contentPlaceholder: "Escribe tu carta anónima aquí...",
    uploadLetter: "Subir carta",
    letterListTitle: "Lista de cartas",
    letterListSubtitle: "Abre una carta usando 1 punto.",
    emptyLetters: "No hay cartas registradas.",
    readLetter: "Leer carta",
    dateLabel: "Fecha",
    nationalityMeta: "Nacionalidad",
    requiredError: "Completa todos los campos obligatorios.",
    uploadSuccess: "Tu carta se ha subido. Ganaste 1 punto.",
    uploadFail: "No se pudo subir la carta. Inténtalo de nuevo.",
    loginFail: "Error al iniciar sesión con Google.",
    logoutFail: "Error al cerrar sesión.",
    readFail: "No se pudo leer la carta.",
    pointLack:
      "Necesitas puntos para leer cartas. Escribe una carta para ganar puntos.",
    networkError: "Error de red. Revisa tu conexión.",
    firestoreReadFail: "No se pudieron cargar los datos de Firestore.",
    firestoreConnectFail:
      "El inicio de sesión funcionó, pero falló la conexión con Firestore.",
    translateFail:
      "La traducción aún no está disponible, se muestra el texto original.",
    Happy: "Feliz",
    Excited: "Emocionado",
    Thankful: "Agradecido",
    Curious: "Curioso",
    Worried: "Preocupado",
    Lonely: "Solitario",
    Sad: "Triste",
    Hopeful: "Esperanzado"
  },

  vi: {
    appTitle: "Trạm PenPal",
    slogan: "Kết nối qua thư, thấu hiểu qua văn hóa.",
    loginDescription:
      "Đọc và viết thư quốc tế ẩn danh sau khi đăng nhập Google. Chỉ quốc tịch được hiển thị.",
    googleLogin: "Tiếp tục với Google",
    loading: "Đang tải...",
    pointsLabel: "Điểm",
    darkMode: "Chế độ tối",
    lightMode: "Chế độ sáng",
    logout: "Đăng xuất",
    searchFilterTitle: "Tìm kiếm và lọc thư",
    totalLetters: "Tổng số thư",
    searchPlaceholder: "Tìm theo tiêu đề",
    allNationalities: "Tất cả quốc tịch",
    allEmotions: "Tất cả cảm xúc",
    newest: "Mới nhất",
    oldest: "Cũ nhất",
    writeLetterTitle: "Viết thư",
    writeLetterSubtitle: "Chia sẻ suy nghĩ và nhận 1 điểm.",
    letterTitleLabel: "Tiêu đề thư",
    letterTitlePlaceholder: "Viết một tiêu đề ấm áp",
    nationalityLabel: "Quốc tịch",
    nationalityPlaceholder: "Ví dụ: Korea, Vietnam, Japan",
    emotionLabel: "Thẻ cảm xúc",
    selectEmotion: "Chọn cảm xúc",
    contentLabel: "Nội dung thư",
    contentPlaceholder: "Viết lá thư ẩn danh của bạn tại đây...",
    uploadLetter: "Đăng thư",
    letterListTitle: "Danh sách thư",
    letterListSubtitle: "Mở một lá thư bằng 1 điểm.",
    emptyLetters: "Chưa có thư nào được đăng.",
    readLetter: "Đọc thư",
    dateLabel: "Ngày",
    nationalityMeta: "Quốc tịch",
    requiredError: "Vui lòng điền tất cả mục bắt buộc.",
    uploadSuccess: "Thư đã được đăng. Bạn nhận được 1 điểm.",
    uploadFail: "Không thể đăng thư. Vui lòng thử lại.",
    loginFail: "Đăng nhập Google thất bại.",
    logoutFail: "Đăng xuất thất bại.",
    readFail: "Không thể đọc thư.",
    pointLack: "Bạn cần điểm để đọc thư. Hãy viết thư để nhận điểm.",
    networkError: "Lỗi mạng. Vui lòng kiểm tra kết nối.",
    firestoreReadFail: "Không thể tải dữ liệu Firestore.",
    firestoreConnectFail:
      "Đăng nhập thành công nhưng kết nối Firestore thất bại.",
    translateFail: "Chưa có bản dịch, đang hiển thị bản gốc.",
    Happy: "Vui vẻ",
    Excited: "Hào hứng",
    Thankful: "Biết ơn",
    Curious: "Tò mò",
    Worried: "Lo lắng",
    Lonely: "Cô đơn",
    Sad: "Buồn",
    Hopeful: "Hy vọng"
  },

  ru: {
    appTitle: "Станция PenPal",
    slogan: "Соединяемся через письма, понимаем через культуры.",
    loginDescription:
      "Читайте и пишите анонимные международные письма после входа через Google. Отображается только национальность.",
    googleLogin: "Продолжить с Google",
    loading: "Загрузка...",
    pointsLabel: "Баллы",
    darkMode: "Темная тема",
    lightMode: "Светлая тема",
    logout: "Выйти",
    searchFilterTitle: "Поиск и фильтр писем",
    totalLetters: "Всего писем",
    searchPlaceholder: "Поиск по названию",
    allNationalities: "Все национальности",
    allEmotions: "Все эмоции",
    newest: "Сначала новые",
    oldest: "Сначала старые",
    writeLetterTitle: "Написать письмо",
    writeLetterSubtitle: "Поделитесь мыслями и получите 1 балл.",
    letterTitleLabel: "Название письма",
    letterTitlePlaceholder: "Напишите теплое название",
    nationalityLabel: "Национальность",
    nationalityPlaceholder: "Например: Korea, Vietnam, Japan",
    emotionLabel: "Эмоция",
    selectEmotion: "Выберите эмоцию",
    contentLabel: "Текст письма",
    contentPlaceholder: "Напишите анонимное письмо здесь...",
    uploadLetter: "Опубликовать письмо",
    letterListTitle: "Список писем",
    letterListSubtitle: "Откройте письмо за 1 балл.",
    emptyLetters: "Писем пока нет.",
    readLetter: "Читать письмо",
    dateLabel: "Дата",
    nationalityMeta: "Национальность",
    requiredError: "Заполните все обязательные поля.",
    uploadSuccess: "Письмо опубликовано. Вы получили 1 балл.",
    uploadFail: "Не удалось опубликовать письмо.",
    loginFail: "Ошибка входа через Google.",
    logoutFail: "Ошибка выхода.",
    readFail: "Не удалось прочитать письмо.",
    pointLack:
      "Вам нужны баллы, чтобы читать письма. Напишите письмо, чтобы получить баллы.",
    networkError: "Ошибка сети. Проверьте подключение.",
    firestoreReadFail: "Не удалось загрузить данные Firestore.",
    firestoreConnectFail:
      "Вход выполнен, но подключение к Firestore не удалось.",
    translateFail: "Перевод пока недоступен, показан оригинал.",
    Happy: "Радость",
    Excited: "Волнение",
    Thankful: "Благодарность",
    Curious: "Любопытство",
    Worried: "Тревога",
    Lonely: "Одиночество",
    Sad: "Грусть",
    Hopeful: "Надежда"
  },

  my: {
    appTitle: "PenPal Station",
    slogan: "စာများဖြင့် ချိတ်ဆက်ပြီး ယဉ်ကျေးမှုများဖြင့် နားလည်ပါ။",
    loginDescription:
      "Google Login ပြီးနောက် အမည်မဖော်သော နိုင်ငံတကာစာများကို ဖတ်နိုင်၊ ရေးနိုင်ပါသည်။ နိုင်ငံသားအချက်အလက်သာ ပြပါမည်။",
    googleLogin: "Google ဖြင့် ဆက်လက်ဝင်မည်",
    loading: "ဖတ်နေသည်...",
    pointsLabel: "ပွိုင့်",
    darkMode: "အမှောင်မုဒ်",
    lightMode: "အလင်းမုဒ်",
    logout: "ထွက်မည်",
    searchFilterTitle: "စာရှာဖွေခြင်းနှင့် စစ်ထုတ်ခြင်း",
    totalLetters: "စုစုပေါင်းစာ",
    searchPlaceholder: "ခေါင်းစဉ်ဖြင့် ရှာရန်",
    allNationalities: "နိုင်ငံသားအားလုံး",
    allEmotions: "ခံစားချက်အားလုံး",
    newest: "နောက်ဆုံးတင်ထားသော",
    oldest: "အဟောင်းဆုံး",
    writeLetterTitle: "စာရေးရန်",
    writeLetterSubtitle: "သင့်အတွေးများကို မျှဝေပြီး ၁ ပွိုင့်ရယူပါ။",
    letterTitleLabel: "စာခေါင်းစဉ်",
    letterTitlePlaceholder: "နွေးထွေးသော ခေါင်းစဉ်ရေးပါ",
    nationalityLabel: "နိုင်ငံသား",
    nationalityPlaceholder: "ဥပမာ: Korea, Vietnam, Japan",
    emotionLabel: "ခံစားချက်",
    selectEmotion: "ခံစားချက်ရွေးပါ",
    contentLabel: "စာအကြောင်းအရာ",
    contentPlaceholder: "အမည်မဖော်သောစာကို ဒီမှာရေးပါ...",
    uploadLetter: "စာတင်မည်",
    letterListTitle: "စာရင်း",
    letterListSubtitle: "၁ ပွိုင့်သုံးပြီး စာဖတ်ပါ။",
    emptyLetters: "တင်ထားသောစာ မရှိသေးပါ။",
    readLetter: "စာဖတ်မည်",
    dateLabel: "နေ့စွဲ",
    nationalityMeta: "နိုင်ငံသား",
    requiredError: "လိုအပ်သောအချက်များအားလုံး ဖြည့်ပါ။",
    uploadSuccess: "စာတင်ပြီးပါပြီ။ ၁ ပွိုင့်ရရှိပါသည်။",
    uploadFail: "စာတင်၍ မရပါ။ ထပ်စမ်းပါ။",
    loginFail: "Google Login မအောင်မြင်ပါ။",
    logoutFail: "Logout မအောင်မြင်ပါ။",
    readFail: "စာဖတ်၍ မရပါ။",
    pointLack: "စာဖတ်ရန် ပွိုင့်လိုအပ်ပါသည်။ ပွိုင့်ရရန် စာရေးပါ။",
    networkError: "Network အမှားဖြစ်သည်။ Connection စစ်ပါ။",
    firestoreReadFail: "Firestore data မဖတ်နိုင်ပါ။",
    firestoreConnectFail:
      "Login အောင်မြင်သော်လည်း Firestore ချိတ်ဆက်မှု မအောင်မြင်ပါ။",
    translateFail: "ဘာသာပြန်မရသေးသောကြောင့် မူရင်းစာကို ပြထားပါသည်။",
    Happy: "ပျော်ရွှင်",
    Excited: "စိတ်လှုပ်ရှား",
    Thankful: "ကျေးဇူးတင်",
    Curious: "စိတ်ဝင်စား",
    Worried: "စိုးရိမ်",
    Lonely: "အထီးကျန်",
    Sad: "ဝမ်းနည်း",
    Hopeful: "မျှော်လင့်"
  },

  zh: {
    appTitle: "笔友驿站",
    slogan: "通过书信连接，通过文化理解。",
    loginDescription:
      "使用 Google 登录后，可以阅读和书写匿名国际信件。只显示国籍。",
    googleLogin: "使用 Google 继续",
    loading: "加载中...",
    pointsLabel: "积分",
    darkMode: "深色模式",
    lightMode: "浅色模式",
    logout: "退出登录",
    searchFilterTitle: "搜索与筛选信件",
    totalLetters: "信件总数",
    searchPlaceholder: "按标题搜索",
    allNationalities: "所有国籍",
    allEmotions: "所有情绪",
    newest: "最新优先",
    oldest: "最旧优先",
    writeLetterTitle: "写一封信",
    writeLetterSubtitle: "分享你的想法并获得 1 积分。",
    letterTitleLabel: "信件标题",
    letterTitlePlaceholder: "写一个温暖的标题",
    nationalityLabel: "国籍",
    nationalityPlaceholder: "例如：Korea, Vietnam, Japan",
    emotionLabel: "情绪标签",
    selectEmotion: "选择情绪",
    contentLabel: "信件内容",
    contentPlaceholder: "在这里写下你的匿名信...",
    uploadLetter: "上传信件",
    letterListTitle: "信件列表",
    letterListSubtitle: "使用 1 积分打开一封信。",
    emptyLetters: "暂无注册信件。",
    readLetter: "阅读信件",
    dateLabel: "日期",
    nationalityMeta: "国籍",
    requiredError: "请填写所有必填项。",
    uploadSuccess: "你的信件已上传。你获得了 1 积分。",
    uploadFail: "信件上传失败，请重试。",
    loginFail: "Google 登录失败。",
    logoutFail: "退出登录失败。",
    readFail: "读取信件失败。",
    pointLack: "你需要积分才能阅读信件。写一封信来获得积分。",
    networkError: "网络错误，请检查连接。",
    firestoreReadFail: "无法加载 Firestore 数据。",
    firestoreConnectFail: "登录成功，但 Firestore 连接失败。",
    translateFail: "翻译尚不可用，显示原文。",
    Happy: "开心",
    Excited: "兴奋",
    Thankful: "感谢",
    Curious: "好奇",
    Worried: "担心",
    Lonely: "孤独",
    Sad: "悲伤",
    Hopeful: "充满希望"
  },

  ja: {
    appTitle: "ペンパルステーション",
    slogan: "手紙でつながり、文化で理解する。",
    loginDescription:
      "Googleログイン後、匿名の国際手紙を読んだり書いたりできます。表示されるのは国籍のみです。",
    googleLogin: "Googleで続ける",
    loading: "読み込み中...",
    pointsLabel: "ポイント",
    darkMode: "ダークモード",
    lightMode: "ライトモード",
    logout: "ログアウト",
    searchFilterTitle: "手紙の検索とフィルター",
    totalLetters: "手紙の総数",
    searchPlaceholder: "タイトルで検索",
    allNationalities: "すべての国籍",
    allEmotions: "すべての感情",
    newest: "新しい順",
    oldest: "古い順",
    writeLetterTitle: "手紙を書く",
    writeLetterSubtitle: "思いを共有して1ポイントを獲得しましょう。",
    letterTitleLabel: "手紙のタイトル",
    letterTitlePlaceholder: "温かいタイトルを書いてください",
    nationalityLabel: "国籍",
    nationalityPlaceholder: "例: Korea, Vietnam, Japan",
    emotionLabel: "感情タグ",
    selectEmotion: "感情を選択",
    contentLabel: "手紙の内容",
    contentPlaceholder: "ここに匿名の手紙を書いてください...",
    uploadLetter: "手紙を投稿",
    letterListTitle: "手紙一覧",
    letterListSubtitle: "1ポイントを使って手紙を開きます。",
    emptyLetters: "登録された手紙はありません。",
    readLetter: "手紙を読む",
    dateLabel: "日付",
    nationalityMeta: "国籍",
    requiredError: "必須項目をすべて入力してください。",
    uploadSuccess: "手紙が投稿されました。1ポイントを獲得しました。",
    uploadFail: "手紙の投稿に失敗しました。",
    loginFail: "Googleログインに失敗しました。",
    logoutFail: "ログアウトに失敗しました。",
    readFail: "手紙の読み込みに失敗しました。",
    pointLack:
      "手紙を読むにはポイントが必要です。手紙を書いてポイントを獲得してください。",
    networkError: "ネットワークエラーです。接続を確認してください。",
    firestoreReadFail: "Firestoreデータを読み込めませんでした。",
    firestoreConnectFail:
      "ログインは成功しましたが、Firestore接続に失敗しました。",
    translateFail: "翻訳はまだ利用できないため、原文を表示します。",
    Happy: "幸せ",
    Excited: "ワクワク",
    Thankful: "感謝",
    Curious: "好奇心",
    Worried: "心配",
    Lonely: "孤独",
    Sad: "悲しい",
    Hopeful: "希望"
  }
};
// =======================================================
// Nationality Profile Data
// =======================================================

const ASIAN_NATIONALITIES = [
  { code: "KR", flag: "🇰🇷", name: "대한민국", en: "South Korea" },
  { code: "JP", flag: "🇯🇵", name: "日本", en: "Japan" },
  { code: "CN", flag: "🇨🇳", name: "中国", en: "China" },
  { code: "RU", flag: "🇷🇺", name: "Россия", en: "Russia" },
  { code: "VN", flag: "🇻🇳", name: "Việt Nam", en: "Vietnam" },
  { code: "MM", flag: "🇲🇲", name: "မြန်မာ", en: "Myanmar" },

  { code: "SG", flag: "🇸🇬", name: "Singapore", en: "Singapore" },
  { code: "PH", flag: "🇵🇭", name: "Philippines", en: "Philippines" },
  { code: "MY", flag: "🇲🇾", name: "Malaysia", en: "Malaysia" },
  { code: "BN", flag: "🇧🇳", name: "Brunei", en: "Brunei" },

  { code: "ID", flag: "🇮🇩", name: "Indonesia", en: "Indonesia" },
  { code: "TH", flag: "🇹🇭", name: "ประเทศไทย", en: "Thailand" },
  { code: "KH", flag: "🇰🇭", name: "កម្ពុជា", en: "Cambodia" },
  { code: "LA", flag: "🇱🇦", name: "ລາວ", en: "Laos" },
  { code: "MN", flag: "🇲🇳", name: "Монгол", en: "Mongolia" },

  { code: "IN", flag: "🇮🇳", name: "भारत", en: "India" },
  { code: "NP", flag: "🇳🇵", name: "नेपाल", en: "Nepal" },
  { code: "BD", flag: "🇧🇩", name: "বাংলাদেশ", en: "Bangladesh" },
  { code: "PK", flag: "🇵🇰", name: "پاکستان", en: "Pakistan" },
  { code: "LK", flag: "🇱🇰", name: "ශ්‍රී ලංකා", en: "Sri Lanka" }
];

function createProfileCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}
// =======================================================
// 추가 번역 문구
// 국적 선택, 읽은 편지, 다시 읽기, 삭제, 100자 제한 문구
// =======================================================

const extraTranslations = {
  en: {
    selectNationality: "Select nationality",
    viewedLetter: "Viewed",
    readAgain: "Read Again",
    minContentError: "Letter content must be at least 100 characters.",
    deleteLetter: "Delete",
    deleteSuccess: "Your letter has been deleted.",
    deleteFail: "Failed to delete the letter. Please try again.",
    deleteConfirm: "Do you want to delete this letter?",
    cannotDelete: "You can only delete letters you wrote."
  },

  ko: {
    selectNationality: "국적을 선택하세요",
    viewedLetter: "읽은 편지",
    readAgain: "다시 읽기",
    minContentError: "편지 내용은 최소 100자 이상 작성해야 합니다.",
    deleteLetter: "삭제",
    deleteSuccess: "내가 쓴 편지가 삭제되었습니다.",
    deleteFail: "편지 삭제에 실패했습니다. 다시 시도해주세요.",
    deleteConfirm: "이 편지를 삭제할까요?",
    cannotDelete: "본인이 작성한 편지만 삭제할 수 있습니다."
  },

  es: {
    selectNationality: "Selecciona nacionalidad",
    viewedLetter: "Leída",
    readAgain: "Leer de nuevo",
    minContentError: "El contenido debe tener al menos 100 caracteres.",
    deleteLetter: "Eliminar",
    deleteSuccess: "Tu carta ha sido eliminada.",
    deleteFail: "No se pudo eliminar la carta. Inténtalo de nuevo.",
    deleteConfirm: "¿Quieres eliminar esta carta?",
    cannotDelete: "Solo puedes eliminar las cartas que escribiste."
  },

  vi: {
    selectNationality: "Chọn quốc tịch",
    viewedLetter: "Đã đọc",
    readAgain: "Đọc lại",
    minContentError: "Nội dung thư phải có ít nhất 100 ký tự.",
    deleteLetter: "Xóa",
    deleteSuccess: "Thư của bạn đã được xóa.",
    deleteFail: "Không thể xóa thư. Vui lòng thử lại.",
    deleteConfirm: "Bạn có muốn xóa lá thư này không?",
    cannotDelete: "Bạn chỉ có thể xóa thư do mình viết."
  },

  ru: {
    selectNationality: "Выберите национальность",
    viewedLetter: "Прочитано",
    readAgain: "Прочитать снова",
    minContentError: "Текст письма должен быть не менее 100 символов.",
    deleteLetter: "Удалить",
    deleteSuccess: "Ваше письмо удалено.",
    deleteFail: "Не удалось удалить письмо. Попробуйте снова.",
    deleteConfirm: "Вы хотите удалить это письмо?",
    cannotDelete: "Вы можете удалить только свои письма."
  },

  my: {
    selectNationality: "နိုင်ငံသားရွေးပါ",
    viewedLetter: "ဖတ်ပြီးသောစာ",
    readAgain: "ထပ်ဖတ်မည်",
    minContentError: "စာအကြောင်းအရာသည် အနည်းဆုံး စာလုံး ၁၀၀ ရှိရပါမည်။",
    deleteLetter: "ဖျက်မည်",
    deleteSuccess: "သင်ရေးထားသောစာကို ဖျက်ပြီးပါပြီ။",
    deleteFail: "စာကို မဖျက်နိုင်ပါ။ ထပ်စမ်းပါ။",
    deleteConfirm: "ဒီစာကို ဖျက်လိုပါသလား?",
    cannotDelete: "မိမိရေးထားသောစာကိုသာ ဖျက်နိုင်ပါသည်။"
  },

  zh: {
    selectNationality: "选择国籍",
    viewedLetter: "已读",
    readAgain: "再次阅读",
    minContentError: "信件内容至少需要 100 个字符。",
    deleteLetter: "删除",
    deleteSuccess: "你的信件已删除。",
    deleteFail: "删除信件失败，请重试。",
    deleteConfirm: "要删除这封信吗？",
    cannotDelete: "你只能删除自己写的信。"
  },

  ja: {
    selectNationality: "国籍を選択",
    viewedLetter: "既読",
    readAgain: "もう一度読む",
    minContentError: "手紙の内容は100文字以上で入力してください。",
    deleteLetter: "削除",
    deleteSuccess: "あなたの手紙が削除されました。",
    deleteFail: "手紙の削除に失敗しました。もう一度お試しください。",
    deleteConfirm: "この手紙を削除しますか？",
    cannotDelete: "自分が書いた手紙だけ削除できます。"
  }
};

Object.keys(extraTranslations).forEach((languageCode) => {
  translations[languageCode] = {
    ...translations[languageCode],
    ...extraTranslations[languageCode]
  };
});
// =======================================================
// 포인트 제거 후 문구 수정
// =======================================================

const noPointTranslationPatch = {
  en: {
    loginDescription:
      "Read and write anonymous international letters. Only nationality is shown.",
    writeLetterSubtitle: "Share your thoughts with people around the world.",
    letterListSubtitle: "Open and read letters freely.",
    uploadSuccess: "Your letter has been uploaded.",
    minContentError: "Letter content must be at least 30 characters.",
    readLetter: "Read Letter",
    readAgain: "Read Again"
  },

  ko: {
    loginDescription:
      "익명의 국제 편지를 읽고 쓸 수 있습니다. 이름은 공개되지 않고 국적만 표시됩니다.",
    writeLetterSubtitle: "전 세계 사람들과 생각을 나눠보세요.",
    letterListSubtitle: "편지를 자유롭게 열어 읽어보세요.",
    uploadSuccess: "편지가 업로드되었습니다.",
    minContentError: "편지 내용은 최소 30자 이상 작성해야 합니다.",
    readLetter: "편지 읽기",
    readAgain: "다시 읽기"
  },

  es: {
    loginDescription:
      "Lee y escribe cartas internacionales anónimas. Solo se muestra la nacionalidad.",
    writeLetterSubtitle: "Comparte tus pensamientos con personas de todo el mundo.",
    letterListSubtitle: "Abre y lee cartas libremente.",
    uploadSuccess: "Tu carta ha sido subida.",
    minContentError: "El contenido debe tener al menos 30 caracteres.",
    readLetter: "Leer carta",
    readAgain: "Leer de nuevo"
  },

  vi: {
    loginDescription:
      "Đọc và viết thư quốc tế ẩn danh. Chỉ quốc tịch được hiển thị.",
    writeLetterSubtitle: "Chia sẻ suy nghĩ của bạn với mọi người trên thế giới.",
    letterListSubtitle: "Mở và đọc thư một cách tự do.",
    uploadSuccess: "Thư của bạn đã được đăng.",
    minContentError: "Nội dung thư phải có ít nhất 30 ký tự.",
    readLetter: "Đọc thư",
    readAgain: "Đọc lại"
  },

  ru: {
    loginDescription:
      "Читайте и пишите анонимные международные письма. Отображается только национальность.",
    writeLetterSubtitle: "Поделитесь мыслями с людьми по всему миру.",
    letterListSubtitle: "Открывайте и читайте письма свободно.",
    uploadSuccess: "Ваше письмо опубликовано.",
    minContentError: "Текст письма должен быть не менее 30 символов.",
    readLetter: "Читать письмо",
    readAgain: "Прочитать снова"
  },

  my: {
    loginDescription:
      "အမည်မဖော်သော နိုင်ငံတကာစာများကို ဖတ်နိုင်၊ ရေးနိုင်ပါသည်။ နိုင်ငံသားအချက်အလက်သာ ပြပါမည်။",
    writeLetterSubtitle: "ကမ္ဘာတစ်ဝန်းရှိ လူများနှင့် သင့်အတွေးများကို မျှဝေပါ။",
    letterListSubtitle: "စာများကို လွတ်လပ်စွာ ဖတ်နိုင်ပါသည်။",
    uploadSuccess: "စာတင်ပြီးပါပြီ။",
    minContentError: "စာအကြောင်းအရာသည် အနည်းဆုံး စာလုံး ၃၀ ရှိရပါမည်။",
    readLetter: "စာဖတ်မည်",
    readAgain: "ထပ်ဖတ်မည်"
  },

  zh: {
    loginDescription:
      "可以阅读和书写匿名国际信件。只显示国籍。",
    writeLetterSubtitle: "与世界各地的人分享你的想法。",
    letterListSubtitle: "自由打开并阅读信件。",
    uploadSuccess: "你的信件已上传。",
    minContentError: "信件内容至少需要 30 个字符。",
    readLetter: "阅读信件",
    readAgain: "再次阅读"
  },

  ja: {
    loginDescription:
      "匿名の国際手紙を読んだり書いたりできます。表示されるのは国籍のみです。",
    writeLetterSubtitle: "世界中の人とあなたの思いを共有しましょう。",
    letterListSubtitle: "手紙を自由に開いて読むことができます。",
    uploadSuccess: "手紙が投稿されました。",
    minContentError: "手紙の内容は30文字以上で入力してください。",
    readLetter: "手紙を読む",
    readAgain: "もう一度読む"
  }
};

Object.keys(noPointTranslationPatch).forEach((languageCode) => {
  translations[languageCode] = {
    ...translations[languageCode],
    ...noPointTranslationPatch[languageCode]
  };
});
// =======================================================
// 댓글 기능 번역 문구 추가
// =======================================================

const commentTranslations = {
  en: {
    commentsTitle: "Comments",
    commentPlaceholder: "Leave a warm comment...",
    postComment: "Post",
    commentEmpty: "No comments yet.",
    commentSuccess: "Your comment has been posted.",
    commentFail: "Failed to post the comment.",
    commentOnlyReaders: "Only readers can comment.",
    commentAvailable: "You can comment on this letter."
  },

  ko: {
    commentsTitle: "댓글",
    commentPlaceholder: "따뜻한 댓글을 남겨보세요...",
    postComment: "등록",
    commentEmpty: "아직 댓글이 없습니다.",
    commentSuccess: "댓글이 등록되었습니다.",
    commentFail: "댓글 등록에 실패했습니다.",
    commentOnlyReaders: "편지를 읽은 사람만 댓글을 달 수 있습니다.",
    commentAvailable: "이 편지에 댓글을 달 수 있습니다."
  },

  es: {
    commentsTitle: "Comentarios",
    commentPlaceholder: "Deja un comentario cálido...",
    postComment: "Publicar",
    commentEmpty: "Aún no hay comentarios.",
    commentSuccess: "Tu comentario ha sido publicado.",
    commentFail: "No se pudo publicar el comentario.",
    commentOnlyReaders: "Solo quienes leyeron la carta pueden comentar.",
    commentAvailable: "Puedes comentar en esta carta."
  },

  vi: {
    commentsTitle: "Bình luận",
    commentPlaceholder: "Để lại một bình luận ấm áp...",
    postComment: "Đăng",
    commentEmpty: "Chưa có bình luận nào.",
    commentSuccess: "Bình luận của bạn đã được đăng.",
    commentFail: "Không thể đăng bình luận.",
    commentOnlyReaders: "Chỉ người đã đọc thư mới có thể bình luận.",
    commentAvailable: "Bạn có thể bình luận về lá thư này."
  },

  ru: {
    commentsTitle: "Комментарии",
    commentPlaceholder: "Оставьте теплый комментарий...",
    postComment: "Отправить",
    commentEmpty: "Комментариев пока нет.",
    commentSuccess: "Ваш комментарий опубликован.",
    commentFail: "Не удалось опубликовать комментарий.",
    commentOnlyReaders: "Комментировать могут только читатели письма.",
    commentAvailable: "Вы можете оставить комментарий к этому письму."
  },

  my: {
    commentsTitle: "မှတ်ချက်များ",
    commentPlaceholder: "နွေးထွေးသော မှတ်ချက်ရေးပါ...",
    postComment: "တင်မည်",
    commentEmpty: "မှတ်ချက် မရှိသေးပါ။",
    commentSuccess: "သင့်မှတ်ချက် တင်ပြီးပါပြီ။",
    commentFail: "မှတ်ချက်တင်၍ မရပါ။",
    commentOnlyReaders: "စာဖတ်ပြီးသူများသာ မှတ်ချက်ရေးနိုင်ပါသည်။",
    commentAvailable: "ဤစာတွင် မှတ်ချက်ရေးနိုင်ပါသည်။"
  },

  zh: {
    commentsTitle: "评论",
    commentPlaceholder: "留下温暖的评论...",
    postComment: "发布",
    commentEmpty: "暂无评论。",
    commentSuccess: "你的评论已发布。",
    commentFail: "评论发布失败。",
    commentOnlyReaders: "只有读过这封信的人才能评论。",
    commentAvailable: "你可以评论这封信。"
  },

  ja: {
    commentsTitle: "コメント",
    commentPlaceholder: "温かいコメントを残してください...",
    postComment: "投稿",
    commentEmpty: "まだコメントはありません。",
    commentSuccess: "コメントが投稿されました。",
    commentFail: "コメントの投稿に失敗しました。",
    commentOnlyReaders: "手紙を読んだ人だけコメントできます。",
    commentAvailable: "この手紙にコメントできます。"
  }
};

Object.keys(commentTranslations).forEach((languageCode) => {
  translations[languageCode] = {
    ...translations[languageCode],
    ...commentTranslations[languageCode]
  };
});
// =======================================================
// 국적 설정 번역 문구 추가
// =======================================================

const profileTranslations = {
  en: {
    setNationality: "Set nationality",
    changeNationality: "Change nationality",
    chooseNationalityTitle: "Choose your nationality",
    chooseNationalityDesc:
      "Your name will not be shown. Only your nationality will appear.",
    saveNationality: "Save nationality",
    nationalitySaved: "Your nationality has been saved.",
    nationalityRequired: "Please choose your nationality first.",
    nationalityModalLock:
      "Please choose your nationality to continue using PenPal Station.",
    nationalityModalChangeGuide:
      "You can change your nationality if you selected it incorrectly.",
    currentNationality: "Nationality"
  },

  ko: {
    setNationality: "국적 설정",
    changeNationality: "국적 변경",
    chooseNationalityTitle: "국적을 선택해주세요",
    chooseNationalityDesc:
      "이름은 공개되지 않습니다. 사이트에는 국적만 표시됩니다.",
    saveNationality: "국적 저장하기",
    nationalitySaved: "국적이 저장되었습니다.",
    nationalityRequired: "먼저 국적을 선택해주세요.",
    nationalityModalLock:
      "PenPal Station을 이용하려면 국적을 먼저 선택해야 합니다.",
    nationalityModalChangeGuide:
      "잘못 선택했다면 여기서 국적을 다시 변경할 수 있습니다.",
    currentNationality: "내 국적"
  },

  es: {
    setNationality: "Configurar nacionalidad",
    changeNationality: "Cambiar nacionalidad",
    chooseNationalityTitle: "Elige tu nacionalidad",
    chooseNationalityDesc:
      "Tu nombre no se mostrará. Solo aparecerá tu nacionalidad.",
    saveNationality: "Guardar nacionalidad",
    nationalitySaved: "Tu nacionalidad ha sido guardada.",
    nationalityRequired: "Elige tu nacionalidad primero.",
    nationalityModalLock:
      "Elige tu nacionalidad para continuar usando PenPal Station.",
    nationalityModalChangeGuide:
      "Puedes cambiar tu nacionalidad si la elegiste por error.",
    currentNationality: "Nacionalidad"
  },

  vi: {
    setNationality: "Cài đặt quốc tịch",
    changeNationality: "Đổi quốc tịch",
    chooseNationalityTitle: "Chọn quốc tịch của bạn",
    chooseNationalityDesc:
      "Tên của bạn sẽ không hiển thị. Chỉ quốc tịch được hiển thị.",
    saveNationality: "Lưu quốc tịch",
    nationalitySaved: "Quốc tịch của bạn đã được lưu.",
    nationalityRequired: "Vui lòng chọn quốc tịch trước.",
    nationalityModalLock:
      "Vui lòng chọn quốc tịch để tiếp tục sử dụng PenPal Station.",
    nationalityModalChangeGuide:
      "Bạn có thể đổi quốc tịch nếu chọn nhầm.",
    currentNationality: "Quốc tịch"
  },

  ru: {
    setNationality: "Указать национальность",
    changeNationality: "Изменить национальность",
    chooseNationalityTitle: "Выберите национальность",
    chooseNationalityDesc:
      "Ваше имя не будет отображаться. Будет видна только национальность.",
    saveNationality: "Сохранить национальность",
    nationalitySaved: "Национальность сохранена.",
    nationalityRequired: "Сначала выберите национальность.",
    nationalityModalLock:
      "Выберите национальность, чтобы продолжить пользоваться PenPal Station.",
    nationalityModalChangeGuide:
      "Если вы выбрали неправильно, можно изменить национальность.",
    currentNationality: "Национальность"
  },

  my: {
    setNationality: "နိုင်ငံသား သတ်မှတ်ရန်",
    changeNationality: "နိုင်ငံသား ပြောင်းရန်",
    chooseNationalityTitle: "သင့်နိုင်ငံသားကို ရွေးပါ",
    chooseNationalityDesc:
      "သင့်အမည်ကို မပြပါ။ နိုင်ငံသားအချက်အလက်သာ ပြပါမည်။",
    saveNationality: "နိုင်ငံသား သိမ်းမည်",
    nationalitySaved: "နိုင်ငံသား သိမ်းပြီးပါပြီ။",
    nationalityRequired: "ပထမဆုံး နိုင်ငံသားရွေးပါ။",
    nationalityModalLock:
      "PenPal Station ကို ဆက်သုံးရန် နိုင်ငံသားရွေးရန် လိုအပ်ပါသည်။",
    nationalityModalChangeGuide:
      "မှားရွေးမိပါက နောက်မှ ပြောင်းနိုင်ပါသည်။",
    currentNationality: "နိုင်ငံသား"
  },

  zh: {
    setNationality: "设置国籍",
    changeNationality: "更改国籍",
    chooseNationalityTitle: "请选择你的国籍",
    chooseNationalityDesc:
      "你的姓名不会显示。网站只会显示国籍。",
    saveNationality: "保存国籍",
    nationalitySaved: "你的国籍已保存。",
    nationalityRequired: "请先选择国籍。",
    nationalityModalLock:
      "请先选择国籍，才能继续使用 PenPal Station。",
    nationalityModalChangeGuide:
      "如果选择错误，可以在这里重新更改国籍。",
    currentNationality: "国籍"
  },

  ja: {
    setNationality: "国籍を設定",
    changeNationality: "国籍を変更",
    chooseNationalityTitle: "国籍を選択してください",
    chooseNationalityDesc:
      "名前は表示されません。表示されるのは国籍のみです。",
    saveNationality: "国籍を保存",
    nationalitySaved: "国籍が保存されました。",
    nationalityRequired: "先に国籍を選択してください。",
    nationalityModalLock:
      "PenPal Stationを利用するには国籍を選択してください。",
    nationalityModalChangeGuide:
      "間違えて選択した場合は、ここで変更できます。",
    currentNationality: "国籍"
  }
};

Object.keys(profileTranslations).forEach((languageCode) => {
  translations[languageCode] = {
    ...translations[languageCode],
    ...profileTranslations[languageCode]
  };
});
// =======================================================
// UX 개선 번역 문구 추가
// =======================================================

const uxTranslations = {
  en: {
    autoNationalityTitle: "Your nationality",
    autoNationalityDesc: "Your profile nationality will be used automatically.",
    pointGuideTitle: "How points work",
    pointGuideWrite: "Write a letter to earn 1 point.",
    pointGuideRead: "Read a new letter by spending 1 point.",
    pointGuideAgain: "Already opened letters can be read again for free.",
    minimumCharacters: "minimum",
    myLetter: "My letter"
  },

  ko: {
    autoNationalityTitle: "내 국적",
    autoNationalityDesc: "프로필에 설정한 국적이 편지에 자동으로 저장됩니다.",
    pointGuideTitle: "포인트 이용 방법",
    pointGuideWrite: "편지를 작성하면 1포인트를 얻습니다.",
    pointGuideRead: "새 편지를 읽을 때 1포인트를 사용합니다.",
    pointGuideAgain: "이미 열어본 편지는 포인트 없이 다시 읽을 수 있습니다.",
    minimumCharacters: "최소",
    myLetter: "내 편지"
  },

  es: {
    autoNationalityTitle: "Tu nacionalidad",
    autoNationalityDesc: "Se usará automáticamente la nacionalidad de tu perfil.",
    pointGuideTitle: "Cómo funcionan los puntos",
    pointGuideWrite: "Escribe una carta para ganar 1 punto.",
    pointGuideRead: "Lee una carta nueva usando 1 punto.",
    pointGuideAgain: "Las cartas ya abiertas se pueden leer de nuevo gratis.",
    minimumCharacters: "mínimo",
    myLetter: "Mi carta"
  },

  vi: {
    autoNationalityTitle: "Quốc tịch của bạn",
    autoNationalityDesc: "Quốc tịch trong hồ sơ sẽ được dùng tự động.",
    pointGuideTitle: "Cách dùng điểm",
    pointGuideWrite: "Viết thư để nhận 1 điểm.",
    pointGuideRead: "Đọc thư mới bằng 1 điểm.",
    pointGuideAgain: "Thư đã mở có thể đọc lại miễn phí.",
    minimumCharacters: "tối thiểu",
    myLetter: "Thư của tôi"
  },

  ru: {
    autoNationalityTitle: "Ваша национальность",
    autoNationalityDesc: "Национальность профиля будет использована автоматически.",
    pointGuideTitle: "Как работают баллы",
    pointGuideWrite: "Напишите письмо, чтобы получить 1 балл.",
    pointGuideRead: "Новое письмо открывается за 1 балл.",
    pointGuideAgain: "Уже открытые письма можно читать снова бесплатно.",
    minimumCharacters: "минимум",
    myLetter: "Мое письмо"
  },

  my: {
    autoNationalityTitle: "သင့်နိုင်ငံသား",
    autoNationalityDesc: "Profile တွင် သတ်မှတ်ထားသော နိုင်ငံသားကို အလိုအလျောက် အသုံးပြုပါမည်။",
    pointGuideTitle: "ပွိုင့်အသုံးပြုပုံ",
    pointGuideWrite: "စာရေးပါက ၁ ပွိုင့်ရပါမည်။",
    pointGuideRead: "စာအသစ်ဖတ်ရန် ၁ ပွိုင့်သုံးပါမည်။",
    pointGuideAgain: "ဖတ်ပြီးသောစာများကို အခမဲ့ ထပ်ဖတ်နိုင်ပါသည်။",
    minimumCharacters: "အနည်းဆုံး",
    myLetter: "ကျွန်ုပ်၏စာ"
  },

  zh: {
    autoNationalityTitle: "你的国籍",
    autoNationalityDesc: "将自动使用个人资料中设置的国籍。",
    pointGuideTitle: "积分规则",
    pointGuideWrite: "写一封信可获得 1 积分。",
    pointGuideRead: "阅读新信件需要使用 1 积分。",
    pointGuideAgain: "已打开的信件可以免费再次阅读。",
    minimumCharacters: "最少",
    myLetter: "我的信"
  },

  ja: {
    autoNationalityTitle: "あなたの国籍",
    autoNationalityDesc: "プロフィールに設定した国籍が自動で使われます。",
    pointGuideTitle: "ポイントの使い方",
    pointGuideWrite: "手紙を書くと1ポイントを獲得します。",
    pointGuideRead: "新しい手紙を読むには1ポイントを使います。",
    pointGuideAgain: "一度開いた手紙は無料で再読できます。",
    minimumCharacters: "最低",
    myLetter: "自分の手紙"
  }
};

Object.keys(uxTranslations).forEach((languageCode) => {
  translations[languageCode] = {
    ...translations[languageCode],
    ...uxTranslations[languageCode]
  };
});
// =======================================================
// 작성자 직접 해석 문구 추가
// =======================================================

const manualTranslationTranslations = {
  en: {
    writerTranslationLabel: "Writer's Translation / Meaning",
    writerTranslationPlaceholder:
      "Optional: Write the meaning of your letter in another language...",
    writerTranslationHint:
      "This is optional, but it helps readers from other cultures understand your letter.",
    writerTranslationTitle: "Writer's Translation / Meaning"
  },

  ko: {
    writerTranslationLabel: "작성자 해석 / 의미",
    writerTranslationPlaceholder:
      "선택사항: 다른 언어로 편지의 의미를 적어주세요...",
    writerTranslationHint:
      "필수는 아니지만, 다른 문화권의 독자가 편지를 이해하는 데 도움이 됩니다.",
    writerTranslationTitle: "작성자 해석 / 의미"
  },

  es: {
    writerTranslationLabel: "Traducción / significado del autor",
    writerTranslationPlaceholder:
      "Opcional: escribe el significado de tu carta en otro idioma...",
    writerTranslationHint:
      "Es opcional, pero ayuda a lectores de otras culturas a entender tu carta.",
    writerTranslationTitle: "Traducción / significado del autor"
  },

  vi: {
    writerTranslationLabel: "Bản dịch / ý nghĩa của người viết",
    writerTranslationPlaceholder:
      "Tùy chọn: viết ý nghĩa lá thư của bạn bằng ngôn ngữ khác...",
    writerTranslationHint:
      "Không bắt buộc, nhưng giúp người đọc từ nền văn hóa khác hiểu thư của bạn.",
    writerTranslationTitle: "Bản dịch / ý nghĩa của người viết"
  },

  ru: {
    writerTranslationLabel: "Перевод / смысл от автора",
    writerTranslationPlaceholder:
      "Необязательно: напишите смысл письма на другом языке...",
    writerTranslationHint:
      "Это необязательно, но помогает читателям из других культур понять письмо.",
    writerTranslationTitle: "Перевод / смысл от автора"
  },

  my: {
    writerTranslationLabel: "ရေးသူ၏ ဘာသာပြန် / အဓိပ္ပါယ်",
    writerTranslationPlaceholder:
      "ရွေးချယ်ရန်: သင့်စာ၏ အဓိပ္ပါယ်ကို အခြားဘာသာဖြင့် ရေးပါ...",
    writerTranslationHint:
      "မဖြစ်မနေမဟုတ်ပါ။ သို့သော် အခြားယဉ်ကျေးမှုမှ စာဖတ်သူများ နားလည်ရန် ကူညီပါသည်။",
    writerTranslationTitle: "ရေးသူ၏ ဘာသာပြန် / အဓိပ္ပါယ်"
  },

  zh: {
    writerTranslationLabel: "作者翻译 / 含义",
    writerTranslationPlaceholder:
      "可选：用另一种语言写下这封信的含义...",
    writerTranslationHint:
      "这不是必填项，但可以帮助不同文化的读者理解你的信。",
    writerTranslationTitle: "作者翻译 / 含义"
  },

  ja: {
    writerTranslationLabel: "作者による翻訳 / 意味",
    writerTranslationPlaceholder:
      "任意：手紙の意味を別の言語で書いてください...",
    writerTranslationHint:
      "必須ではありませんが、他の文化の読者が手紙を理解する助けになります。",
    writerTranslationTitle: "作者による翻訳 / 意味"
  }
};

Object.keys(manualTranslationTranslations).forEach((languageCode) => {
  translations[languageCode] = {
    ...translations[languageCode],
    ...manualTranslationTranslations[languageCode]
  };
});
// =======================================================
// 댓글 작성자 표시 문구 추가
// =======================================================

const commentProfileTranslations = {
  en: {
    myComment: "Me"
  },
  ko: {
    myComment: "나"
  },
  es: {
    myComment: "Yo"
  },
  vi: {
    myComment: "Tôi"
  },
  ru: {
    myComment: "Я"
  },
  my: {
    myComment: "ကျွန်ုပ်"
  },
  zh: {
    myComment: "我"
  },
  ja: {
    myComment: "自分"
  }
};

Object.keys(commentProfileTranslations).forEach((languageCode) => {
  translations[languageCode] = {
    ...translations[languageCode],
    ...commentProfileTranslations[languageCode]
  };
});
// =======================================================
// Utility
// =======================================================

function t(key) {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

function showLoading() {
  loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
  loadingOverlay.classList.add("hidden");
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(16px)";
  }, 2600);

  setTimeout(() => {
    toast.remove();
  }, 3100);
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) {
    return "-";
  }

  const date = timestamp.toDate();

  return new Intl.DateTimeFormat(currentLanguage, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}
const MIN_CONTENT_LENGTH = 30;

// =======================================================
// Translation Helpers
// Firebase Functions translateText 호출
// =======================================================

function getOriginalLetterText(letter) {
  if (!letter) {
    return "";
  }

  return (
    letter.originalContent ||
    letter.content ||
    letter.translated?.[letter.originalLanguage] ||
    letter.translated?.en ||
    letter.translated?.ko ||
    ""
  );
}

async function translateTextWithFunction(text, targetLanguage) {
  const cleanText = String(text || "").trim();

  if (!cleanText || !targetLanguage) {
    return cleanText;
  }

  const result = await translateTextFunction({
    text: cleanText,

    // functions/index.js에서 둘 다 받을 수 있게 보냄
    targetLanguage,
    targetLang: targetLanguage
  });

  return (
    result.data?.translatedText ||
    result.data?.text ||
    result.data?.translation ||
    cleanText
  );
}

async function getTranslatedLetterTitle(letter) {
  if (!letter) {
    return "";
  }

  const originalTitle = String(letter.originalTitle || letter.title || "").trim();

  if (!originalTitle) {
    return "";
  }

  const cachedTitle = letter.apiTitleTranslations?.[currentLanguage];

  if (cachedTitle) {
    return cachedTitle;
  }

  const translatedTitle = await translateTextWithFunction(
    originalTitle,
    currentLanguage
  );

  try {
    await updateDoc(
      doc(db, "letters", letter.id),
      {
        [`apiTitleTranslations.${currentLanguage}`]: translatedTitle
      }
    );

    letter.apiTitleTranslations = {
      ...(letter.apiTitleTranslations || {}),
      [currentLanguage]: translatedTitle
    };
  } catch (cacheError) {
    console.warn("제목 번역 캐시 저장 실패:", cacheError);
  }

  return translatedTitle;
}

async function getTranslatedLetterContent(letter) {
  if (!letter) {
    return "";
  }

  const originalText = getOriginalLetterText(letter);

  if (!originalText) {
    return "";
  }

  const cachedText = letter.apiTranslations?.[currentLanguage];

  if (cachedText) {
    return cachedText;
  }

  const translatedText = await translateTextWithFunction(
    originalText,
    currentLanguage
  );

  try {
    await updateDoc(
      doc(db, "letters", letter.id),
      {
        [`apiTranslations.${currentLanguage}`]: translatedText
      }
    );

    letter.apiTranslations = {
      ...(letter.apiTranslations || {}),
      [currentLanguage]: translatedText
    };
  } catch (cacheError) {
    console.warn("편지 번역 캐시 저장 실패:", cacheError);
  }

  return translatedText;
}

async function getTranslatedCommentText(letterId, commentId, comment) {
  if (!comment) {
    return "";
  }

  const originalText = String(comment.text || "").trim();

  if (!originalText) {
    return "";
  }

  const cachedText = comment.apiTranslations?.[currentLanguage];

  if (cachedText) {
    return cachedText;
  }

  const translatedText = await translateTextWithFunction(
    originalText,
    currentLanguage
  );

  return translatedText;
}
function updateContentCounter() {
  if (!contentInput || !contentCount) {
    return;
  }

  const length = contentInput.value.trim().length;
  contentCount.textContent = `${length} / ${MIN_CONTENT_LENGTH} ${t("minimumCharacters")}`;

  contentCount.classList.toggle("ok", length >= MIN_CONTENT_LENGTH);
}
// =======================================================
// Language
// =======================================================

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  document.title = t("appTitle");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    element.placeholder = t(key);
  });

  document.querySelectorAll("[data-emotion-option]").forEach((option) => {
    const emotionKey = option.dataset.emotionOption;
    option.textContent = t(emotionKey);
  });

  darkModeIcon.textContent = isDarkMode ? "☀️" : "🌙";

  const darkModeText = darkModeBtn.querySelector("[data-i18n]");
  if (darkModeText) {
    darkModeText.textContent = isDarkMode ? t("lightMode") : t("darkMode");
  }

  renderNationalityFilter();
  renderLetters();
}

languageSelect.value = currentLanguage;

languageSelect.addEventListener("change", (event) => {
  currentLanguage = event.target.value;
  localStorage.setItem("penpal-language", currentLanguage);
  applyLanguage();
});

// =======================================================
// Dark Mode
// =======================================================

function applyDarkMode() {
  document.body.classList.toggle("dark", isDarkMode);
  localStorage.setItem("penpal-dark-mode", String(isDarkMode));
  applyLanguage();
}

darkModeBtn.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  applyDarkMode();
});
// =======================================================
// Nationality Profile Modal
// =======================================================

function updateUserNationalityButton() {
  const nationalityName = currentUserData?.nationalityName;
  const nationalityFlag = currentUserData?.nationalityFlag || "🌏";

  if (nationalitySettingBtn && userNationalityFlag && userNationalityText) {
    userNationalityFlag.textContent = nationalityFlag;

    if (nationalityName) {
      userNationalityText.textContent = `${t("currentNationality")}: ${nationalityName}`;
    } else {
      userNationalityText.textContent = t("setNationality");
    }
  }

  if (formNationalityFlag && formNationalityText) {
    formNationalityFlag.textContent = nationalityFlag;

    if (nationalityName) {
      formNationalityText.textContent = `${nationalityFlag} ${nationalityName}`;
    } else {
      formNationalityText.textContent = t("setNationality");
    }
  }
}

function renderNationalityOptions() {
  if (!nationalityOptions) {
    return;
  }

  const activeCode =
    selectedNationalityCode || currentUserData?.nationalityCode || "";

  nationalityOptions.innerHTML = "";

  ASIAN_NATIONALITIES.forEach((nationality) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nationality-option";
    button.dataset.code = nationality.code;

    if (activeCode === nationality.code) {
      button.classList.add("selected");
    }

    button.innerHTML = `
      <span class="nationality-option-flag">${escapeHTML(nationality.flag)}</span>

      <span class="nationality-option-main">
        <strong>${escapeHTML(nationality.name)}</strong>
        <small>${escapeHTML(nationality.en)}</small>
      </span>
    `;

    button.addEventListener("click", async () => {
  selectedNationalityCode = nationality.code;
  await saveUserNationality();
});

    nationalityOptions.appendChild(button);
  });

  if (saveNationalityBtn) {
    saveNationalityBtn.disabled = !activeCode;
  }
}

function openNationalityModal(force = false) {
  if (!nationalityModal) {
    return;
  }

  nationalityModalLocked = force;
  selectedNationalityCode = currentUserData?.nationalityCode || null;

  if (nationalityModalCloseBtn) {
    nationalityModalCloseBtn.classList.toggle("hidden", force);
  }

  if (nationalityModalNotice) {
    nationalityModalNotice.textContent = force
      ? t("nationalityModalLock")
      : t("nationalityModalChangeGuide");
  }

  renderNationalityOptions();
  nationalityModal.classList.remove("hidden");
  if (saveNationalityBtn) {
  saveNationalityBtn.classList.add("hidden");
}
}

function closeNationalityModal() {
  if (nationalityModalLocked) {
    return;
  }

  nationalityModal.classList.add("hidden");
}

async function saveUserNationality() {
  if (!currentUser) {
    showToast(t("loginFail"), "error");
    return;
  }

  const selectedNationality = ASIAN_NATIONALITIES.find(
    (item) => item.code === selectedNationalityCode
  );

  if (!selectedNationality) {
    showToast(t("nationalityRequired"), "error");
    return;
  }

  showLoading();

  try {
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        nationalityCode: selectedNationality.code,
        nationalityName: selectedNationality.name,
        nationalityFlag: selectedNationality.flag,
        nationalityEnglishName: selectedNationality.en,
        nationalityUpdatedAt: serverTimestamp()
      },
      { merge: true }
    );

  currentUserData = {
  ...(currentUserData || {}),
  nationalityCode: selectedNationality.code,
  nationalityName: selectedNationality.name,
  nationalityFlag: selectedNationality.flag,
  nationalityEnglishName: selectedNationality.en
};

    nationalityModalLocked = false;
    nationalityModal.classList.add("hidden");

    updateUserNationalityButton();
    showToast(t("nationalitySaved"), "success");
  } catch (error) {
    console.error("국적 저장 오류:", error);
    showToast(t("networkError"), "error");
  } finally {
    hideLoading();
  }
}

nationalitySettingBtn?.addEventListener("click", () => {
  openNationalityModal(false);
});
openNationalityFromFormBtn?.addEventListener("click", () => {
  openNationalityModal(false);
});

nationalityModalCloseBtn?.addEventListener("click", closeNationalityModal);

saveNationalityBtn?.addEventListener("click", saveUserNationality);

nationalityModal?.addEventListener("click", (event) => {
  if (event.target === nationalityModal) {
    closeNationalityModal();
  }
});
// =======================================================
// Splash Screen
// 처음 접속 시 PenPal Station 화면을 1초 보여준 뒤 메인으로 전환
// =======================================================

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function showSplashThenMain() {
  loginView.classList.remove("hidden");
  loginView.classList.remove("splash-hide");

  appView.classList.add("hidden");
  appView.classList.remove("app-show");

  await delay(1000);

  loginView.classList.add("splash-hide");

  await delay(450);

  loginView.classList.add("hidden");
  loginView.classList.remove("splash-hide");

  appView.classList.remove("hidden");
  appView.classList.add("app-show");
}
// =======================================================
// Auth
// Firebase Anonymous Login
// =======================================================

let isSigningInAnonymously = false;

async function startAnonymousLogin() {
  if (isSigningInAnonymously) {
    return;
  }

  isSigningInAnonymously = true;
  showLoading();

  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error("익명 로그인 오류:", error);

    if (loginError) {
      loginError.textContent = t("loginFail");
    }

    showToast(t("loginFail"), "error");
  } finally {
    isSigningInAnonymously = false;
    hideLoading();
  }
}

// 구글 로그인 버튼이 HTML에 남아 있어도 더 이상 사용하지 않음


logoutBtn?.addEventListener("click", async () => {
  showLoading();

  try {
    await signOut(auth);
  } catch (error) {
    console.error("로그아웃 오류:", error);
    showToast(t("logoutFail"), "error");
  } finally {
    hideLoading();
  }
});

onAuthStateChanged(auth, async (user) => {
  console.log("현재 로그인 사용자:", user);

  cleanupRealtimeListeners();

  if (!user) {
    currentUser = null;
    currentUserData = null;
    allLetters = [];

    loginView.classList.remove("hidden");
    loginView.classList.remove("splash-hide");

    appView.classList.add("hidden");
    appView.classList.remove("app-show");

    // 사이트 접속 시 자동 익명 로그인
    await startAnonymousLogin();

    return;
  }

  currentUser = user;

  try {
    await createUserIfNeeded(user.uid);
    listenToUserPoints(user.uid);
    listenToLetters();

    hideLoading();

    // 로그인 성공 후에도 로고 화면을 1초 보여주고 메인 화면 표시
    await showSplashThenMain();
  } catch (error) {
    console.error("Firestore 연결 오류:", error);
    showToast(t("firestoreConnectFail"), "error");

    hideLoading();

    // Firestore 연결에 문제가 있어도 화면은 보여줌
    await showSplashThenMain();
  }
});
// =======================================================
// Firestore: User
// =======================================================

async function createUserIfNeeded(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      viewedLetters: [],

      nationalityCode: "",
      nationalityName: "",
      nationalityFlag: "🌏",

      profileCode: createProfileCode(),

      createdAt: serverTimestamp()
    });

    return;
  }

  const userData = userSnap.data();

  const patchData = {};

  if (!("viewedLetters" in userData)) {
    patchData.viewedLetters = [];
  }

  if (!("nationalityCode" in userData)) {
    patchData.nationalityCode = "";
    patchData.nationalityName = "";
    patchData.nationalityFlag = "🌏";
  }

  if (!("profileCode" in userData)) {
    patchData.profileCode = createProfileCode();
  }

  if (Object.keys(patchData).length > 0) {
    await setDoc(userRef, patchData, { merge: true });
  }
}

function listenToUserPoints(uid) {
  const userRef = doc(db, "users", uid);

  unsubscribeUser = onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        currentUserData = null;
        return;
      }

      currentUserData = snapshot.data();

      updateUserNationalityButton();

      if (!currentUserData.nationalityCode) {
        openNationalityModal(true);
      }
    },
    (error) => {
      console.error("사용자 정보 실시간 읽기 오류:", error);
      showToast(t("firestoreReadFail"), "error");
    }
  );
}

function cleanupRealtimeListeners() {
  if (unsubscribeUser) {
    unsubscribeUser();
    unsubscribeUser = null;
  }

  if (unsubscribeLetters) {
    unsubscribeLetters();
    unsubscribeLetters = null;
  }

  if (unsubscribeComments) {
    unsubscribeComments();
    unsubscribeComments = null;
  }
}
// =======================================================
// Firestore: Letters
// =======================================================

function listenToLetters() {
  const lettersQuery = query(
    collection(db, "letters"),
    orderBy("createdAt", "desc")
  );

  unsubscribeLetters = onSnapshot(
    lettersQuery,
    (snapshot) => {
  allLetters = snapshot.docs.map((document) => ({
  id: document.id,
  ...document.data()
}));

      updateUserNationalityButton();

if (nationalityModal && !nationalityModal.classList.contains("hidden")) {
  renderNationalityOptions();

  if (nationalityModalNotice) {
    nationalityModalNotice.textContent = nationalityModalLocked
      ? t("nationalityModalLock")
      : t("nationalityModalChangeGuide");
  }
}

renderNationalityFilter();
renderLetters();
    },
    (error) => {
      console.error("편지 실시간 읽기 오류:", error);
      showToast(t("firestoreReadFail"), "error");
    }
  );
}

// =======================================================
// Letter Upload
// =======================================================

contentInput?.addEventListener("input", updateContentCounter);

letterForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    showToast(t("loginFail"), "error");
    return;
  }

  const title = titleInput.value.trim();
  const emotion = emotionInput.value;
  const content = contentInput.value.trim();

  if (!currentUserData?.nationalityCode) {
    showToast(t("nationalityRequired"), "error");
    openNationalityModal(true);
    return;
  }

  const nationality = currentUserData.nationalityName;
  const nationalityCode = currentUserData.nationalityCode;
  const nationalityFlag = currentUserData.nationalityFlag || "🌏";

  if (!title || !nationality || !emotion || !content) {
    showToast(t("requiredError"), "error");
    return;
  }

  if (content.length < MIN_CONTENT_LENGTH) {
    showToast(t("minContentError"), "error");
    return;
  }

  showLoading();

  try {
    // =======================================================
    // 번역 API 연동 위치
    // 현재는 모든 언어에 원문 저장
    // =======================================================

    const translated = {
      en: content,
      ko: content,
      es: content,
      vi: content,
      ru: content,
      my: content,
      zh: content,
      ja: content
    };

    await addDoc(collection(db, "letters"), {
  title,

  nationality,
  nationalityCode,
  nationalityFlag,

  emotion,
  originalContent: content,
  originalLanguage: currentLanguage,

  authorUid: currentUser.uid,
  authorProfileCode: currentUserData.profileCode || "",

  // 예전 구조 유지용
  translated,

  // 실제 Google Translate API 결과는 여기에 저장됨
  apiTranslations: {},

  commentCount: 0,

  createdAt: serverTimestamp()
});

    letterForm.reset();
    updateContentCounter();

    closeMobileWritePanel();

    showToast(t("uploadSuccess"), "success");

    letterList.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {
    console.error("편지 업로드 오류:", error);

    if (!navigator.onLine) {
      showToast(t("networkError"), "error");
    } else {
      showToast(t("uploadFail"), "error");
    }
  } finally {
    hideLoading();
  }
});
// =======================================================
// Filtering & Rendering
// =======================================================

function renderNationalityFilter() {
  const selectedValue = nationalityFilter.value || "all";

const nationalities = [
  ...new Set(
      allLetters
        .map((letter) => letter.nationality)
        .filter(Boolean)
        .map((value) => value.trim())
    )
  ].sort((a, b) => a.localeCompare(b));

  nationalityFilter.innerHTML = `
    <option value="all">${escapeHTML(t("allNationalities"))}</option>
  `;

  nationalities.forEach((nationality) => {
    const option = document.createElement("option");
    option.value = nationality;
    option.textContent = nationality;
    nationalityFilter.appendChild(option);
  });

  nationalityFilter.value = nationalities.includes(selectedValue)
    ? selectedValue
    : "all";
}

function getFilteredLetters() {
  const keyword = normalizeText(searchInput.value);
  const selectedNationality = nationalityFilter.value;
  const selectedEmotion = emotionFilter.value;
  const sortType = sortSelect.value;

  let filtered = [...allLetters];

  if (keyword) {
    filtered = filtered.filter((letter) =>
      normalizeText(letter.title).includes(keyword)
    );
  }

  if (selectedNationality !== "all") {
    filtered = filtered.filter(
      (letter) => letter.nationality === selectedNationality
    );
  }

  if (selectedEmotion !== "all") {
    filtered = filtered.filter((letter) => letter.emotion === selectedEmotion);
  }

  filtered.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;

    return sortType === "oldest" ? dateA - dateB : dateB - dateA;
  });

  return filtered;
}

async function renderLetters() {
  const filteredLetters = getFilteredLetters();

  letterCount.textContent = filteredLetters.length;
  letterList.innerHTML = "";

  if (filteredLetters.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  const envelopeColors = [
    "#ffd6e8",
    "#cfeeff",
    "#ded8ff",
    "#fff0c8",
    "#d9f7e5",
    "#ffe0cf",
    "#e4ddff",
    "#d7f3ff"
  ];

  for (const [index, letter] of filteredLetters.entries()) {
    const card = document.createElement("article");
    card.className = "letter-card envelope-card";

    const isOwner = currentUser && letter.authorUid === currentUser.uid;
    const alreadyViewed =
      currentUserData?.viewedLetters?.includes(letter.id) || false;

    const envelopeColor = envelopeColors[index % envelopeColors.length];
    card.style.setProperty("--envelope-color", envelopeColor);

    const commentCount = letter.commentCount ?? 0;

    let displayTitle = letter.title || "";

    try {
      displayTitle = await getTranslatedLetterTitle(letter);
    } catch (error) {
      console.error("목록 제목 번역 오류:", error);
      displayTitle = letter.title || "";
    }

    const deleteButtonHTML = isOwner
      ? `
        <button class="delete-btn" type="button" data-letter-id="${escapeHTML(letter.id)}">
          🗑️ ${escapeHTML(t("deleteLetter"))}
        </button>
      `
      : "";

    const viewedBadgeHTML =
      alreadyViewed || isOwner
        ? `<span class="viewed-badge">👀 ${escapeHTML(t("viewedLetter"))}</span>`
        : "";

    const myLetterBadgeHTML = isOwner
      ? `<span class="my-letter-badge">⭐ ${escapeHTML(t("myLetter"))}</span>`
      : "";

    card.innerHTML = `
      <div class="envelope-back"></div>
      <div class="envelope-flap-left"></div>
      <div class="envelope-flap-right"></div>
      <div class="envelope-flap-top"></div>
      <div class="envelope-seal">✦</div>

      <div class="envelope-content">
        <div class="envelope-top-row">
          <div class="envelope-chip-group">
            <span class="meta-chip nationality-chip">
              ${escapeHTML(letter.nationalityFlag || "🌍")} ${escapeHTML(letter.nationality)}
            </span>

            <span class="meta-chip emotion-only-chip">
              💌 ${escapeHTML(t(letter.emotion))}
            </span>

            <span class="meta-chip comment-count-badge">
              💬 ${escapeHTML(commentCount)}
            </span>
          </div>

          <div class="envelope-status-group">
            ${myLetterBadgeHTML}
            ${viewedBadgeHTML}
          </div>
        </div>

        <h3>${escapeHTML(displayTitle)}</h3>

        <div class="card-actions">
          <button class="read-btn" type="button" data-letter-id="${escapeHTML(letter.id)}">
            ✉️ ${escapeHTML(
              alreadyViewed || isOwner ? t("readAgain") : t("readLetter")
            )}
          </button>

          ${deleteButtonHTML}
        </div>
      </div>
    `;

    letterList.appendChild(card);
  }
}

searchInput.addEventListener("input", renderLetters);
nationalityFilter.addEventListener("change", renderLetters);
emotionFilter.addEventListener("change", renderLetters);
sortSelect.addEventListener("change", renderLetters);

// =======================================================
// Delete Letter
// =======================================================

letterList.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest(".delete-btn");

  if (!deleteButton) {
    return;
  }

  const letterId = deleteButton.dataset.letterId;
  const letter = allLetters.find((item) => item.id === letterId);

  if (!letter) {
    showToast(t("deleteFail"), "error");
    return;
  }

  if (!currentUser || letter.authorUid !== currentUser.uid) {
    showToast(t("cannotDelete"), "error");
    return;
  }

  const confirmed = window.confirm(t("deleteConfirm"));

  if (!confirmed) {
    return;
  }

  showLoading();

  try {
    await deleteDoc(doc(db, "letters", letterId));
    showToast(t("deleteSuccess"), "success");
  } catch (error) {
    console.error("편지 삭제 오류:", error);
    showToast(t("deleteFail"), "error");
  } finally {
    hideLoading();
  }
});

// =======================================================
// Read Letter
// 포인트 없이 자유롭게 읽기
// =======================================================

letterList.addEventListener("click", async (event) => {
  const readButton = event.target.closest(".read-btn");

  if (!readButton) {
    return;
  }

  const letterId = readButton.dataset.letterId;
  const letter = allLetters.find((item) => item.id === letterId);

  if (!letter) {
    showToast(t("readFail"), "error");
    return;
  }

  if (!currentUser) {
    showToast(t("loginFail"), "error");
    return;
  }

  try {
    // 읽은 편지 기록은 유지
    // 포인트 차감은 없음
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        viewedLetters: arrayUnion(letterId)
      },
      { merge: true }
    );

    const viewedLetters = currentUserData?.viewedLetters || [];

    currentUserData = {
  ...currentUserData,
  viewedLetters: [...new Set([...viewedLetters, letterId])]
};

await openLetterModal(letter, true);
  } catch (error) {
    console.error("편지 읽기 오류:", error);

    if (!navigator.onLine) {
      showToast(t("networkError"), "error");
    } else {
      showToast(t("readFail"), "error");
    }
  }
});
// =======================================================
// Init
// =======================================================
// =======================================================
// Open Letter Modal
// =======================================================

// =======================================================
// Open Letter Modal
// =======================================================

async function openLetterModal(letter, canComment = true) {
  activeLetterId = letter.id;

  const isOwner = currentUser && letter.authorUid === currentUser.uid;
  const alreadyViewed =
    currentUserData?.viewedLetters?.includes(letter.id) || false;

  activeLetterCanComment = Boolean(canComment || isOwner || alreadyViewed);

  modalEmotion.textContent = t(letter.emotion);
  modalMeta.textContent = `${t("nationalityMeta")}: ${letter.nationality}`;

  // 번역이 시작되는 느낌을 먼저 보여줌
  modalTitle.textContent = "🌐 Translating title...";
  modalContent.textContent = "🌐 Translating letter...";

  letterModal.classList.remove("hidden");

  // 제목 번역
  try {
    const translatedTitle = await getTranslatedLetterTitle(letter);
    modalTitle.textContent = translatedTitle || letter.title || "";
  } catch (error) {
    console.error("제목 번역 오류:", error);
    modalTitle.textContent = letter.title || "";
  }

  // 편지 내용 번역
  try {
    const translatedContent = await getTranslatedLetterContent(letter);
    modalContent.textContent = translatedContent;
  } catch (error) {
    console.error("편지 번역 오류:", error);
    modalContent.textContent = letter.originalContent || letter.content || "";
    showToast(t("translateFail"), "error");
  }

  // 작성자 직접 해석 영역은 숨김
  if (writerTranslationSection && writerTranslationContent) {
    writerTranslationContent.textContent = "";
    writerTranslationSection.classList.add("hidden");
  }

  setupCommentSection(letter.id, activeLetterCanComment);
}
// =======================================================
// Comments
// =======================================================

function setupCommentSection(letterId, canComment) {
  if (!commentSection || !commentForm || !commentInput || !commentList) {
    console.warn("댓글 HTML 요소가 없습니다. index.html의 commentSection을 확인하세요.");
    return;
  }

  commentSection.classList.remove("hidden");
  commentInput.value = "";

  if (canComment) {
    commentForm.classList.remove("hidden");
    commentAccessText.textContent = t("commentAvailable");
  } else {
    commentForm.classList.add("hidden");
    commentAccessText.textContent = t("commentOnlyReaders");
  }

  listenToComments(letterId);
}

function listenToComments(letterId) {
  if (unsubscribeComments) {
    unsubscribeComments();
    unsubscribeComments = null;
  }

  const commentsQuery = query(
    collection(db, "letters", letterId, "comments"),
    orderBy("createdAt", "asc")
  );

  unsubscribeComments = onSnapshot(
    commentsQuery,
    async (snapshot) => {
      commentList.innerHTML = "";

      if (snapshot.empty) {
        commentList.innerHTML = `
          <p class="comment-empty">${escapeHTML(t("commentEmpty"))}</p>
        `;
        return;
      }

      for (const commentDoc of snapshot.docs) {
        const comment = commentDoc.data();

        const item = document.createElement("div");
        item.className = "comment-item";

        const flag = comment.authorNationalityFlag || "🌏";
        const nationality = comment.authorNationalityName || "Unknown";
        const profileCode = comment.authorProfileCode || "----";
        const isMyComment =
          currentUser && comment.authorUid === currentUser.uid;

        let translatedCommentText = comment.text || "";

        try {
          translatedCommentText = await getTranslatedCommentText(
            letterId,
            commentDoc.id,
            comment
          );
        } catch (error) {
          console.error("댓글 번역 오류:", error);
          translatedCommentText = comment.text || "";
        }

        item.innerHTML = `
          <div class="comment-profile">
            <div class="comment-avatar">
              <span>${escapeHTML(flag)}</span>
            </div>

            <div class="comment-profile-info">
              <div class="comment-user-line">
                <strong>${escapeHTML(nationality)}</strong>
                <span class="comment-code">#${escapeHTML(profileCode)}</span>
                ${
                  isMyComment
                    ? `<span class="my-comment-badge">${escapeHTML(t("myComment"))}</span>`
                    : ""
                }
              </div>

              <small>${escapeHTML(formatDate(comment.createdAt))}</small>
            </div>
          </div>

          <div class="comment-bubble">
            <p>${escapeHTML(translatedCommentText)}</p>
          </div>
        `;

        commentList.appendChild(item);
      }
    },
    (error) => {
      console.error("댓글 읽기 오류:", error);

      commentList.innerHTML = `
        <p class="comment-empty">${escapeHTML(t("firestoreReadFail"))}</p>
      `;
    }
  );
}

commentForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isSubmittingComment) {
    return;
  }

  if (!activeLetterId || !activeLetterCanComment) {
    showToast(t("commentOnlyReaders"), "error");
    return;
  }

  const text = commentInput.value.trim();

  if (!text) {
    return;
  }

  isSubmittingComment = true;

  try {
  const commentRef = doc(collection(db, "letters", activeLetterId, "comments"));
const letterRef = doc(db, "letters", activeLetterId);

await runTransaction(db, async (transaction) => {
  const letterSnap = await transaction.get(letterRef);

  if (!letterSnap.exists()) {
    throw new Error("LETTER_NOT_FOUND");
  }

  const currentCommentCount = letterSnap.data().commentCount ?? 0;

  transaction.set(commentRef, {
    text,
    originalLanguage: currentLanguage,
apiTranslations: {},

    // 댓글 작성자 정보
    authorUid: currentUser.uid,
    authorNationalityCode: currentUserData?.nationalityCode || "",
    authorNationalityName: currentUserData?.nationalityName || "Unknown",
    authorNationalityFlag: currentUserData?.nationalityFlag || "🌏",

    // 같은 국적 유저끼리도 구분하기 위한 익명 코드
    authorProfileCode: currentUserData?.profileCode || createProfileCode(),

    createdAt: serverTimestamp()
  });

  transaction.update(letterRef, {
    commentCount: currentCommentCount + 1
  });
});

    commentInput.value = "";
    showToast(t("commentSuccess"), "success");
  } catch (error) {
    console.error("댓글 작성 오류:", error);
    showToast(t("commentFail"), "error");
  } finally {
    isSubmittingComment = false;
  }
});


// =======================================================
// Close Letter Modal
// =======================================================

function closeLetterModal() {
  letterModal.classList.add("hidden");

  activeLetterId = null;
  activeLetterCanComment = false;
  if (writerTranslationSection && writerTranslationContent) {
  writerTranslationContent.textContent = "";
  writerTranslationSection.classList.add("hidden");
}

  if (unsubscribeComments) {
    unsubscribeComments();
    unsubscribeComments = null;
  }
}

modalCloseBtn.addEventListener("click", closeLetterModal);

letterModal.addEventListener("click", (event) => {
  if (event.target === letterModal) {
    closeLetterModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLetterModal();
  }
});

// =======================================================
// Mobile Write Panel
// 모바일에서만 편지 작성창을 모달처럼 열기
// =======================================================

function openMobileWritePanel() {
  document.body.classList.add("mobile-write-open");
  letterFormPanel?.classList.add("mobile-open");

  setTimeout(() => {
    letterFormPanel?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 80);
}

function closeMobileWritePanel() {
  document.body.classList.remove("mobile-write-open");
  letterFormPanel?.classList.remove("mobile-open");
}

mobileWriteBtn?.addEventListener("click", openMobileWritePanel);

mobileFormCloseBtn?.addEventListener("click", closeMobileWritePanel);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileWritePanel();
  }
});


mobileFormCloseBtn?.addEventListener("click", closeMobileWritePanel);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileWritePanel();
  }
});
// =======================================================
// Network Error
// =======================================================

window.addEventListener("offline", () => {
  showToast(t("networkError"), "error");
});
updateContentCounter();

applyDarkMode();
applyLanguage();
