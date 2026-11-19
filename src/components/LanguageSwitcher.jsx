import React from "react";
import { Dropdown } from "antd";
import { useLanguage } from "../context/LanguageContext";
import { availableLanguages } from "../i18n/translations";

/**
 * Reusable language dropdown button backed by LanguageContext.
 */
export default function LanguageSwitcher({ compact = false }) {
    const { language, setLanguage, t } = useLanguage();
    const currentFlag = availableLanguages.find((l) => l.code === language)?.flag || "🌐";

    return (
        <Dropdown
            menu={{
                items: availableLanguages.map((lang) => ({
                    key: lang.code,
                    label: `${lang.flag} ${lang.nativeName}`,
                    onClick: () => setLanguage(lang.code),
                })),
                selectedKeys: [language],
            }}
            trigger={["click"]}
            placement="bottomRight"
        >
            <button
                type="button"
                className={`flex items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-blue-900 text-white hover:bg-blue-800 transition font-semibold cursor-pointer shrink-0 ${
                    compact ? "h-8 px-2.5 text-xs" : "h-10 px-2.5 sm:px-3 text-xs sm:text-sm"
                }`}
                title={t("changeLanguage", "Change Language")}
                aria-label={t("changeLanguage", "Change Language")}
            >
                <span className={compact ? "text-sm leading-none" : "text-sm sm:text-base leading-none"}>
                    {currentFlag}
                </span>
                <span className="uppercase tracking-wider font-bold leading-none">{language}</span>
            </button>
        </Dropdown>
    );
}
