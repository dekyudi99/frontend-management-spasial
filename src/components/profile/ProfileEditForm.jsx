import React from 'react'
import { Card, Form, Input, Button } from 'antd'
import { User, Mail, Save } from 'lucide-react'

const ProfileEditForm = ({ form, onFinish, loading, t }) => {
    return (
        <Card
            className='shadow-sm border border-slate-200/80 rounded-2xl overflow-hidden'
            title={
                <div className='flex items-center gap-2.5 py-1'>
                    <div className='w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold'>
                        <User className='w-4 h-4' />
                    </div>
                    <div>
                        <h3 className='text-base font-bold text-slate-800'>
                            {t('editProfileTitle', 'Edit User Identity')}
                        </h3>
                        <p className='text-xs text-slate-400 font-normal'>
                            {t('editProfileDesc', 'Update your username or email address')}
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
                    name="username"
                    label={
                        <span className='font-semibold text-slate-700 text-xs sm:text-sm'>
                            {t('usernameLabel', 'Username')}
                        </span>
                    }
                    rules={[
                        { required: true, message: t('usernameRequired', 'Username cannot be empty') },
                        { min: 3, message: t('usernameMin', 'Username must be at least 3 characters') }
                    ]}
                    className='mb-4'
                >
                    <Input
                        size="large"
                        prefix={<User className='w-4 h-4 text-slate-400 mr-1' />}
                        placeholder={t('usernamePlaceholder', 'Enter new username')}
                        className='rounded-xl'
                    />
                </Form.Item>

                <Form.Item
                    name="email"
                    label={
                        <span className='font-semibold text-slate-700 text-xs sm:text-sm'>
                            {t('emailLabel', 'Email Address')}
                        </span>
                    }
                    rules={[
                        { required: true, message: t('emailRequired', 'Email cannot be empty') },
                        { type: 'email', message: t('emailInvalid', 'Invalid email address format') }
                    ]}
                    className='mb-2'
                    extra={
                        <p className='text-[11px] sm:text-xs text-slate-500 mt-1.5'>
                            {t(
                                'emailChangeHint',
                                '* If you change the email above, a 6-digit OTP verification code will automatically be sent to the new email address.'
                            )}
                        </p>
                    }
                >
                    <Input
                        size="large"
                        prefix={<Mail className='w-4 h-4 text-slate-400 mr-1' />}
                        placeholder={t('emailPlaceholder', 'name@email.com')}
                        className='rounded-xl'
                    />
                </Form.Item>

                <div className='pt-3 flex justify-end'>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        icon={<Save className='w-4 h-4 mr-1' />}
                        loading={loading}
                        className='bg-teal-600 hover:bg-teal-500 font-semibold h-11 px-6 rounded-xl'
                    >
                        {t('saveChanges', 'Save Changes')}
                    </Button>
                </div>
            </Form>
        </Card>
    )
}

export default ProfileEditForm
