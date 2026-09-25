import React from 'react'
import { ShieldCheck } from 'lucide-react'

const ProfileSecurityCard = ({ t }) => {
    return (
        <div className='bg-teal-50/80 border border-teal-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs sm:text-sm text-teal-950'>
            <ShieldCheck className='w-5 h-5 text-teal-600 shrink-0 mt-0.5' />
            <div>
                <h4 className='font-bold text-teal-900 mb-1'>
                    {t('securityTitle', 'Security & Email Verification')}
                </h4>
                <p className='text-teal-800/90 leading-relaxed text-xs'>
                    {t(
                        'securityDesc',
                        'Any change to your account email address requires verification using a 6-digit OTP code sent directly to your new email inbox.'
                    )}
                </p>
            </div>
        </div>
    )
}

export default ProfileSecurityCard
