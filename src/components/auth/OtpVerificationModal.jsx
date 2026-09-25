import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, message } from 'antd'
import { useMutation } from '@tanstack/react-query'
import authApi from '../../api/AuthApi'
import { Mail, ShieldCheck, RefreshCw } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const OtpVerificationModal = ({
    open,
    onClose,
    email,
    onSuccess,
    title,
    subtitle,
    verifyFn = authApi.verifyEmail,
    resendFn = authApi.sendRegisterOtp,
    emailParamName = "email",
    submitText,
    countdownDuration = 60,
}) => {
    const { t, translateApi } = useLanguage()
    const [form] = Form.useForm()
    const [resendCountdown, setResendCountdown] = useState(0)

    const modalTitle = title || t('otpModalTitle', 'Email Verification Required')
    const modalSubtitle = subtitle || t('otpModalSubtitle', 'Account Not Yet Verified')
    const modalSubmitText = submitText || t('otpModalSubmit', 'Verify & Proceed')

    useEffect(() => {
        let timer
        if (resendCountdown > 0) {
            timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
        }
        return () => clearTimeout(timer)
    }, [resendCountdown])

    // Mulai countdown saat modal dibuka
    useEffect(() => {
        if (open) {
            form.resetFields()
            setResendCountdown(countdownDuration)
        }
    }, [open, form, countdownDuration])

    // Mutation Verifikasi OTP Email
    const verifyOtpMutation = useMutation({
        mutationFn: verifyFn,
        onSuccess: (response) => {
            const data = response?.data
            message.success(translateApi(data?.detail) || "Email successfully verified!")
            if (data?.access_token) {
                localStorage.setItem("JWT_TOKEN", data.access_token)
            }
            if (onSuccess) {
                onSuccess(data)
            }
        },
        onError: (error) => {
            message.error(translateApi(error.response?.data?.detail) || "Invalid or expired OTP code.")
        }
    })

    // Mutation Kirim Ulang OTP
    const resendOtpMutation = useMutation({
        mutationFn: resendFn,
        onSuccess: (response) => {
            message.success(translateApi(response?.data?.detail) || "A new OTP code has been sent to your email.")
            setResendCountdown(countdownDuration)
        },
        onError: (error) => {
            message.error(translateApi(error.response?.data?.detail) || "Failed to resend OTP code.")
        }
    })

    const onVerifyOtp = (values) => {
        const formData = new FormData()
        formData.append(emailParamName, email)
        if (emailParamName !== 'email') {
            formData.append('email', email)
        }
        formData.append('otp', values.otp)
        verifyOtpMutation.mutate(formData)
    }

    const handleResendOtp = () => {
        if (resendCountdown > 0 || !email) return
        const formData = new FormData()
        formData.append(emailParamName, email)
        if (emailParamName !== 'email') {
            formData.append('email', email)
        }
        resendOtpMutation.mutate(formData)
    }

    return (
        <Modal
            title={
                <div className='flex items-center gap-2 text-teal-800 font-bold text-base sm:text-lg'>
                    <ShieldCheck className='w-5 h-5 sm:w-6 sm:h-6 text-teal-600 shrink-0' />
                    <span className='truncate'>{modalTitle}</span>
                </div>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            destroyOnClose
            className='max-w-[92vw] sm:max-w-[440px]'
        >
            <div className='py-2'>
                <div className='bg-teal-50 border border-teal-200 rounded-xl p-3 sm:p-4 mb-4 flex items-start gap-3'>
                    <Mail className='w-5 h-5 text-teal-600 shrink-0 mt-0.5' />
                    <div className='text-xs sm:text-sm text-teal-950 w-full overflow-hidden'>
                        <p className='font-semibold text-teal-900 mb-0.5'>{modalSubtitle}</p>
                        <p className='text-slate-600'>{t('otpModalSentTo', "We've sent a 6-digit verification code to:")}</p>
                        <p className='font-mono font-bold text-xs sm:text-sm text-teal-700 mt-1 truncate'>{email}</p>
                    </div>
                </div>

                <Form form={form} layout='vertical' onFinish={onVerifyOtp}>
                    <Form.Item
                        name="otp"
                        label={<span className='font-semibold text-slate-700 text-xs sm:text-sm'>{t('otpModalCodeLabel', '6-Digit Verification Code')}</span>}
                        rules={[
                            { required: true, message: t('otpModalCodeRequired', "Please input the 6-digit OTP code") },
                            { len: 6, message: t('otpModalCodeLength', "OTP must be exactly 6 digits") }
                        ]}
                    >
                        <Input
                            placeholder="123456"
                            maxLength={6}
                            size="large"
                            className='tracking-widest text-center font-mono text-xl sm:text-2xl font-bold rounded-lg'
                            autoFocus
                        />
                    </Form.Item>

                    <div className='flex justify-between items-center mb-5 text-xs sm:text-sm'>
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendCountdown > 0 || resendOtpMutation.isPending}
                            className={`flex items-center gap-1.5 ${
                                resendCountdown > 0
                                    ? 'text-slate-400 cursor-not-allowed'
                                    : 'text-teal-600 hover:text-teal-700 font-semibold cursor-pointer underline'
                            }`}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${resendOtpMutation.isPending ? 'animate-spin' : ''}`} />
                            {resendCountdown > 0 ? `${t('otpModalResendIn', 'Resend in')} ${resendCountdown}s` : t('otpModalResendCode', 'Resend Code')}
                        </button>
                        <span className='text-slate-400 text-[11px] sm:text-xs'>{t('otpModalValidFor', 'Valid for 5 mins')}</span>
                    </div>

                    <Button
                        htmlType="submit"
                        type="primary"
                        size="large"
                        loading={verifyOtpMutation.isPending}
                        className='w-full bg-teal-600 hover:bg-teal-500 font-semibold h-11 rounded-lg'
                    >
                        {modalSubmitText}
                    </Button>
                </Form>
            </div>
        </Modal>
    )
}

export default OtpVerificationModal
