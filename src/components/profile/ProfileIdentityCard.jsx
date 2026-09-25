import React from 'react'
import { Card, Tag, Divider } from 'antd'
import { User, Mail, Calendar, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react'

const ProfileIdentityCard = ({ user, userInitial, formatDate, t }) => {
    return (
        <Card className='shadow-sm border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-shadow'>
            {/* Card Decorative Banner */}
            <div className='-mx-6 -mt-6 h-28 bg-gradient-to-r from-teal-700 via-teal-600 to-blue-950 relative flex items-center justify-end pr-4'>
                <Sparkles className='w-16 h-16 text-white/10 absolute left-4' />
                <Tag className='m-0 border-0 bg-white/20 text-white font-medium px-2.5 py-0.5 rounded-full text-xs backdrop-blur-xs'>
                    {user?.role ? user.role.toUpperCase() : t('user', 'USER')}
                </Tag>
            </div>

            {/* Avatar & User Details */}
            <div className='relative flex flex-col items-center -mt-12 text-center pb-2'>
                <div className='w-24 h-24 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 p-1 shadow-lg ring-4 ring-white mb-3 flex items-center justify-center text-white text-3xl font-black'>
                    {userInitial}
                </div>

                <h2 className='text-xl font-bold text-slate-900 tracking-tight'>
                    {user?.username}
                </h2>
                <p className='text-xs sm:text-sm text-slate-500 font-mono mt-0.5 break-all max-w-[90%]'>
                    {user?.email}
                </p>

                <div className='flex flex-wrap items-center justify-center gap-1.5 mt-3'>
                    {user?.is_verified ? (
                        <Tag icon={<ShieldCheck className='w-3.5 h-3.5 inline mr-1 text-emerald-600' />} color="success" className='rounded-full text-xs font-medium'>
                            {t('verified', 'Verified')}
                        </Tag>
                    ) : (
                        <Tag icon={<AlertCircle className='w-3.5 h-3.5 inline mr-1 text-amber-600' />} color="warning" className='rounded-full text-xs font-medium'>
                            {t('unverified', 'Unverified')}
                        </Tag>
                    )}
                </div>
            </div>

            <Divider className='my-4' />

            {/* Additional Metadata */}
            <div className='space-y-3 text-xs sm:text-sm'>
                <div className='flex items-center justify-between text-slate-600'>
                    <span className='flex items-center gap-2 text-slate-500'>
                        <User className='w-4 h-4 text-teal-600' />
                        {t('usernameLabel', 'Username')}
                    </span>
                    <span className='font-semibold text-slate-800'>{user?.username}</span>
                </div>
                <div className='flex items-center justify-between text-slate-600'>
                    <span className='flex items-center gap-2 text-slate-500'>
                        <Mail className='w-4 h-4 text-teal-600' />
                        {t('emailLabel', 'Email Address')}
                    </span>
                    <span className='font-semibold text-slate-800 truncate max-w-[170px]' title={user?.email}>
                        {user?.email}
                    </span>
                </div>
                <div className='flex items-center justify-between text-slate-600'>
                    <span className='flex items-center gap-2 text-slate-500'>
                        <Calendar className='w-4 h-4 text-teal-600' />
                        {t('registrationDate', 'Tanggal Registrasi')}
                    </span>
                    <span className='font-semibold text-slate-800'>
                        {formatDate(user?.created_at || user?.createdAt)}
                    </span>
                </div>
            </div>
        </Card>
    )
}

export default ProfileIdentityCard
