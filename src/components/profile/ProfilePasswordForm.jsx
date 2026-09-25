import React from 'react'
import { Card, Form, Input, Button } from 'antd'
import { Link } from 'react-router-dom'
import { Lock, KeyRound, CheckCircle2, HelpCircle } from 'lucide-react'

const ProfilePasswordForm = ({ form, onFinish, loading, t }) => {
    return (
        <Card
            className='shadow-sm border border-slate-200/80 rounded-2xl overflow-hidden'
            title={
                <div className='flex items-center gap-2.5 py-1'>
                    <div className='w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold'>
                        <Lock className='w-4 h-4' />
                    </div>
                    <div>
                        <h3 className='text-base font-bold text-slate-800'>
                            {t('changePasswordTitle', 'Change Password')}
                        </h3>
                        <p className='text-xs text-slate-400 font-normal'>
                            {t('changePasswordDesc', 'Ensure your account stays secure with a strong password')}
                        </p>
                    </div>
                </div>
            }
        >
            <Form
                form={form}
                layout='vertical'
                onFinish={onFinish}
                requiredMark="optional"
                className='space-y-1'
            >
                <Form.Item
                    name="old_password"
                    label={
                        <span className='font-semibold text-slate-700 text-xs sm:text-sm'>
                            {t('oldPasswordLabel', 'Current Password')}
                        </span>
                    }
                    rules={[
                        { required: true, message: t('oldPasswordRequired', 'Please enter your current password') }
                    ]}
                    className='mb-4'
                >
                    <Input.Password
                        size="large"
                        prefix={<Lock className='w-4 h-4 text-slate-400 mr-1' />}
                        placeholder={t('oldPasswordPlaceholder', 'Enter current password')}
                        className='rounded-xl'
                    />
                </Form.Item>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2'>
                    <Form.Item
                        name="new_password"
                        label={
                            <span className='font-semibold text-slate-700 text-xs sm:text-sm'>
                                {t('newPasswordLabel', 'New Password')}
                            </span>
                        }
                        rules={[
                            { required: true, message: t('newPasswordRequired', 'Please enter new password') },
                            { min: 8, message: t('newPasswordMin', 'Minimum 8 characters') }
                        ]}
                        className='mb-2 sm:mb-0'
                    >
                        <Input.Password
                            size="large"
                            prefix={<KeyRound className='w-4 h-4 text-slate-400 mr-1' />}
                            placeholder={t('newPasswordPlaceholder', 'Minimum 8 characters')}
                            className='rounded-xl'
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirm_password"
                        label={
                            <span className='font-semibold text-slate-700 text-xs sm:text-sm'>
                                {t('confirmPasswordLabel', 'Confirm New Password')}
                            </span>
                        }
                        dependencies={['new_password']}
                        rules={[
                            { required: true, message: t('confirmPasswordRequired', 'Please confirm your new password') },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('new_password') === value) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(new Error(t('passwordMismatch', 'Passwords do not match!')))
                                },
                            }),
                        ]}
                        className='mb-2 sm:mb-0'
                    >
                        <Input.Password
                            size="large"
                            prefix={<KeyRound className='w-4 h-4 text-slate-400 mr-1' />}
                            placeholder={t('confirmPasswordPlaceholder', 'Repeat new password')}
                            className='rounded-xl'
                        />
                    </Form.Item>
                </div>

                <div className='flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-4'>
                    {/* Link Lupa Password jika pengguna lupa kata sandi lama */}
                    <Link
                        to="/auth/forgot-password"
                        className='inline-flex items-center gap-1.5 text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors'
                    >
                        <HelpCircle className='w-4 h-4' />
                        <span>{t('forgotPasswordLink', 'Forgot your password? Reset here')}</span>
                    </Link>

                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        icon={<CheckCircle2 className='w-4 h-4 mr-1' />}
                        loading={loading}
                        className='bg-teal-600 hover:bg-teal-500 font-semibold h-11 px-6 rounded-xl'
                    >
                        {t('updatePasswordBtn', 'Update Password')}
                    </Button>
                </div>
            </Form>
        </Card>
    )
}

export default ProfilePasswordForm
