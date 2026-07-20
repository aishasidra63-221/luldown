import { useParams } from "wouter";
import { AlertCircle } from "lucide-react";
import { Lang, LANG_META } from "@/i18n/langMeta";
import LangPage from "@/components/LangPage";

export default function StoryPage() {
  const params = useParams<{ lang?: string }>();
  const rawLang = params?.lang ?? "en";
  const lang: Lang = (rawLang in LANG_META ? rawLang : "en") as Lang;

  return (
    <LangPage
      lang={lang}
      pageKey="mp3"
      notice={
        <div className="error-box">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          Story download is not supported.
        </div>
      }
    />
  );
}
