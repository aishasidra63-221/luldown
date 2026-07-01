import { useParams } from "wouter";
import LangPage from "@/components/LangPage";
import { Lang, LANG_META } from "@/i18n/langMeta";

export default function ApkPage() {
  const params = useParams<{ lang?: string }>();
  const rawLang = params?.lang ?? "en";
  const lang: Lang = (rawLang in LANG_META ? rawLang : "en") as Lang;
  return <LangPage lang={lang} pageKey="apk" />;
}
