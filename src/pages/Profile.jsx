import React, { useState, useEffect } from 'react'
import { Form, Button, message, Spin } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import authApi from '../api/AuthApi'
import OtpVerificationModal from '../components/auth/OtpVerificationModal'
import { useLanguage } from '../context/LanguageContext'
import ProfileIdentityCard from '../components/profile/ProfileIdentityCard'
import LanguageSelectCard from '../components/profile/LanguageSelectCard'
import ProfileSecurityCard from '../components/profile/ProfileSecurityCard'
import ProfileEditForm from '../components/profile/ProfileEditForm'
import ProfilePasswordForm from '../components/profile/ProfilePasswordForm'
import BackButton from '../components/common/BackButton'
import { UserCheck, AlertCircle } from 'lucide-react'

const appName = import.meta.env.VITE_APP_NAME || 'AstraGIS'

const Profile = () => {
    const queryClient = useQueryClient()
    const { language, setLanguage, t, translateApi } = useLanguage()
    const [profileForm] = Form.useForm()
    const [passwordForm] = Form.useForm()

    // State untuk Pergantian Email via OTP Modal
    const [isEmailOtpModalOpen, setIsEmailOtpModalOpen] = useState(false)
    const [pendingNewEmail, setPendingNewEmail] = useState('')

    useEffect(() => {
        document.title = `${t('profileTitle', 'Profile & Account Settings')} | ${appName}`
    }, [language, t])

    // Query Mengambil Data Profil Pengguna
    const {
        data: user,
        isLoading: isProfileLoading,
        isError: isProfileError,
        refetch: refetchProfile
    } = useQuery({
        queryKey: ['userProfile'],
        queryFn: authApi.getProfile,
        select: (res) => res.data?.data,
        staleTime: 0,
        refetchOnMount: 'always',
    })

    // Pastikan refetch saat komponen di-mount
    useEffect(() => {
        refetchProfile()
    }, [refetchProfile])

    // Set nilai form saat data user berhasil dimuat
    useEffect(() => {
        if (user) {
            profileForm.setFieldsValue({
                username: user.username,
                email: user.email,
            })
        }
    }, [user, profileForm])

    // Mutation 1: Update Username
    const updateProfileMutation = useMutation({
        mutationFn: authApi.updateProfile,
        onSuccess: (response) => {
            const data = response?.data
            message.success(translateApi(data?.detail) || t('saveChanges'))
            if (data?.access_token) {
                localStorage.setItem('JWT_TOKEN', data.access_token)
            }
            queryClient.invalidateQueries({ queryKey: ['userProfile'] })
        },
        onError: (error) => {
            message.error(translateApi(error.response?.data?.detail) || 'Failed to update profile.')
        }
    })

    // Mutation 2: Kirim OTP untuk Pergantian Email Baru
    const sendChangeEmailOtpMutation = useMutation({
        mutationFn: authApi.sendChangeEmailOtp,
        onSuccess: (response) => {
            const rawDetail = response?.data?.detail
            const fallbackMsg = `Verification OTP code has been sent to your new email (${pendingNewEmail}).`
            message.success(translateApi(rawDetail) || fallbackMsg)
            setIsEmailOtpModalOpen(true)
        },
        onError: (error) => {
            message.error(translateApi(error.response?.data?.detail) || 'Failed to send OTP to new email.')
        }
    })

    // Mutation 3: Ubah Password Akun
    const changePasswordMutation = useMutation({
        mutationFn: authApi.changePassword,
        onSuccess: (response) => {
            const data = response?.data
            message.success(translateApi(data?.detail) || 'Your password has been updated successfully!')
            passwordForm.resetFields()
        },
        onError: (error) => {
            message.error(translateApi(error.response?.data?.detail) || 'Failed to change password.')
        }
    })

    // Handler Submit Form Profil (Username & Email)
    const handleProfileSubmit = async (values) => {
        const trimmedUsername = values.username?.trim()
        const trimmedEmail = values.email?.trim().toLowerCase()
        const currentEmail = user?.email?.toLowerCase()
        const currentUsername = user?.username

        const isUsernameChanged = trimmedUsername && trimmedUsername !== currentUsername
        const isEmailChanged = trimmedEmail && trimmedEmail !== currentEmail

        if (!isUsernameChanged && !isEmailChanged) {
            message.info(t('noChanges', 'No changes were made.'))
            return
        }

        // Jika username berubah, simpan username terlebih dahulu
        if (isUsernameChanged) {
            const userFormData = new FormData()
            userFormData.append('username', trimmedUsername)
            try {
                await updateProfileMutation.mutateAsync(userFormData)
            } catch {
                return
            }
        }

        // Jika email berubah, kirim OTP ke email baru dan buka modal OTP
        if (isEmailChanged) {
            setPendingNewEmail(trimmedEmail)
            const emailFormData = new FormData()
            emailFormData.append('new_email', trimmedEmail)
            sendChangeEmailOtpMutation.mutate(emailFormData)
        }
    }

    // Handler Submit Form Ubah Kata Sandi
    const handlePasswordSubmit = (values) => {
        const formData = new FormData()
        formData.append('old_password', values.old_password)
        formData.append('new_password', values.new_password)
        changePasswordMutation.mutate(formData)
    }

    // Inisial untuk Avatar
    const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U'

    // Format Tanggal Registrasi Berdasarkan Bahasa Aktif
    const formatDate = (dateString) => {
        if (!dateString) return '-'
        try {
            const normalized = typeof dateString === 'string' && dateString.includes(' ') && !dateString.includes('T')
                ? dateString.replace(' ', 'T')
                : dateString
            const d = new Date(normalized)
            if (isNaN(d.getTime())) {
                return String(dateString)
            }
            const locale = language === 'id' ? 'id-ID' : language === 'th' ? 'th-TH' : 'en-US'
            return d.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } catch {
            return String(dateString)
        }
    }

    if (isProfileLoading) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500'>
                <Spin size="large" />
                <p className='text-sm'>{t('loadingProfile', 'Loading profile data...')}</p>
            </div>
        )
    }

    if (isProfileError) {
        return (
            <div className='max-w-xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center'>
                <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-3' />
                <h2 className='text-lg font-bold text-red-800 mb-1'>
                    {t('failedLoadProfile', 'Failed to Load Profile')}
                </h2>
                <p className='text-sm text-red-600 mb-4'>
                    {t('failedLoadProfileDesc', 'An error occurred while loading profile data. Your session might have expired.')}
                </p>
                <Button type="primary" onClick={() => refetchProfile()} className='bg-red-600 hover:bg-red-500'>
                    {t('retry', 'Retry')}
                </Button>
            </div>
        )
    }

    return (
        <div className='h-full overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8'>
            <div className='max-w-6xl mx-auto'>
                {/* Reusable Back Button */}
                <BackButton fallbackTo="/dashboard" />

                {/* Header Title Section */}
                <div className='mb-6 sm:mb-8'>
                    <div className='flex items-center gap-2 text-teal-600 text-xs sm:text-sm font-semibold mb-1'>
                        <UserCheck className='w-4 h-4' />
                        <span>{t('myAccount', 'My Account')}</span>
                    </div>
                    <h1 className='text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight'>
                        {t('profileTitle', 'Profile & Account Settings')}
                    </h1>
                    <p className='text-slate-500 text-xs sm:text-sm mt-1'>
                        {t('profileSubtitle', 'Manage your identity data, registered email, and account password security.')}
                    </p>
                </div>

                {/* Main Content Grid (12-column layout) */}
                <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
                    {/* Left Column: Identity, Language Preferences, and Security Notices (4 Columns) */}
                    <div className='lg:col-span-4 flex flex-col gap-6'>
                        <ProfileIdentityCard
                            user={user}
                            userInitial={userInitial}
                            formatDate={formatDate}
                            t={t}
                        />

                        <LanguageSelectCard
                            language={language}
                            setLanguage={setLanguage}
                            t={t}
                        />

                        <ProfileSecurityCard t={t} />
                    </div>

                    {/* Right Column: Edit Forms (8 Columns) */}
                    <div className='lg:col-span-8 flex flex-col gap-6'>
                        <ProfileEditForm
                            form={profileForm}
                            onFinish={handleProfileSubmit}
                            loading={updateProfileMutation.isPending || sendChangeEmailOtpMutation.isPending}
                            t={t}
                        />

                        <ProfilePasswordForm
                            form={passwordForm}
                            onFinish={handlePasswordSubmit}
                            loading={changePasswordMutation.isPending}
                            t={t}
                        />
                    </div>
                </div>
            </div>

            {/* Modal Input OTP Khusus Pergantian Email Menggunakan Reusable Component */}
            <OtpVerificationModal
                open={isEmailOtpModalOpen}
                onClose={() => setIsEmailOtpModalOpen(false)}
                email={pendingNewEmail}
                verifyFn={authApi.verifyChangeEmail}
                resendFn={authApi.sendChangeEmailOtp}
                emailParamName="new_email"
                title={t('otpModalTitle', 'Verify New Email')}
                subtitle={t('otpModalSubtitle', 'Email Change Verification')}
                submitText={t('otpModalSubmit', 'Verify & Update Email')}
                onSuccess={(data) => {
                    setIsEmailOtpModalOpen(false)
                    queryClient.invalidateQueries({ queryKey: ['userProfile'] })
                    profileForm.setFieldsValue({
                        email: pendingNewEmail
                    })
                }}
            />
        </div>
    )
}

export default Profile