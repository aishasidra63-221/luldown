import { Lang } from "./langMeta";

export interface DownloaderStrings {
  placeholder:  string;
  paste:        string;
  clear:        string;
  downloadNow:  string;
  pleaseWait:   string;
  rateLimitMsg: string; // use {s} for seconds
}

export const DOWNLOADER_UI: Record<Lang, DownloaderStrings> = {
  en: {
    placeholder:  "Paste TikTok link here...",
    paste:        "Paste",
    clear:        "Clear",
    downloadNow:  "Download Now",
    pleaseWait:   "Please wait…",
    rateLimitMsg: "Too many requests! Please wait ~{s} seconds...",
  },
  ur: {
    placeholder:  "یہاں TikTok لنک پیسٹ کریں...",
    paste:        "پیسٹ",
    clear:        "صاف",
    downloadNow:  "ابھی ڈاؤنلوڈ کریں",
    pleaseWait:   "براہ کرم انتظار کریں…",
    rateLimitMsg: "بہت زیادہ درخواستیں! براہ کرم ~{s} سیکنڈ انتظار کریں...",
  },
  hi: {
    placeholder:  "TikTok लिंक यहाँ पेस्ट करें...",
    paste:        "पेस्ट",
    clear:        "साफ़",
    downloadNow:  "अभी डाउनलोड करें",
    pleaseWait:   "कृपया प्रतीक्षा करें…",
    rateLimitMsg: "बहुत तेज़ अनुरोध! ~{s} सेकंड प्रतीक्षा करें...",
  },
  bn: {
    placeholder:  "এখানে TikTok লিংক পেস্ট করুন...",
    paste:        "পেস্ট",
    clear:        "মুছুন",
    downloadNow:  "এখনই ডাউনলোড করুন",
    pleaseWait:   "অনুগ্রহ করে অপেক্ষা করুন…",
    rateLimitMsg: "অনেক বেশি অনুরোধ! ~{s} সেকেন্ড অপেক্ষা করুন...",
  },
  id: {
    placeholder:  "Tempel tautan TikTok di sini...",
    paste:        "Tempel",
    clear:        "Hapus",
    downloadNow:  "Unduh Sekarang",
    pleaseWait:   "Mohon tunggu…",
    rateLimitMsg: "Terlalu banyak permintaan! Tunggu ~{s} detik...",
  },
  ar: {
    placeholder:  "الصق رابط TikTok هنا...",
    paste:        "لصق",
    clear:        "مسح",
    downloadNow:  "تحميل الآن",
    pleaseWait:   "يرجى الانتظار…",
    rateLimitMsg: "طلبات كثيرة جداً! انتظر ~{s} ثانية...",
  },
  tr: {
    placeholder:  "TikTok linkini buraya yapıştır...",
    paste:        "Yapıştır",
    clear:        "Temizle",
    downloadNow:  "Şimdi İndir",
    pleaseWait:   "Lütfen bekleyin…",
    rateLimitMsg: "Çok fazla istek! ~{s} saniye bekleyin...",
  },
  es: {
    placeholder:  "Pega el enlace de TikTok aquí...",
    paste:        "Pegar",
    clear:        "Borrar",
    downloadNow:  "Descargar Ahora",
    pleaseWait:   "Por favor espera…",
    rateLimitMsg: "¡Demasiadas solicitudes! Espera ~{s} segundos...",
  },
  pt: {
    placeholder:  "Cole o link do TikTok aqui...",
    paste:        "Colar",
    clear:        "Limpar",
    downloadNow:  "Baixar Agora",
    pleaseWait:   "Aguarde…",
    rateLimitMsg: "Muitas solicitações! Aguarde ~{s} segundos...",
  },
  vi: {
    placeholder:  "Dán liên kết TikTok vào đây...",
    paste:        "Dán",
    clear:        "Xóa",
    downloadNow:  "Tải Ngay",
    pleaseWait:   "Vui lòng đợi…",
    rateLimitMsg: "Quá nhiều yêu cầu! Vui lòng đợi ~{s} giây...",
  },
  fr: {
    placeholder:  "Collez le lien TikTok ici...",
    paste:        "Coller",
    clear:        "Effacer",
    downloadNow:  "Télécharger",
    pleaseWait:   "Veuillez patienter…",
    rateLimitMsg: "Trop de requêtes ! Attendez ~{s} secondes...",
  },
  de: {
    placeholder:  "TikTok-Link hier einfügen...",
    paste:        "Einfügen",
    clear:        "Löschen",
    downloadNow:  "Jetzt Herunterladen",
    pleaseWait:   "Bitte warten…",
    rateLimitMsg: "Zu viele Anfragen! Bitte ~{s} Sekunden warten...",
  },
  ja: {
    placeholder:  "TikTokのリンクをここに貼り付け...",
    paste:        "貼り付け",
    clear:        "クリア",
    downloadNow:  "今すぐダウンロード",
    pleaseWait:   "しばらくお待ちください…",
    rateLimitMsg: "リクエストが多すぎます！~{s}秒お待ちください...",
  },
  ko: {
    placeholder:  "TikTok 링크를 여기에 붙여넣기...",
    paste:        "붙여넣기",
    clear:        "지우기",
    downloadNow:  "지금 다운로드",
    pleaseWait:   "잠시 기다려주세요…",
    rateLimitMsg: "요청이 너무 많습니다! ~{s}초 기다려주세요...",
  },
  th: {
    placeholder:  "วางลิงก์ TikTok ที่นี่...",
    paste:        "วาง",
    clear:        "ล้าง",
    downloadNow:  "ดาวน์โหลดเลย",
    pleaseWait:   "กรุณารอสักครู่…",
    rateLimitMsg: "คำขอมากเกินไป! รอ ~{s} วินาที...",
  },
  it: {
    placeholder:  "Incolla il link TikTok qui...",
    paste:        "Incolla",
    clear:        "Cancella",
    downloadNow:  "Scarica Ora",
    pleaseWait:   "Attendere prego…",
    rateLimitMsg: "Troppe richieste! Attendi ~{s} secondi...",
  },
  pl: {
    placeholder:  "Wklej link TikTok tutaj...",
    paste:        "Wklej",
    clear:        "Wyczyść",
    downloadNow:  "Pobierz Teraz",
    pleaseWait:   "Proszę czekać…",
    rateLimitMsg: "Zbyt wiele żądań! Poczekaj ~{s} sekund...",
  },
};
