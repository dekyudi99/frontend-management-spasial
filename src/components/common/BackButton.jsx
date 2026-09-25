import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

/**
 * Reusable BackButton component for AstraGIS pages.
 * Mirrored after the clean back button pattern in Workspace.jsx.
 *
 * @param {string} [to] - Specific target path to navigate to (e.g. "/dashboard"). If omitted, navigates back (-1).
 * @param {string} [label] - Custom text for the button. Defaults to translated "Back" (or "Kembali" / "ย้อนกลับ").
 * @param {string} [fallbackTo="/dashboard"] - Route to navigate to if user directly opened the URL and there is no history.
 * @param {string} [className=""] - Additional custom classes for spacing / margins.
 * @param {React.ReactNode} [icon] - Custom icon component. Defaults to ArrowLeft with hover animation.
 */
const BackButton = ({
    to,
    label,
    fallbackTo = '/dashboard',
    className = '',
    icon,
}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()

    const handleClick = () => {
        if (to) {
            navigate(to)
        } else if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate(fallbackTo)
        }
    }

    const displayText = label || t('back', 'Back')

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition mb-3 sm:mb-4 group cursor-pointer ${className}`}
        >
            {icon ? (
                icon
            ) : (
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-slate-500 group-hover:text-slate-800" />
            )}
            <span className="font-medium">{displayText}</span>
        </button>
    )
}

export default BackButton
